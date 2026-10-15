"use strict";

const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  nativeImage,
  clipboard,
  dialog,
  ipcMain,
  shell,
  safeStorage,
  Notification,
} = require("electron");
const { DatabaseSync } = require("node:sqlite");

function createDatabase(filename) {
  const sqliteDb = new DatabaseSync(filename);
  let isOpen = true;
  Object.defineProperty(sqliteDb, "open", { get: () => isOpen });
  const origClose = sqliteDb.close.bind(sqliteDb);
  sqliteDb.close = () => {
    if (isOpen) {
      isOpen = false;
      origClose();
    }
  };
  sqliteDb.pragma = (sql, options) => {
    const trimmed = sql.trim();
    if (trimmed.includes("=")) {
      sqliteDb.exec(`PRAGMA ${trimmed};`);
      return;
    }
    const stmt = sqliteDb.prepare(`PRAGMA ${trimmed}`);
    if (options && options.simple) {
      const row = stmt.get();
      return row ? Object.values(row)[0] : undefined;
    }
    return stmt.all();
  };
  sqliteDb.transaction =
    (fn) =>
    (...args) => {
      sqliteDb.exec("BEGIN IMMEDIATE");
      try {
        const res = fn(...args);
        sqliteDb.exec("COMMIT");
        return res;
      } catch (err) {
        sqliteDb.exec("ROLLBACK");
        throw err;
      }
    };
  return sqliteDb;
}
const { createServer } = require("node:http");
const { spawn } = require("node:child_process");
const { randomBytes, createHash, timingSafeEqual } = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const APP_ID = "dev.promptshelf.desktop";
const MAX_LIBRARY_BYTES = 20 * 1024 * 1024;
const MAX_PROMPTS = 20000;
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
let mainWindow = null;
let tray = null;
let db = null;
let appServer = null;
let appServerPort = null;
let devServerProcess = null;
let schedulerTimer = null;
let backupInProgress = false;
let isQuitting = false;
let readyToQuit = false;
let closeFlushInProgress = false;
let shouldQuitAfterFlush = false;
let allowWindowClose = false;
let closeFlushTimeout = null;
let cachedVault = null;

function now() {
  return Date.now();
}
function slug(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function dbPath() {
  return path.join(app.getPath("userData"), "promptshelf.sqlite3");
}
function vaultPath() {
  return path.join(app.getPath("userData"), "google-drive.enc");
}
function backupSchedule() {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = 'backup_schedule'")
    .get();
  if (!row)
    return {
      enabled: false,
      intervalHours: 24,
      retentionCount: 10,
      notificationsEnabled: false,
    };
  try {
    const parsed = JSON.parse(row.value);
    return {
      enabled: parsed.enabled === true,
      intervalHours: [1, 6, 12, 24, 48, 168].includes(parsed.intervalHours)
        ? parsed.intervalHours
        : 24,
      retentionCount: Number.isInteger(parsed.retentionCount)
        ? Math.min(100, Math.max(1, parsed.retentionCount))
        : 10,
      notificationsEnabled: parsed.notificationsEnabled === true,
    };
  } catch {
    return {
      enabled: false,
      intervalHours: 24,
      retentionCount: 10,
      notificationsEnabled: false,
    };
  }
}

function initializeDatabase() {
  fs.mkdirSync(app.getPath("userData"), { recursive: true, mode: 0o700 });
  db = createDatabase(dbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.pragma("synchronous = FULL");

  // Keep each schema change atomic so an interrupted upgrade can be safely retried.
  const migrations = [
    {
      version: 1,
      apply: () =>
        db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          applied_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS collections (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          name_key TEXT NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS prompts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          content TEXT NOT NULL,
          collection_id TEXT NULL REFERENCES collections(id) ON DELETE SET NULL,
          favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
          pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'trash')),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          last_used_at INTEGER NULL,
          usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0)
        );
        CREATE INDEX IF NOT EXISTS idx_prompts_status_updated ON prompts(status, updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_prompts_collection ON prompts(collection_id);
        CREATE INDEX IF NOT EXISTS idx_prompts_favorite ON prompts(favorite) WHERE favorite = 1;
        CREATE INDEX IF NOT EXISTS idx_prompts_pinned ON prompts(pinned) WHERE pinned = 1;
        CREATE TABLE IF NOT EXISTS prompt_tags (
          prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
          tag TEXT NOT NULL,
          tag_key TEXT NOT NULL,
          PRIMARY KEY (prompt_id, tag_key)
        );
        CREATE INDEX IF NOT EXISTS idx_prompt_tags_key ON prompt_tags(tag_key);
        CREATE TABLE IF NOT EXISTS prompt_vars (
          prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
          position INTEGER NOT NULL,
          name TEXT NOT NULL,
          label TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('text', 'multiline', 'select')),
          default_value TEXT NOT NULL DEFAULT '',
          required INTEGER NOT NULL DEFAULT 0,
          options_json TEXT NOT NULL DEFAULT '[]',
          PRIMARY KEY (prompt_id, name)
        );
        CREATE TABLE IF NOT EXISTS prompt_versions (
          prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
          position INTEGER NOT NULL,
          at INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          PRIMARY KEY (prompt_id, position)
        );
        CREATE TABLE IF NOT EXISTS backup_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          destination TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          prompt_count INTEGER NOT NULL DEFAULT 0,
          size_bytes INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
          message TEXT NULL
        );
      `),
    },
  ];
  let version = Number(db.pragma("user_version", { simple: true }) || 0);
  const latestVersion = migrations[migrations.length - 1].version;
  if (version > latestVersion)
    throw new Error(
      `The PromptShelf database schema (${version}) is newer than this application supports (${latestVersion}). Update PromptShelf before opening this data directory.`,
    );
  for (const migration of migrations) {
    if (migration.version <= version) continue;
    db.transaction(() => {
      migration.apply();
      db.prepare(
        "INSERT OR REPLACE INTO schema_migrations(version, applied_at) VALUES (?, ?)",
      ).run(migration.version, now());
      db.pragma(`user_version = ${migration.version}`);
    })();
    version = migration.version;
  }
}

function safeLibraryObject(value) {
  if (
    !value ||
    typeof value !== "object" ||
    value.version !== 1 ||
    !Array.isArray(value.prompts) ||
    !Array.isArray(value.collections)
  ) {
    throw new Error("Library payload is invalid.");
  }
  if (value.prompts.length > MAX_PROMPTS || value.collections.length > 2000)
    throw new Error("Library has too many records.");
  if (Buffer.byteLength(JSON.stringify(value), "utf8") > MAX_LIBRARY_BYTES)
    throw new Error("Library is larger than the 20 MB safety limit.");
  const collectionIds = new Set();
  const collectionNames = new Set();
  for (const collection of value.collections) {
    if (
      !collection ||
      typeof collection.id !== "string" ||
      !collection.id ||
      collection.id.length > 160 ||
      typeof collection.name !== "string" ||
      !collection.name.trim() ||
      collection.name.length > 120
    ) {
      throw new Error("A collection record is invalid.");
    }
    const key = collection.name.toLowerCase().replace(/\s+/g, " ").trim();
    if (collectionIds.has(collection.id) || collectionNames.has(key))
      throw new Error("Collection IDs and names must be unique.");
    collectionIds.add(collection.id);
    collectionNames.add(key);
  }
  const promptIds = new Set();
  for (const prompt of value.prompts) {
    if (
      !prompt ||
      typeof prompt.id !== "string" ||
      !prompt.id ||
      prompt.id.length > 200 ||
      promptIds.has(prompt.id)
    )
      throw new Error("A prompt ID is invalid or duplicated.");
    promptIds.add(prompt.id);
    if (
      typeof prompt.title !== "string" ||
      prompt.title.length > 500 ||
      typeof prompt.content !== "string" ||
      Buffer.byteLength(prompt.content, "utf8") > 1_000_000 ||
      typeof (prompt.description ?? "") !== "string" ||
      (prompt.description ?? "").length > 5000 ||
      (prompt.favorite !== undefined && typeof prompt.favorite !== "boolean") ||
      (prompt.pinned !== undefined && typeof prompt.pinned !== "boolean")
    ) {
      throw new Error(`Prompt ${prompt.id} has invalid or oversized fields.`);
    }
    if (
      prompt.collectionId !== null &&
      prompt.collectionId !== undefined &&
      !collectionIds.has(prompt.collectionId)
    )
      throw new Error(`Prompt ${prompt.id} references an unknown collection.`);
    if (
      !Array.isArray(prompt.tags) ||
      prompt.tags.length > 100 ||
      prompt.tags.some((tag) => typeof tag !== "string" || tag.length > 100)
    )
      throw new Error(`Prompt ${prompt.id} has invalid tags.`);
    const variableNames = new Set();
    const invalidVariables =
      !Array.isArray(prompt.vars) ||
      prompt.vars.length > 200 ||
      prompt.vars.some((variable) => {
        if (
          !variable ||
          typeof variable.name !== "string" ||
          !/^[a-zA-Z_][\w]*$/.test(variable.name) ||
          !["text", "multiline", "select"].includes(variable.type) ||
          typeof variable.label !== "string" ||
          variable.label.length > 200 ||
          typeof variable.default !== "string" ||
          variable.default.length > 10000 ||
          typeof variable.required !== "boolean" ||
          !Array.isArray(variable.options) ||
          variable.options.length > 100 ||
          variable.options.some(
            (option) => typeof option !== "string" || option.length > 500,
          )
        )
          return true;
        if (variableNames.has(variable.name)) return true;
        variableNames.add(variable.name);
        return false;
      });
    const invalidVersions =
      !Array.isArray(prompt.versions) ||
      prompt.versions.length > 50 ||
      prompt.versions.some(
        (version) =>
          !version ||
          !Number.isFinite(version.at) ||
          typeof version.title !== "string" ||
          version.title.length > 500 ||
          typeof version.content !== "string" ||
          version.content.length > 1_000_000,
      );
    if (invalidVariables || invalidVersions)
      throw new Error(
        `Prompt ${prompt.id} has invalid template variables or revisions.`,
      );
    if (!["active", "archived", "trash"].includes(prompt.status))
      throw new Error(`Prompt ${prompt.id} has an invalid status.`);
  }
  return value;
}

function readLibrary() {
  const collections = db
    .prepare("SELECT id, name FROM collections ORDER BY rowid")
    .all();
  const promptRows = db
    .prepare(
      `SELECT id, title, description, content, collection_id, favorite, pinned, status, created_at, updated_at, last_used_at, usage_count FROM prompts ORDER BY updated_at DESC`,
    )
    .all();
  const tags = db
    .prepare("SELECT prompt_id, tag FROM prompt_tags ORDER BY rowid")
    .all();
  const vars = db
    .prepare(
      "SELECT prompt_id, name, label, type, default_value, required, options_json FROM prompt_vars ORDER BY prompt_id, position",
    )
    .all();
  const versions = db
    .prepare(
      "SELECT prompt_id, at, title, content FROM prompt_versions ORDER BY prompt_id, position",
    )
    .all();
  const seedVersion = db
    .prepare("SELECT value FROM settings WHERE key = 'seed_library_version'")
    .get();
  // An initialized-but-empty library is valid user data; only a never-initialized DB returns null.
  if (promptRows.length === 0 && collections.length === 0 && !seedVersion)
    return null;
  const byId = new Map();
  for (const row of promptRows) {
    byId.set(row.id, {
      id: row.id,
      title: row.title,
      description: row.description,
      content: row.content,
      collectionId: row.collection_id,
      favorite: Boolean(row.favorite),
      pinned: Boolean(row.pinned),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastUsedAt: row.last_used_at,
      usageCount: row.usage_count,
      tags: [],
      vars: [],
      versions: [],
    });
  }
  for (const row of tags) byId.get(row.prompt_id)?.tags.push(row.tag);
  for (const row of vars) {
    let options = [];
    try {
      options = JSON.parse(row.options_json);
    } catch {
      options = [];
    }
    byId.get(row.prompt_id)?.vars.push({
      name: row.name,
      label: row.label,
      type: row.type,
      default: row.default_value,
      required: Boolean(row.required),
      options,
    });
  }
  for (const row of versions)
    byId
      .get(row.prompt_id)
      ?.versions.push({ at: row.at, title: row.title, content: row.content });
  return {
    version: 1,
    seedLibraryVersion: seedVersion ? Number(seedVersion.value) : undefined,
    prompts: [...byId.values()],
    collections,
  };
}

function writeLibrary(input) {
  const value = safeLibraryObject(input);
  const insertCollection = db.prepare(
    "INSERT INTO collections(id, name, name_key) VALUES (?, ?, ?)",
  );
  const insertPrompt = db.prepare(
    `INSERT INTO prompts(id, title, description, content, collection_id, favorite, pinned, status, created_at, updated_at, last_used_at, usage_count) VALUES (@id, @title, @description, @content, @collectionId, @favorite, @pinned, @status, @createdAt, @updatedAt, @lastUsedAt, @usageCount)`,
  );
  const insertTag = db.prepare(
    "INSERT OR IGNORE INTO prompt_tags(prompt_id, tag, tag_key) VALUES (?, ?, ?)",
  );
  const insertVar = db.prepare(
    "INSERT INTO prompt_vars(prompt_id, position, name, label, type, default_value, required, options_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const insertVersion = db.prepare(
    "INSERT INTO prompt_versions(prompt_id, position, at, title, content) VALUES (?, ?, ?, ?, ?)",
  );
  const txn = db.transaction(() => {
    db.exec(
      "DELETE FROM prompt_tags; DELETE FROM prompt_vars; DELETE FROM prompt_versions; DELETE FROM prompts; DELETE FROM collections;",
    );
    for (const collection of value.collections) {
      const key = collection.name.toLowerCase().replace(/\s+/g, " ").trim();
      insertCollection.run(collection.id, collection.name.trim(), key);
    }
    for (const prompt of value.prompts) {
      insertPrompt.run({
        id: prompt.id,
        title: prompt.title,
        description: prompt.description ?? "",
        content: prompt.content,
        collectionId: prompt.collectionId ?? null,
        favorite: prompt.favorite ? 1 : 0,
        pinned: prompt.pinned ? 1 : 0,
        status: prompt.status ?? "active",
        createdAt: Number.isFinite(prompt.createdAt) ? prompt.createdAt : now(),
        updatedAt: Number.isFinite(prompt.updatedAt) ? prompt.updatedAt : now(),
        lastUsedAt: Number.isFinite(prompt.lastUsedAt)
          ? prompt.lastUsedAt
          : null,
        usageCount:
          Number.isInteger(prompt.usageCount) && prompt.usageCount >= 0
            ? prompt.usageCount
            : 0,
      });
      for (const tag of prompt.tags) {
        const key = tag.toLowerCase().trim();
        if (key) insertTag.run(prompt.id, tag.trim(), key);
      }
      prompt.vars.forEach((variable, position) => {
        if (
          !variable ||
          typeof variable.name !== "string" ||
          !/^[a-zA-Z_][\w]*$/.test(variable.name) ||
          !["text", "multiline", "select"].includes(variable.type)
        )
          throw new Error(`Prompt ${prompt.id} has an invalid variable.`);
        insertVar.run(
          prompt.id,
          position,
          variable.name,
          String(variable.label ?? variable.name).slice(0, 200),
          variable.type,
          String(variable.default ?? "").slice(0, 10000),
          variable.required ? 1 : 0,
          JSON.stringify(
            Array.isArray(variable.options)
              ? variable.options
                  .slice(0, 100)
                  .map((x) => String(x).slice(0, 500))
              : [],
          ),
        );
      });
      prompt.versions.forEach((version, position) =>
        insertVersion.run(
          prompt.id,
          position,
          Number.isFinite(version.at) ? version.at : now(),
          String(version.title ?? "").slice(0, 500),
          String(version.content ?? "").slice(0, 1_000_000),
        ),
      );
    }
    if (Number.isInteger(value.seedLibraryVersion)) {
      db.prepare(
        "INSERT INTO settings(key, value, updated_at) VALUES ('seed_library_version', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      ).run(String(value.seedLibraryVersion), now());
    }
  });
  txn();
  return { saved: true };
}

function readSetting(key, fallback = null) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : fallback;
}
function writeSetting(key, value) {
  db.prepare(
    "INSERT INTO settings(key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
  ).run(key, String(value), now());
}
function recordBackup(
  destination,
  status,
  message = null,
  promptCount = 0,
  sizeBytes = 0,
) {
  db.prepare(
    "INSERT INTO backup_history(destination, created_at, prompt_count, size_bytes, status, message) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(
    destination,
    now(),
    promptCount,
    sizeBytes,
    status,
    message ? String(message).slice(0, 2000) : null,
  );
  if (destination === "google-drive")
    writeSetting("last_backup_attempt_at", String(now()));
  if (status === "success" && destination === "google-drive") {
    writeSetting("last_backup_at", String(now()));
    db.prepare("DELETE FROM settings WHERE key = 'last_backup_error'").run();
  } else if (status === "failed")
    writeSetting(
      "last_backup_error",
      String(message || "Backup failed").slice(0, 2000),
    );
}

function trustedSender(event) {
  try {
    const url = new URL(event.senderFrame.url);
    return (
      event.senderFrame === event.sender.mainFrame &&
      url.hostname === "127.0.0.1" &&
      url.protocol === "http:" &&
      url.port === String(appServerPort)
    );
  } catch {
    return false;
  }
}
function registerHandler(name, handler) {
  ipcMain.handle(name, async (event, ...args) => {
    if (!trustedSender(event))
      throw new Error("Blocked IPC call from an untrusted frame.");
    return handler(...args);
  });
}

function requestRendererFlush(willQuit) {
  closeFlushInProgress = true;
  shouldQuitAfterFlush = Boolean(willQuit);
  if (closeFlushTimeout) clearTimeout(closeFlushTimeout);
  closeFlushTimeout = setTimeout(async () => {
    if (!closeFlushInProgress || !mainWindow || mainWindow.isDestroyed())
      return;
    // A crashed or unresponsive renderer must not trap the user in an unclosable window.
    mainWindow.show();
    const result = await dialog.showMessageBox(mainWindow, {
      type: "warning",
      buttons: ["Keep PromptShelf open", "Close without save confirmation"],
      defaultId: 0,
      cancelId: 0,
      message:
        "PromptShelf could not confirm that the latest changes were saved.",
      detail:
        "Keep the app open to retry, or close it knowing that recent unsaved changes may be lost.",
    });
    if (!closeFlushInProgress) return;
    const quitAfterClose = shouldQuitAfterFlush;
    closeFlushInProgress = false;
    shouldQuitAfterFlush = false;
    closeFlushTimeout = null;
    if (result.response !== 1) return;
    if (quitAfterClose) {
      readyToQuit = true;
      isQuitting = true;
      app.quit();
    } else {
      allowWindowClose = true;
      mainWindow?.close();
    }
  }, 15_000);
  mainWindow?.webContents.send("app:before-close", Boolean(willQuit));
}

async function writeJsonBackup(jsonText, suggestedName) {
  if (
    typeof jsonText !== "string" ||
    Buffer.byteLength(jsonText, "utf8") > MAX_LIBRARY_BYTES
  )
    throw new Error("Backup content is invalid or exceeds 20 MB.");
  const parsed = JSON.parse(jsonText);
  if (
    !parsed ||
    !Array.isArray(parsed.prompts) ||
    !Array.isArray(parsed.collections)
  )
    throw new Error("The backup does not look like a PromptShelf export.");
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export PromptShelf backup",
    defaultPath: path.join(
      app.getPath("documents"),
      path.basename(String(suggestedName || "promptshelf-backup.json")),
    ),
    filters: [{ name: "PromptShelf JSON backup", extensions: ["json"] }],
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  const atomicWrite = async () => {
    const temporary = `${result.filePath}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
    try {
      await fsp.writeFile(temporary, jsonText, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600,
      });
      await fsp.rename(temporary, result.filePath);
    } finally {
      await fsp.rm(temporary, { force: true }).catch(() => {});
    }
  };
  try {
    // Exclusive creation protects against a file appearing after the save-dialog confirmation.
    await fsp.writeFile(result.filePath, jsonText, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const replace = await dialog.showMessageBox(mainWindow, {
      type: "warning",
      buttons: ["Cancel", "Replace file"],
      defaultId: 0,
      cancelId: 0,
      message: "A file already exists at this location. Replace it?",
    });
    if (replace.response !== 1)
      throw new Error("Export canceled; existing file was not changed.");
    // Write and close a private temporary file before the atomic replacement to avoid partial backups.
    await atomicWrite();
  }
  recordBackup(
    "local-file",
    "success",
    null,
    parsed.prompts.length,
    Buffer.byteLength(jsonText),
  );
  return { canceled: false, path: result.filePath };
}

async function readJsonBackup() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Import PromptShelf backup",
    properties: ["openFile"],
    filters: [{ name: "PromptShelf JSON backup", extensions: ["json"] }],
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const filePath = result.filePaths[0];
  const stat = await fsp.stat(filePath);
  if (!stat.isFile() || stat.size > MAX_LIBRARY_BYTES)
    throw new Error(
      "The backup must be a regular JSON file no larger than 20 MiB.",
    );
  const text = await fsp.readFile(filePath, "utf8");
  JSON.parse(text);
  return { canceled: false, text, name: path.basename(filePath) };
}

async function safeStorageAvailable() {
  // Electron's basic_text Linux backend uses a hardcoded plaintext password, so fail closed.
  if (
    process.platform === "linux" &&
    typeof safeStorage.getSelectedStorageBackend === "function"
  ) {
    const backend = safeStorage.getSelectedStorageBackend();
    if (backend === "basic_text" || backend === "unknown") return false;
  }
  if (typeof safeStorage.isAsyncEncryptionAvailable === "function")
    return safeStorage.isAsyncEncryptionAvailable();
  return safeStorage.isEncryptionAvailable();
}
async function readVault() {
  if (cachedVault) return { ...cachedVault };
  try {
    if (!(await safeStorageAvailable()))
      throw new Error(
        "OS-backed secure storage is unavailable. Unlock/configure your desktop keyring and try again.",
      );
    const encrypted = await fsp.readFile(vaultPath());
    const decrypted = await safeStorage.decryptStringAsync(encrypted);
    const parsed = JSON.parse(decrypted.result);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error(
        "Saved Google Drive credentials are malformed. Disconnect and configure the account again.",
      );
    const stringField = (key, limit) => {
      const value = parsed[key] ?? "";
      if (typeof value !== "string" || value.length > limit)
        throw new Error(
          `Saved Google Drive credential field ${key} is invalid.`,
        );
      return value;
    };
    cachedVault = {
      clientId: stringField("clientId", 500),
      clientSecret: stringField("clientSecret", 1000),
      refreshToken: stringField("refreshToken", 10000),
      accessToken: stringField("accessToken", 10000),
      expiresAt: Number.isFinite(parsed.expiresAt) ? parsed.expiresAt : 0,
    };
    // Key rotation / a stronger available backend should be persisted before the next use.
    if (decrypted.shouldReEncrypt) await writeVault(cachedVault);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    cachedVault = {
      clientId: "",
      clientSecret: "",
      refreshToken: "",
      accessToken: "",
      expiresAt: 0,
    };
  }
  return { ...cachedVault };
}
async function writeVault(vault) {
  if (!(await safeStorageAvailable()))
    throw new Error(
      "Secure credential storage is unavailable. On Ubuntu, sign in to a supported desktop keyring and retry; PromptShelf will not store Google tokens as plain text.",
    );
  const encrypted = await safeStorage.encryptStringAsync(JSON.stringify(vault));
  const destination = vaultPath();
  const temporary = `${destination}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    await fsp.writeFile(temporary, encrypted, { mode: 0o600, flag: "wx" });
    await fsp.rename(temporary, destination);
    cachedVault = { ...vault };
  } finally {
    await fsp.rm(temporary, { force: true }).catch(() => {});
  }
}

function base64Url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

async function connectGoogleDrive() {
  const vault = await readVault();
  if (!vault.clientId)
    throw new Error(
      "Add a Google OAuth Desktop client ID in Backup & Settings first.",
    );
  const verifier = base64Url(randomBytes(48));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  const state = base64Url(randomBytes(24));
  const callbackResult = await new Promise((resolve, reject) => {
    let finished = false;
    let timeout;
    let redirectUri = "";
    const callbackServer = createServer((request, response) => {
      const requestUrl = new URL(request.url, "http://127.0.0.1");
      if (requestUrl.pathname !== "/oauth2/callback") {
        response.writeHead(404).end("Not found");
        return;
      }
      if (
        !constantTimeEqual(requestUrl.searchParams.get("state") || "", state)
      ) {
        response
          .writeHead(400, { "content-type": "text/plain; charset=utf-8" })
          .end("OAuth state validation failed. You can close this tab.");
        finish(new Error("Google OAuth state validation failed."));
        return;
      }
      const error = requestUrl.searchParams.get("error");
      if (error) {
        response
          .writeHead(400, { "content-type": "text/html; charset=utf-8" })
          .end(
            "<!doctype html><title>PromptShelf</title><p>Google Drive connection was not completed. Return to PromptShelf.</p>",
          );
        finish(new Error(`Google authorization was not completed: ${error}`));
        return;
      }
      const code = requestUrl.searchParams.get("code");
      if (!code) {
        response
          .writeHead(400, { "content-type": "text/plain; charset=utf-8" })
          .end("Authorization code missing. You can close this tab.");
        finish(new Error("Google did not return an authorization code."));
        return;
      }
      response
        .writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        })
        .end(
          '<!doctype html><html><head><meta charset="utf-8"><title>PromptShelf connected</title></head><body style="font:16px system-ui;max-width:34rem;margin:4rem auto;padding:1rem"><h1>Connection received</h1><p>You can close this browser tab and return to PromptShelf.</p></body></html>',
        );
      finish(null, { code, redirectUri });
    });
    const finish = (error, result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      callbackServer.close();
      error ? reject(error) : resolve(result);
    };
    callbackServer.on("error", (error) => finish(error));
    callbackServer.listen(0, "127.0.0.1", async () => {
      const address = callbackServer.address();
      redirectUri = `http://127.0.0.1:${address.port}/oauth2/callback`;
      const authorization = new URL(
        "https://accounts.google.com/o/oauth2/v2/auth",
      );
      authorization.searchParams.set("client_id", vault.clientId);
      authorization.searchParams.set("redirect_uri", redirectUri);
      authorization.searchParams.set("response_type", "code");
      authorization.searchParams.set("scope", DRIVE_SCOPE);
      authorization.searchParams.set("code_challenge", challenge);
      authorization.searchParams.set("code_challenge_method", "S256");
      authorization.searchParams.set("state", state);
      authorization.searchParams.set("access_type", "offline");
      authorization.searchParams.set("prompt", "consent");
      timeout = setTimeout(
        () =>
          finish(new Error("Google sign-in timed out. Try connecting again.")),
        3 * 60 * 1000,
      );
      try {
        await shell.openExternal(authorization.toString());
      } catch (error) {
        finish(
          new Error(
            `Could not open the browser for Google sign-in: ${error.message}`,
          ),
        );
      }
    });
  });

  const form = new URLSearchParams({
    client_id: vault.clientId,
    code: callbackResult.code,
    code_verifier: verifier,
    redirect_uri: callbackResult.redirectUri,
    grant_type: "authorization_code",
  });
  if (vault.clientSecret) form.set("client_secret", vault.clientSecret);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenPayload.access_token)
    throw new Error(
      tokenPayload.error_description ||
        tokenPayload.error ||
        "Google token exchange failed.",
    );
  await writeVault({
    ...vault,
    accessToken: tokenPayload.access_token,
    refreshToken: tokenPayload.refresh_token || vault.refreshToken,
    expiresAt: now() + Number(tokenPayload.expires_in || 3600) * 1000,
  });
  return { connected: true };
}

async function getAccessToken() {
  const vault = await readVault();
  if (!vault.refreshToken)
    throw new Error(
      "Google Drive is not connected. Connect your account first.",
    );
  if (vault.accessToken && vault.expiresAt > now() + 90_000)
    return vault.accessToken;
  const form = new URLSearchParams({
    client_id: vault.clientId,
    refresh_token: vault.refreshToken,
    grant_type: "refresh_token",
  });
  if (vault.clientSecret) form.set("client_secret", vault.clientSecret);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token)
    throw new Error(
      payload.error_description ||
        payload.error ||
        "Google access token refresh failed.",
    );
  await writeVault({
    ...vault,
    accessToken: payload.access_token,
    expiresAt: now() + Number(payload.expires_in || 3600) * 1000,
  });
  return payload.access_token;
}

async function driveFetch(url, options = {}) {
  const token = await getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: { authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  if (response.status === 401)
    throw new Error(
      "Google Drive authorization expired. Reconnect the account and retry.",
    );
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Google Drive request failed (${response.status}): ${errorText.slice(0, 500) || response.statusText}`,
    );
  }
  return response;
}

async function createDriveBackup() {
  if (backupInProgress) throw new Error("A backup is already running.");
  backupInProgress = true;
  let jsonText = "";
  try {
    const library = readLibrary();
    if (!library)
      throw new Error("The library is empty; nothing was backed up.");
    jsonText = JSON.stringify(
      { app: "PromptShelf", exportedAt: new Date().toISOString(), ...library },
      null,
      2,
    );
    const buffer = Buffer.from(jsonText, "utf8");
    if (buffer.byteLength > MAX_LIBRARY_BYTES)
      throw new Error("Backup exceeds the 20 MB safety limit.");
    const name = `promptshelf-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const boundary = `promptshelf_${base64Url(randomBytes(18))}`;
    const metadata = {
      name,
      mimeType: "application/json",
      parents: ["appDataFolder"],
      appProperties: { application: "PromptShelf", backupVersion: "1" },
    };
    const multipart = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
      ),
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
      ),
      buffer,
      Buffer.from(`\r\n--${boundary}--`),
    ]);
    const createdResponse = await driveFetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime",
      {
        method: "POST",
        headers: {
          "content-type": `multipart/related; boundary=${boundary}`,
          "content-length": String(multipart.byteLength),
        },
        body: multipart,
      },
    );
    const created = await createdResponse.json();
    if (!created.id)
      throw new Error(
        "Google Drive accepted the upload without returning a file ID.",
      );
    const verifiedResponse = await driveFetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(created.id)}?fields=id,name,size,createdTime,parents`,
    );
    const verified = await verifiedResponse.json();
    if (
      verified.id !== created.id ||
      verified.name !== name ||
      (verified.size && Number(verified.size) !== buffer.byteLength)
    )
      throw new Error(
        "Uploaded backup verification failed; the new backup was retained but not marked successful.",
      );

    const retention = backupSchedule().retentionCount;
    const allFiles = [];
    let pageToken = "";
    do {
      const query = new URLSearchParams({
        spaces: "appDataFolder",
        pageSize: "100",
        orderBy: "createdTime desc",
        fields: "nextPageToken,files(id,name,createdTime,size,appProperties)",
      });
      if (pageToken) query.set("pageToken", pageToken);
      const listResponse = await driveFetch(
        `https://www.googleapis.com/drive/v3/files?${query.toString()}`,
      );
      const filesPayload = await listResponse.json();
      allFiles.push(
        ...(Array.isArray(filesPayload.files) ? filesPayload.files : []),
      );
      pageToken =
        typeof filesPayload.nextPageToken === "string"
          ? filesPayload.nextPageToken
          : "";
    } while (pageToken);
    const managed = allFiles
      .filter((file) => /^promptshelf-backup-.*\.json$/.test(file.name || ""))
      .sort((a, b) =>
        String(b.createdTime || "").localeCompare(String(a.createdTime || "")),
      );
    for (const old of managed.slice(retention)) {
      // Retention is restricted to backup filenames owned by PromptShelf and runs only after verification.
      await driveFetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(old.id)}`,
        { method: "DELETE" },
      );
    }
    recordBackup(
      "google-drive",
      "success",
      null,
      library.prompts.length,
      buffer.byteLength,
    );
    notifyBackup(
      "PromptShelf backup complete",
      `${library.prompts.length} prompts backed up to Google Drive.`,
    );
    return { fileId: created.id, createdAt: now() };
  } catch (error) {
    recordBackup(
      "google-drive",
      "failed",
      error.message,
      0,
      Buffer.byteLength(jsonText),
    );
    notifyBackup("PromptShelf backup failed", error.message);
    throw error;
  } finally {
    backupInProgress = false;
  }
}

function notifyBackup(title, body) {
  if (backupSchedule().notificationsEnabled && Notification.isSupported())
    new Notification({
      title,
      body: String(body).slice(0, 220),
      silent: true,
    }).show();
}
function rearmBackupScheduler() {
  if (schedulerTimer) clearInterval(schedulerTimer);
  schedulerTimer = null;
  const schedule = backupSchedule();
  if (!schedule.enabled) return;
  // The app checks on launch and once per minute while running; sleep/network outages are caught up on the next check.
  schedulerTimer = setInterval(() => {
    if (backupInProgress || !backupSchedule().enabled) return;
    Promise.resolve()
      .then(async () => {
        const vault = await readVault();
        if (!vault.refreshToken) return;
        const lastAttempt =
          Number(readSetting("last_backup_attempt_at", "0")) || 0;
        const due =
          !lastAttempt ||
          now() - lastAttempt >= backupSchedule().intervalHours * 3600_000;
        if (due) await createDriveBackup();
      })
      .catch((error) =>
        console.error("Scheduled PromptShelf backup failed:", error.message),
      );
  }, 60_000);
  // Run once shortly after launch to catch up a missed schedule.
  setTimeout(() => {
    if (!backupSchedule().enabled || backupInProgress) return;
    Promise.resolve()
      .then(async () => {
        const vault = await readVault();
        if (!vault.refreshToken) return;
        const lastAttempt =
          Number(readSetting("last_backup_attempt_at", "0")) || 0;
        if (
          !lastAttempt ||
          now() - lastAttempt >= backupSchedule().intervalHours * 3600_000
        )
          await createDriveBackup();
      })
      .catch((error) =>
        console.error("PromptShelf backup catch-up failed:", error.message),
      );
  }, 8000);
}

function registerIpc() {
  registerHandler("app:info", () => ({
    platform: process.platform,
    appVersion: app.getVersion(),
    databasePath: dbPath(),
    trayAvailable: Boolean(tray),
    closeToTray: readSetting("close_to_tray", "0") === "1",
  }));
  registerHandler("app:close-to-tray", (enabled) => {
    if (typeof enabled !== "boolean")
      throw new Error("Close-to-tray preference must be a boolean.");
    if (enabled && !tray)
      throw new Error(
        "A system tray is not available in this desktop session.",
      );
    writeSetting("close_to_tray", enabled ? "1" : "0");
    return { enabled };
  });
  registerHandler("app:database-check", () => {
    const result = db.pragma("quick_check");
    return {
      ok: result.length === 1 && result[0].quick_check === "ok",
      details: result.map((row) => row.quick_check || JSON.stringify(row)),
    };
  });
  registerHandler("app:open-data-folder", async () => {
    const error = await shell.openPath(app.getPath("userData"));
    if (error) throw new Error(error);
    return { opened: true };
  });
  registerHandler("library:load", () => readLibrary());
  registerHandler("library:save", (library) => writeLibrary(library));
  registerHandler("backup:export", (json, suggestedName) =>
    writeJsonBackup(json, suggestedName),
  );
  registerHandler("backup:import", () => readJsonBackup());
  registerHandler("clipboard:write", (text) => {
    if (typeof text !== "string" || text.length > 2_000_000)
      throw new Error("Clipboard content is invalid or too large.");
    clipboard.writeText(text);
    return { copied: true };
  });
  registerHandler("drive:status", async () => {
    let vault = { clientId: "", refreshToken: "" };
    const storageAvailable = await safeStorageAvailable();
    try {
      vault = await readVault();
    } catch (error) {
      return {
        connected: false,
        configured: false,
        secureStorageAvailable: storageAvailable,
        lastBackupAt: Number(readSetting("last_backup_at", "0")) || null,
        lastBackupError: readSetting("last_backup_error"),
        schedule: backupSchedule(),
        error: error.message,
      };
    }
    return {
      connected: Boolean(vault.refreshToken),
      configured: Boolean(vault.clientId),
      secureStorageAvailable: storageAvailable,
      lastBackupAt: Number(readSetting("last_backup_at", "0")) || null,
      lastBackupError: readSetting("last_backup_error"),
      schedule: backupSchedule(),
    };
  });
  registerHandler("drive:configure", async (config) => {
    if (
      !config ||
      typeof config.clientId !== "string" ||
      !config.clientId.trim() ||
      config.clientId.length > 500
    )
      throw new Error("A valid Google OAuth Desktop client ID is required.");
    if (
      config.clientSecret !== undefined &&
      (typeof config.clientSecret !== "string" ||
        config.clientSecret.length > 1000)
    )
      throw new Error("Google OAuth client secret is invalid.");
    const old = await readVault();
    await writeVault({
      ...old,
      clientId: config.clientId.trim(),
      clientSecret:
        config.clientSecret === undefined
          ? String(old.clientSecret || "")
          : config.clientSecret.trim(),
    });
    return { configured: true };
  });
  registerHandler("drive:connect", connectGoogleDrive);
  registerHandler("drive:disconnect", async () => {
    const vault = await readVault();
    await writeVault({
      ...vault,
      refreshToken: "",
      accessToken: "",
      expiresAt: 0,
    });
    return { connected: false };
  });
  registerHandler("drive:backup", createDriveBackup);
  registerHandler("drive:schedule", (schedule) => {
    if (
      !schedule ||
      typeof schedule.enabled !== "boolean" ||
      ![1, 6, 12, 24, 48, 168].includes(schedule.intervalHours) ||
      !Number.isInteger(schedule.retentionCount) ||
      schedule.retentionCount < 1 ||
      schedule.retentionCount > 100
    )
      throw new Error("Backup schedule values are invalid.");
    const normalized = {
      enabled: schedule.enabled,
      intervalHours: schedule.intervalHours,
      retentionCount: schedule.retentionCount,
      notificationsEnabled: schedule.notificationsEnabled === true,
    };
    writeSetting("backup_schedule", JSON.stringify(normalized));
    rearmBackupScheduler();
    return { saved: true };
  });
  registerHandler("app:shortcut", (shortcut) => {
    if (!["new", "search", "capture", "save"].includes(shortcut))
      return { sent: false };
    mainWindow?.webContents.send("app:shortcut", shortcut);
    return { sent: true };
  });
  registerHandler("app:confirm-close", () => {
    if (!closeFlushInProgress) return { confirmed: false };
    closeFlushInProgress = false;
    if (closeFlushTimeout) clearTimeout(closeFlushTimeout);
    closeFlushTimeout = null;
    allowWindowClose = true;
    if (shouldQuitAfterFlush) {
      shouldQuitAfterFlush = false;
      readyToQuit = true;
      isQuitting = true;
      app.quit();
    } else {
      mainWindow?.close();
    }
    return { confirmed: true };
  });
  registerHandler("app:cancel-close", () => {
    closeFlushInProgress = false;
    shouldQuitAfterFlush = false;
    if (closeFlushTimeout) clearTimeout(closeFlushTimeout);
    closeFlushTimeout = null;
    return { canceled: true };
  });
}

function buildMenu() {
  const template = [
    {
      label: "PromptShelf",
      submenu: [
        {
          label: "About PromptShelf",
          click: () =>
            dialog.showMessageBox(mainWindow, {
              title: "About PromptShelf",
              message: `PromptShelf ${app.getVersion()}`,
              detail:
                "A local-first prompt library. Your prompts are stored on this device.",
            }),
        },
        { type: "separator" },
        { role: "quit", label: "Quit PromptShelf" },
      ],
    },
    {
      label: "File",
      submenu: [
        {
          label: "New prompt",
          accelerator: "CommandOrControl+N",
          click: () => mainWindow?.webContents.send("app:shortcut", "new"),
        },
        {
          label: "Quick capture",
          accelerator: "CommandOrControl+Shift+C",
          click: () => mainWindow?.webContents.send("app:shortcut", "capture"),
        },
        { type: "separator" },
        {
          label: "Export backup…",
          click: () => mainWindow?.webContents.send("app:shortcut", "export"),
        },
        { role: "close", label: "Close window" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Search prompts",
          accelerator: "CommandOrControl+K",
          click: () => mainWindow?.webContents.send("app:shortcut", "search"),
        },
        { type: "separator" },
        { role: "reload" },
        { role: "toggleDevTools" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Troubleshooting guide",
          click: () =>
            shell.openPath(
              path.join(app.getAppPath(), "docs", "TROUBLESHOOTING.md"),
            ),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function startPackagedServer() {
  const distDir = path.join(app.getAppPath(), "dist");
  const indexPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexPath))
    throw new Error(
      `Production web bundle was not found at ${distDir}. Run npm run build before packaging.`,
    );
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
    ".json": "application/json; charset=utf-8",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
  };
  appServer = createServer(async (req, res) => {
    try {
      const reqPath = new URL(req.url || "/", "http://127.0.0.1").pathname;
      let safePath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, "");
      if (safePath === "/" || !safePath) safePath = "/index.html";
      let filePath = path.join(distDir, safePath);
      try {
        const stat = await fsp.stat(filePath);
        if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
      } catch {
        filePath = indexPath;
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || "application/octet-stream";
      const content = await fsp.readFile(filePath);
      res.writeHead(200, {
        "content-type": contentType,
        "content-length": String(content.byteLength),
      });
      res.end(content);
    } catch (error) {
      console.error("Local web request failed:", error);
      if (!res.headersSent)
        res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end("PromptShelf could not complete this request.");
    }
  });
  await new Promise((resolve, reject) => {
    appServer.once("error", reject);
    appServer.listen(0, "127.0.0.1", resolve);
  });
  appServerPort = appServer.address().port;
}

async function findAvailableLoopbackPort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const address = probe.address();
  const port = address && typeof address === "object" ? address.port : 0;
  await new Promise((resolve, reject) =>
    probe.close((error) => (error ? reject(error) : resolve())),
  );
  if (!port)
    throw new Error(
      "Could not allocate a local port for the development server.",
    );
  return port;
}

async function startDevelopmentServer() {
  const host = "127.0.0.1";
  const port = await findAvailableLoopbackPort();
  appServerPort = port;
  const ready = () =>
    new Promise((resolve) => {
      const attempt = (remaining) => {
        if (
          devServerProcess?.exitCode !== null &&
          devServerProcess?.exitCode !== undefined
        )
          return resolve(false);
        const request = require("node:http").get(
          { hostname: host, port, path: "/", timeout: 1000 },
          (response) => {
            const chunks = [];
            response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
            response.on("end", () => {
              const body = Buffer.concat(chunks).toString("utf8");
              // Avoid treating an unrelated local listener as the PromptShelf development server.
              if (
                response.statusCode &&
                response.statusCode < 500 &&
                body.includes("PromptShelf")
              )
                return resolve(true);
              if (remaining <= 0) return resolve(false);
              setTimeout(() => attempt(remaining - 1), 350);
            });
          },
        );
        request.on("error", () => {
          request.destroy();
          if (remaining <= 0) return resolve(false);
          setTimeout(() => attempt(remaining - 1), 350);
        });
        request.on("timeout", () => request.destroy());
      };
      attempt(60);
    });
  devServerProcess = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    [
      "run",
      "dev",
      "--",
      "--host",
      host,
      "--port",
      String(port),
      "--strictPort",
    ],
    {
      cwd: app.getAppPath(),
      stdio: "ignore",
      windowsHide: true,
      env: { ...process.env, BROWSER: "none" },
    },
  );
  devServerProcess.on("exit", (code) => {
    if (!isQuitting) {
      console.error(
        `PromptShelf dev server exited unexpectedly with status ${code}`,
      );
      isQuitting = true;
      app.quit();
    }
  });
  const isReady = await ready();
  if (!isReady)
    throw new Error(
      `Could not verify the PromptShelf development server on 127.0.0.1:${port}.`,
    );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 760,
    minHeight: 560,
    show: false,
    backgroundColor: "#111318",
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    if (allowWindowClose) {
      allowWindowClose = false;
      return;
    }
    // Close-to-tray is opt-in; hiding does not unload the renderer or interrupt its autosave.
    if (tray && readSetting("close_to_tray", "0") === "1") {
      event.preventDefault();
      mainWindow?.hide();
      return;
    }
    // IPC writes are asynchronous from the renderer's perspective. Keep the window alive
    // until the latest complete library snapshot has reached SQLite, rather than trusting beforeunload.
    event.preventDefault();
    if (!closeFlushInProgress) requestRendererFlush(false);
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:") shell.openExternal(parsed.href);
    } catch {
      /* Block malformed URLs. */
    }
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, destination) => {
    try {
      const target = new URL(destination);
      if (
        target.hostname !== "127.0.0.1" ||
        target.port !== String(appServerPort) ||
        target.protocol !== "http:"
      )
        event.preventDefault();
    } catch {
      event.preventDefault();
    }
  });
  configureSecurityHeaders();
  mainWindow.loadURL(`http://127.0.0.1:${appServerPort}/`);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) =>
    console.error(
      "PromptShelf renderer process exited:",
      details.reason,
      details.exitCode,
    ),
  );
}

function configureSecurityHeaders() {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:* https://oauth2.googleapis.com https://www.googleapis.com",
  ].join("; ");
  const filter = { urls: ["http://127.0.0.1/*"] };
  const ses = mainWindow?.webContents.session;
  ses?.webRequest.onHeadersReceived(filter, (details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp],
        "X-Content-Type-Options": ["nosniff"],
        "Referrer-Policy": ["no-referrer"],
      },
    });
  });
  ses?.setPermissionRequestHandler((_webContents, _permission, callback) =>
    callback(false),
  );
}

function createTray() {
  const iconPath = path.join(app.getAppPath(), "build", "icon.png");
  if (!fs.existsSync(iconPath)) return;
  try {
    const icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) return;
    tray = new Tray(icon.resize({ width: 18, height: 18 }));
    tray.setToolTip("PromptShelf");
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "Open PromptShelf",
          click: () => {
            if (!mainWindow) createWindow();
            else {
              mainWindow.show();
              mainWindow.focus();
            }
          },
        },
        {
          label: "Export backup…",
          click: () => mainWindow?.webContents.send("app:shortcut", "export"),
        },
        { type: "separator" },
        {
          label: "Quit",
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ]),
    );
    tray.on("double-click", () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (error) {
    console.warn("Optional tray integration is unavailable:", error.message);
  }
}

app.setAppUserModelId(APP_ID);
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) app.quit();
function cleanupForQuit() {
  isQuitting = true;
  if (closeFlushTimeout) clearTimeout(closeFlushTimeout);
  closeFlushTimeout = null;
  if (schedulerTimer) clearInterval(schedulerTimer);
  schedulerTimer = null;
  if (devServerProcess && !devServerProcess.killed) devServerProcess.kill();
  if (appServer?.listening) appServer.close();
  try {
    if (db && db.open) db.close();
  } catch (error) {
    console.warn(
      "Could not close the SQLite connection cleanly:",
      error.message,
    );
  }
}
app.on("before-quit", (event) => {
  if (readyToQuit) {
    cleanupForQuit();
    return;
  }
  if (mainWindow) {
    event.preventDefault();
    // Quit commands must flush too; if a window-close flush is already in progress, reuse it.
    if (closeFlushInProgress) shouldQuitAfterFlush = true;
    else requestRendererFlush(true);
    return;
  }
  cleanupForQuit();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (!mainWindow) createWindow();
  else mainWindow.show();
});
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  try {
    app.setName("PromptShelf");
    if (!hasSingleInstanceLock) return;
    initializeDatabase();
    registerIpc();
    buildMenu();
    if (app.isPackaged) await startPackagedServer();
    else await startDevelopmentServer();
    createWindow();
    createTray();
    rearmBackupScheduler();
    app.on("browser-window-created", (_event, window) => {
      window.webContents.on("will-attach-webview", (event) =>
        event.preventDefault(),
      );
    });
  } catch (error) {
    console.error("PromptShelf could not start:", error);
    dialog.showErrorBox(
      "PromptShelf could not start",
      `${error.message}\n\nSee the README troubleshooting section for recovery steps.`,
    );
    app.quit();
  }
});

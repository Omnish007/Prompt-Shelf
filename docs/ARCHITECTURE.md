# PromptShelf architecture

## Runtime boundaries

### Browser

The existing React 19 + TanStack Start renderer remains available in a browser. `src/lib/store.ts` uses IndexedDB through the existing `kv/library` record and keeps the UI-facing actions and state subscription stable.

### Electron desktop

- **Main process (`electron/main.cjs`)**: owns the SQLite connection, OAuth callback listener, Google Drive client calls, native dialogs, OS secure storage, desktop menu, and backup schedule.
- **Preload (`electron/preload.cjs`)**: exposes a narrow `window.promptShelfDesktop` API. It does not expose `ipcRenderer`, Node.js, `fs`, raw SQL, or arbitrary shell execution.
- **Renderer (`src/components/PromptShelf.tsx`)**: uses existing app actions and a small platform-aware persistence boundary. Desktop data travels through validated IPC; the browser path continues using IndexedDB.
- **SQLite**: lives in Electron `userData`, outside the application install directory, so packaging upgrades do not replace user data.

## SQLite schema

`electron/main.cjs` creates versioned SQLite schema metadata plus these normalized tables:

- `prompts` — core prompt content, status, usage, favorite/pin flags, timestamps, and collection reference.
- `collections` — one record per collection with a normalized-name uniqueness constraint.
- `prompt_tags` — one row per prompt/tag pair.
- `prompt_vars` — one row per template variable with position, type, required state, default, and select options.
- `prompt_versions` — bounded edit history per prompt.
- `settings` — seed-library version, backup schedule, and backup metadata.
- `backup_history` — local/cloud backup outcomes, timestamps, record counts, and sizes.
- `schema_migrations` / `PRAGMA user_version` — migration tracking.

The renderer submits a complete library snapshot through one write operation. The main process validates shape and size before a transaction replaces the normalized tables, so failed inserts roll back instead of leaving half a library. The window-close and app-quit paths request a final renderer flush and wait for its acknowledgement before closing SQLite; on a failed save, the user can keep the application open or explicitly accept the risk. This is intentionally straightforward for the current local-first workload; if measurements show tens of thousands of prompts making snapshots costly, evolve the IPC API toward per-entity transactional writes rather than adding complexity pre-emptively.

SQLite is configured with foreign keys, WAL mode, a bounded busy timeout, and `synchronous=FULL`. Database quick-check can be run from Backup & Settings.

## Persistence and migrations

`readPersistedLibrary()` selects SQLite only when the desktop bridge exists; it never silently falls back to IndexedDB after a desktop database error. A fresh SQLite library receives curated built-ins. If a legacy IndexedDB record is visible to the same renderer origin, it is copied into SQLite. Existing browser origins are isolated; import/export JSON is the safe cross-origin migration path.

Built-ins use deterministic IDs and `seedLibraryVersion`. Updates add missing IDs and avoid overwriting user-modified prompt records. Permanent deletion of a built-in is not reversed by a normal application restart because the seed revision is stored after initial upgrade.

## IPC validation and security

- BrowserWindow uses `contextIsolation`, `sandbox`, and `webSecurity`, with `nodeIntegration` disabled.
- `will-navigate` blocks destinations outside the local application origin; new-window requests are denied and HTTPS links are opened externally.
- Permission requests are denied by default.
- IPC handlers validate the sender origin and validate payload shape, record limits, text lengths, IDs, relationships, and enum values before writing data.
- File import uses a native file dialog and rejects oversized files; restore validates JSON before mutation and prompts before replace.
- Prompt text is treated as data and is not logged by IPC or backup services.
- Google OAuth uses a random loopback callback, state verification, PKCE (S256), and only the Drive `appdata` scope.
- OAuth material is stored using Electron's asynchronous `safeStorage` API with atomic replacement of the encrypted vault. The application fails closed rather than persisting credentials as plaintext when OS encryption is unavailable, including Linux's `basic_text` fallback.

The current Content Security Policy allows inline script for compatibility with TanStack Start hydration, while still restricting default sources and disabling objects. For a future stricter policy, add nonce/hash support to the SSR document before removing `unsafe-inline`.

## Backup design

Cloud backups serialize a consistent library read from SQLite to a versioned PromptShelf JSON snapshot, upload it to `appDataFolder`, verify the returned file metadata, and only then prune older PromptShelf-named snapshots according to retention. Retention never searches the user's normal Drive files. Restore accepts JSON, not arbitrary SQLite database files, which avoids replacing an open live database with a potentially corrupt or malicious SQLite file.

Scheduling is in-process. It checks every minute while the app is running and checks immediately after launch for overdue work. Fully closed-app execution is not promised; operating-system startup/daemon integration is intentionally not silently enabled.

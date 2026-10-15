import { useSyncExternalStore } from "react";
import { SEED_LIBRARY_VERSION } from "./seed-prompts";
import type { Prompt, Library, Collection } from "./store-types";
import { makePrompt, starter, upgradeSeedLibrary } from "./store-prompts";
import { norm, syncVars, uid } from "./store-utils";
export type {
  VarType,
  PromptVar,
  Version,
  Status,
  Prompt,
  Collection,
  Library,
} from "./store-types";
export { norm, uid, extractVarNames, syncVars, render } from "./store-utils";

const DB = "promptshelf";
const STORE = "kv";
const KEY = "library";

function openDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbGet(): Promise<Library | undefined> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const transaction = db.transaction(STORE);
    const request = transaction.objectStore(STORE).get(KEY);
    request.onsuccess = () => res(request.result);
    request.onerror = () => rej(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onabort = transaction.onerror = () => {
      db.close();
      rej(transaction.error);
    };
  });
}
async function idbSet(v: Library) {
  const db = await openDb();
  return new Promise<void>((res, rej) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(v, KEY);
    transaction.oncomplete = () => {
      db.close();
      res();
    };
    transaction.onabort = transaction.onerror = () => {
      db.close();
      rej(transaction.error);
    };
  });
}

let state: Library | null = null;
let loadPromise: Promise<void> | null = null;
let saveState = "saved" as "saved" | "saving" | "failed";
let loadError: string | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
let timer: ReturnType<typeof setTimeout> | undefined;

function desktopBridge() {
  return typeof window !== "undefined" ? window.promptShelfDesktop : undefined;
}

async function readPersistedLibrary(): Promise<Library | undefined> {
  const desktop = desktopBridge();
  if (desktop) return (await desktop.loadLibrary()) ?? undefined;
  return idbGet();
}

async function persistLibrary(value: Library): Promise<void> {
  const desktop = desktopBridge();
  if (desktop) {
    await desktop.saveLibrary(value);
    return;
  }
  await idbSet(value);
}

export function load(): Promise<void> {
  if (state) return Promise.resolve();
  if (loadPromise) return loadPromise;

  // Clear the previous failure before retrying so the UI returns to its loading state.
  loadError = null;
  emit();

  loadPromise = (async () => {
    try {
      const persisted = await readPersistedLibrary();
      let nextLibrary: Library;
      if (!persisted) {
        // Prefer a legacy browser store so desktop migration never discards an older library.
        const legacy = desktopBridge()
          ? await idbGet().catch(() => undefined)
          : undefined;
        nextLibrary = legacy ? upgradeSeedLibrary(legacy) : starter();
        await persistLibrary(nextLibrary);
      } else {
        nextLibrary = upgradeSeedLibrary(persisted);
        if (nextLibrary !== persisted) await persistLibrary(nextLibrary);
      }
      state = nextLibrary;
      saveState = "saved";
      loadError = null;
    } catch (error) {
      // Never substitute a starter library after a read/write failure: doing so could hide existing
      // data and a later write could overwrite the user's real library. Keep recovery explicit.
      state = null;
      saveState = "failed";
      loadError =
        error instanceof Error
          ? error.message.slice(0, 240)
          : "Unknown storage error";
      console.error("PromptShelf could not load its persistent library", error);
    } finally {
      emit();
    }
  })().finally(() => {
    loadPromise = null;
  });

  return loadPromise;
}
export function flush(): Promise<boolean> {
  // A failed load is not a successful save: never claim durability without a library in memory.
  if (!state) return Promise.resolve(loadError === null);
  clearTimeout(timer);
  saveState = "saving";
  emit();
  return persistLibrary(state)
    .then(() => {
      saveState = "saved";
      return true;
    })
    .catch((error) => {
      saveState = "failed";
      console.error("PromptShelf could not save the library", error);
      return false;
    })
    .finally(emit);
}
function commit(next: Library) {
  state = next;
  saveState = "saving";
  emit();
  clearTimeout(timer);
  timer = setTimeout(flush, 400);
}

type LibrarySnapshot = {
  lib: Library | null;
  save: typeof saveState;
  loadError: string | null;
};
let cached: LibrarySnapshot = { lib: state, save: saveState, loadError };
function getSnap(): LibrarySnapshot {
  if (
    cached.lib !== state ||
    cached.save !== saveState ||
    cached.loadError !== loadError
  ) {
    cached = { lib: state, save: saveState, loadError };
  }
  return cached;
}
const serverSnap = () => SERVER;
const SERVER: LibrarySnapshot = { lib: null, save: "saved", loadError: null };
export function useLibrary() {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    getSnap,
    serverSnap,
  );
}

const lib = () => state!;
const versionGap = 60_000;

export const actions = {
  create(p: Partial<Prompt> = {}) {
    const np = makePrompt(p);
    commit({ ...lib(), prompts: [np, ...lib().prompts] });
    return np.id;
  },
  update(id: string, patch: Partial<Prompt>) {
    commit({
      ...lib(),
      prompts: lib().prompts.map((p) => {
        if (p.id !== id) return p;
        const n = { ...p, ...patch, updatedAt: Date.now() };
        if (patch.content !== undefined)
          n.vars = syncVars(n.content, patch.vars ?? p.vars);
        if (
          (patch.content !== undefined || patch.title !== undefined) &&
          (patch.content !== p.content || patch.title !== p.title)
        ) {
          const last = p.versions[0];
          if (!last || Date.now() - last.at > versionGap)
            n.versions = [
              { at: Date.now(), title: p.title, content: p.content },
              ...p.versions,
            ].slice(0, 50);
        }
        return n;
      }),
    });
  },
  flag(id: string, patch: Partial<Prompt>) {
    commit({
      ...lib(),
      prompts: lib().prompts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  },
  duplicate(id: string) {
    const p = lib().prompts.find((x) => x.id === id)!;
    return actions.create({
      ...p,
      id: undefined,
      title: p.title + " (copy)",
      versions: [],
      usageCount: 0,
      lastUsedAt: null,
      createdAt: undefined,
      updatedAt: undefined,
      favorite: false,
      pinned: false,
      status: "active",
    } as unknown as Partial<Prompt>);
  },
  markUsed(id: string) {
    actions.flag(id, {
      usageCount: (lib().prompts.find((p) => p.id === id)?.usageCount ?? 0) + 1,
      lastUsedAt: Date.now(),
    });
  },
  deleteForever(id: string) {
    commit({ ...lib(), prompts: lib().prompts.filter((p) => p.id !== id) });
  },
  emptyTrash() {
    commit({
      ...lib(),
      prompts: lib().prompts.filter((p) => p.status !== "trash"),
    });
  },
  addCollection(name: string) {
    const cleaned = name.trim();
    if (!cleaned) throw new Error("Collection name is required.");
    const existing = lib().collections.find(
      (collection) => norm(collection.name) === norm(cleaned),
    );
    if (existing) return existing.id;
    const c = { id: uid(), name: cleaned };
    commit({ ...lib(), collections: [...lib().collections, c] });
    return c.id;
  },
  renameCollection(id: string, name: string) {
    const cleaned = name.trim();
    if (!cleaned) throw new Error("Collection name is required.");
    if (
      lib().collections.some(
        (collection) =>
          collection.id !== id && norm(collection.name) === norm(cleaned),
      )
    )
      throw new Error("A collection with that name already exists.");
    commit({
      ...lib(),
      collections: lib().collections.map((c) =>
        c.id === id ? { ...c, name: cleaned } : c,
      ),
    });
  },
  deleteCollection(id: string) {
    commit({
      ...lib(),
      collections: lib().collections.filter((c) => c.id !== id),
      prompts: lib().prompts.map((p) =>
        p.collectionId === id ? { ...p, collectionId: null } : p,
      ),
    });
  },
  exportJson() {
    return JSON.stringify(
      { app: "PromptShelf", exportedAt: new Date().toISOString(), ...lib() },
      null,
      2,
    );
  },
  importJson(text: string, mode: "merge" | "replace") {
    if (new TextEncoder().encode(text).byteLength > 20 * 1024 * 1024)
      throw new Error("Backup is too large (maximum 20 MiB).");
    let d: unknown;
    try {
      d = JSON.parse(text);
    } catch {
      throw new Error("The selected file is not valid JSON.");
    }
    if (
      !d ||
      typeof d !== "object" ||
      !Array.isArray((d as { prompts?: unknown }).prompts) ||
      !Array.isArray((d as { collections?: unknown }).collections)
    ) {
      throw new Error(
        "Not a PromptShelf backup: prompts and collections arrays are required.",
      );
    }
    const data = d as { prompts: unknown[]; collections: unknown[] };
    if (data.prompts.length > 20_000 || data.collections.length > 2_000)
      throw new Error("Backup contains too many records.");
    const validCollections = data.collections.filter(
      (item): item is Collection =>
        !!item &&
        typeof item === "object" &&
        typeof (item as Collection).id === "string" &&
        !!(item as Collection).id &&
        (item as Collection).id.length <= 160 &&
        typeof (item as Collection).name === "string" &&
        !!(item as Collection).name.trim() &&
        (item as Collection).name.length <= 120,
    );
    if (validCollections.length !== data.collections.length)
      throw new Error("Backup contains an invalid collection record.");
    const collectionIdSet = new Set(
      validCollections.map((collection) => collection.id),
    );
    const collectionNames = new Set(
      validCollections.map((collection) => norm(collection.name)),
    );
    if (
      collectionIdSet.size !== validCollections.length ||
      collectionNames.size !== validCollections.length
    )
      throw new Error("Backup contains duplicate collection IDs or names.");
    const validPrompts = data.prompts.filter(
      (item): item is Partial<Prompt> => {
        if (!item || typeof item !== "object") return false;
        const prompt = item as Partial<Prompt>;
        const validVars =
          prompt.vars === undefined ||
          (Array.isArray(prompt.vars) &&
            prompt.vars.length <= 200 &&
            new Set(
              prompt.vars.map((variable) =>
                variable && typeof variable.name === "string"
                  ? variable.name
                  : "",
              ),
            ).size === prompt.vars.length &&
            prompt.vars.every(
              (variable) =>
                !!variable &&
                typeof variable.name === "string" &&
                /^[a-zA-Z_][\w]*$/.test(variable.name) &&
                typeof variable.label === "string" &&
                variable.label.length <= 200 &&
                ["text", "multiline", "select"].includes(variable.type) &&
                typeof variable.default === "string" &&
                variable.default.length <= 10_000 &&
                typeof variable.required === "boolean" &&
                Array.isArray(variable.options) &&
                variable.options.length <= 100 &&
                variable.options.every(
                  (option) =>
                    typeof option === "string" && option.length <= 500,
                ),
            ));
        const validVersions =
          prompt.versions === undefined ||
          (Array.isArray(prompt.versions) &&
            prompt.versions.length <= 50 &&
            prompt.versions.every(
              (version) =>
                !!version &&
                Number.isFinite(version.at) &&
                typeof version.title === "string" &&
                version.title.length <= 500 &&
                typeof version.content === "string" &&
                version.content.length <= 1_000_000,
            ));
        const validStatus =
          prompt.status === undefined ||
          ["active", "archived", "trash"].includes(prompt.status);
        const validTimestamps =
          (prompt.createdAt === undefined ||
            Number.isFinite(prompt.createdAt)) &&
          (prompt.updatedAt === undefined ||
            Number.isFinite(prompt.updatedAt)) &&
          (prompt.lastUsedAt === undefined ||
            prompt.lastUsedAt === null ||
            Number.isFinite(prompt.lastUsedAt));
        const validCounters =
          (prompt.usageCount === undefined ||
            (Number.isInteger(prompt.usageCount) && prompt.usageCount >= 0)) &&
          (prompt.favorite === undefined ||
            typeof prompt.favorite === "boolean") &&
          (prompt.pinned === undefined || typeof prompt.pinned === "boolean");
        const validIdentity =
          prompt.id === undefined ||
          (typeof prompt.id === "string" &&
            !!prompt.id &&
            prompt.id.length <= 200);
        const validContent =
          typeof prompt.title === "string" &&
          !!prompt.title.trim() &&
          prompt.title.length <= 500 &&
          typeof prompt.content === "string" &&
          prompt.content.length <= 1_000_000;
        const validDescription =
          prompt.description === undefined ||
          (typeof prompt.description === "string" &&
            prompt.description.length <= 5000);
        const validCollection =
          prompt.collectionId === undefined ||
          prompt.collectionId === null ||
          (typeof prompt.collectionId === "string" &&
            collectionIdSet.has(prompt.collectionId));
        const validTags =
          prompt.tags === undefined ||
          (Array.isArray(prompt.tags) &&
            prompt.tags.length <= 100 &&
            prompt.tags.every(
              (tag) => typeof tag === "string" && tag.length <= 100,
            ));
        return (
          validIdentity &&
          validContent &&
          validDescription &&
          validCollection &&
          validTags &&
          validVars &&
          validVersions &&
          validStatus &&
          validTimestamps &&
          validCounters
        );
      },
    );
    if (validPrompts.length !== data.prompts.length)
      throw new Error(
        "Backup contains an invalid prompt record or a prompt larger than 1 MB.",
      );
    const sourceCollectionIds = new Set(
      validCollections.map((collection) => collection.id),
    );
    if (
      validPrompts.some(
        (prompt) =>
          prompt.collectionId && !sourceCollectionIds.has(prompt.collectionId),
      )
    ) {
      throw new Error(
        "Backup contains a prompt that references a missing collection.",
      );
    }
    const sourcePromptIds = validPrompts.flatMap((prompt) =>
      typeof prompt.id === "string" ? [prompt.id] : [],
    );
    if (new Set(sourcePromptIds).size !== sourcePromptIds.length)
      throw new Error("Backup contains duplicate prompt IDs.");

    const collectionMap = new Map<string, string>();
    const importedCollections = validCollections.map((collection) => {
      const existing =
        mode === "merge"
          ? lib().collections.find(
              (candidate) => norm(candidate.name) === norm(collection.name),
            )
          : undefined;
      const imported = {
        id:
          existing?.id ??
          (mode === "merge" &&
          lib().collections.some((candidate) => candidate.id === collection.id)
            ? uid()
            : collection.id),
        name: collection.name.trim(),
      };
      collectionMap.set(collection.id, imported.id);
      return imported;
    });
    const prompts = validPrompts.map((prompt) =>
      makePrompt({
        ...prompt,
        id: typeof prompt.id === "string" ? prompt.id : uid(),
        collectionId: prompt.collectionId
          ? (collectionMap.get(prompt.collectionId) ?? null)
          : null,
      }),
    );
    if (mode === "replace") {
      commit({
        version: 1,
        seedLibraryVersion: SEED_LIBRARY_VERSION,
        prompts,
        collections: importedCollections,
      });
      return;
    }
    const existingIds = new Set(lib().prompts.map((prompt) => prompt.id));
    const mergedPrompts = prompts.map((prompt) =>
      existingIds.has(prompt.id) ? { ...prompt, id: uid() } : prompt,
    );
    const collectionIds = new Set(
      lib().collections.map((collection) => collection.id),
    );
    commit({
      version: 1,
      seedLibraryVersion: Math.max(
        lib().seedLibraryVersion ?? 0,
        SEED_LIBRARY_VERSION,
      ),
      prompts: [...lib().prompts, ...mergedPrompts],
      collections: [
        ...lib().collections,
        ...importedCollections.filter(
          (collection) =>
            !collectionIds.has(collection.id) &&
            !lib().collections.some(
              (existing) => norm(existing.name) === norm(collection.name),
            ),
        ),
      ],
    });
  },
};

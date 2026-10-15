import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Library } from "@/lib/store";

type DesktopBridge = NonNullable<Window["promptShelfDesktop"]>;

function installDesktopBridge(initial: Library | null = null) {
  let saved: Library | null = null;
  const bridge = {
    loadLibrary: vi.fn(async () => initial),
    saveLibrary: vi.fn(async (library: Library) => {
      saved = structuredClone(library);
      return { saved: true as const };
    }),
    getAppInfo: vi.fn(),
    setCloseToTray: vi.fn(),
    checkDatabase: vi.fn(),
    openDataFolder: vi.fn(),
    writeClipboard: vi.fn(),
    onShortcut: vi.fn(),
    exportBackup: vi.fn(),
    importBackup: vi.fn(),
    getDriveStatus: vi.fn(),
    configureDrive: vi.fn(),
    connectDrive: vi.fn(),
    disconnectDrive: vi.fn(),
    runDriveBackup: vi.fn(),
    setBackupSchedule: vi.fn(),
  } as unknown as DesktopBridge;
  Object.defineProperty(window, "promptShelfDesktop", {
    configurable: true,
    value: bridge,
  });
  return { bridge, getSaved: () => saved };
}

describe("desktop library persistence", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    delete (window as Window & { promptShelfDesktop?: DesktopBridge })
      .promptShelfDesktop;
  });

  it("seeds the first desktop database with the built-in catalogue", async () => {
    const { bridge, getSaved } = installDesktopBridge();
    const store = await import("@/lib/store");

    await store.load();

    expect(bridge.saveLibrary).toHaveBeenCalledTimes(1);
    expect(getSaved()?.prompts.length).toBeGreaterThanOrEqual(50);
    expect(getSaved()?.collections.length).toBeGreaterThanOrEqual(10);
  });

  it("coalesces concurrent first-load requests into one database initialization", async () => {
    const { bridge } = installDesktopBridge();
    const store = await import("@/lib/store");

    await Promise.all([store.load(), store.load(), store.load()]);

    expect(bridge.loadLibrary).toHaveBeenCalledTimes(1);
    expect(bridge.saveLibrary).toHaveBeenCalledTimes(1);
  });

  it("persists prompt edits when explicitly flushed", async () => {
    const { getSaved } = installDesktopBridge();
    const store = await import("@/lib/store");
    await store.load();

    const id = store.actions.create({
      title: "Persistence regression",
      content: "Keep this prompt after restart.",
    });
    expect(await store.flush()).toBe(true);
    expect(
      getSaved()?.prompts.find((prompt) => prompt.id === id)?.content,
    ).toBe("Keep this prompt after restart.");
  });

  it("upgrades the previous built-in catalogue without losing a library", async () => {
    const previousCatalogue: Library = {
      version: 1,
      seedLibraryVersion: 2,
      prompts: [],
      collections: [],
    };
    const { bridge, getSaved } = installDesktopBridge(previousCatalogue);
    const store = await import("@/lib/store");

    await store.load();

    expect(getSaved()?.seedLibraryVersion).toBe(3);
    expect(getSaved()?.prompts).toHaveLength(104);
    expect(getSaved()?.collections).toHaveLength(15);
    expect(bridge.saveLibrary).toHaveBeenCalledTimes(1);
  });

  it("does not reseed a deliberately empty initialized library", async () => {
    const empty: Library = {
      version: 1,
      seedLibraryVersion: 3,
      prompts: [],
      collections: [],
    };
    const { bridge } = installDesktopBridge(empty);
    const store = await import("@/lib/store");

    await store.load();

    expect(bridge.saveLibrary).not.toHaveBeenCalled();
  });

  it("preserves user edits to existing built-ins while adding a seed revision", async () => {
    const legacy: Library = {
      version: 1,
      seedLibraryVersion: 1,
      prompts: [
        {
          id: "builtin:explain-an-error-and-produce-a-minimal-fix",
          title: "My edited debugging prompt",
          description: "User-owned description",
          content: "Keep my carefully edited content.",
          collectionId: null,
          tags: ["mine"],
          favorite: true,
          pinned: false,
          status: "active",
          createdAt: 1,
          updatedAt: 2,
          lastUsedAt: null,
          usageCount: 3,
          vars: [],
          versions: [],
        },
      ],
      collections: [],
    };
    const { getSaved } = installDesktopBridge(legacy);
    const store = await import("@/lib/store");

    await store.load();

    const edited = getSaved()?.prompts.find(
      (prompt) =>
        prompt.id === "builtin:explain-an-error-and-produce-a-minimal-fix",
    );
    expect(edited?.content).toBe("Keep my carefully edited content.");
    expect(edited?.favorite).toBe(true);
    expect(getSaved()?.prompts.length).toBeGreaterThan(1);
    expect(getSaved()?.seedLibraryVersion).toBe(3);
  });

  it("reports a failed durable write instead of claiming success", async () => {
    const { bridge } = installDesktopBridge();
    const store = await import("@/lib/store");
    await store.load();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(bridge.saveLibrary).mockRejectedValue(new Error("disk full"));

    store.actions.create({
      title: "Failed write",
      content: "This save must report failure.",
    });
    expect(await store.flush()).toBe(false);
  });

  it("rejects malformed restore records before committing them", async () => {
    const { getSaved } = installDesktopBridge();
    const store = await import("@/lib/store");
    await store.load();
    const previousCount = getSaved()?.prompts.length;
    const payload = JSON.stringify({
      version: 1,
      collections: [],
      prompts: [
        {
          id: "bad",
          title: "Invalid relationship",
          content: "x",
          collectionId: "missing-collection",
        },
      ],
    });

    expect(() => store.actions.importJson(payload, "merge")).toThrow(
      /invalid prompt record/i,
    );
    expect(getSaved()?.prompts.length).toBe(previousCount);
  });

  it("deletes a collection while safely retaining its prompts", async () => {
    const { getSaved } = installDesktopBridge();
    const store = await import("@/lib/store");
    await store.load();

    const colId = store.actions.addCollection("Temporary Review");
    const promptId = store.actions.create({
      title: "Design Review",
      content: "Review layout spaces",
      collectionId: colId,
    });
    await store.flush();

    expect(getSaved()?.collections.some((c) => c.id === colId)).toBe(true);
    expect(
      getSaved()?.prompts.find((p) => p.id === promptId)?.collectionId,
    ).toBe(colId);

    store.actions.deleteCollection(colId);
    await store.flush();

    // Collection removed
    expect(getSaved()?.collections.some((c) => c.id === colId)).toBe(false);
    // Prompt still exists, with collectionId unassigned (null)
    const promptAfter = getSaved()?.prompts.find((p) => p.id === promptId);
    expect(promptAfter).toBeDefined();
    expect(promptAfter?.collectionId).toBeNull();
  });
});

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  actions,
  flush,
  load,
  norm,
  useLibrary,
  type Prompt,
} from "@/lib/store";
import {
  createPromptSearchIndex,
  searchPromptDocuments,
} from "@/lib/prompt-search";
import { PromptSidebar } from "./prompt-shelf/PromptSidebar";
import { MobileNavBar } from "./prompt-shelf/MobileNavBar";
import { PromptListPane } from "./prompt-shelf/PromptListPane";
import { Editor } from "./prompt-shelf/PromptEditor";
import { FillDialog, QuickCapture } from "./prompt-shelf/PromptDialogs";
import {
  DeleteCollectionDialog,
  TagExplorerDialog,
} from "./prompt-shelf/CollectionPanels";
import { Dashboard } from "./prompt-shelf/Dashboard";
import { SettingsView } from "./prompt-shelf/SettingsView";
import { copyText } from "./prompt-shelf/utils";
import { useTagMetadata } from "./prompt-shelf/useTagMetadata";
import type { SearchDocument, Sort, View } from "./prompt-shelf/types";
import { LibraryLoading } from "./prompt-shelf/LibraryLoading";
import { LibraryLoadError } from "./prompt-shelf/LibraryLoadError";

export default function PromptShelf() {
  const { lib, loadError, save: saveState } = useLibrary();
  const [view, setView] = useState<View>({ k: "dashboard" });
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const [grid, setGrid] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [fill, setFill] = useState<Prompt | null>(null);
  const [capture, setCapture] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [tagExplorerOpen, setTagExplorerOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

  const changeView = useCallback((nextView: View) => {
    setView(nextView);
    setSelected(null);
    setCursor(0);
    setFilterTags([]);
  }, []);

  const focusLibrarySearch = useCallback(() => {
    changeView({ k: "all" });
    window.requestAnimationFrame(() => searchRef.current?.focus());
  }, [changeView]);

  const retrySave = useCallback(() => {
    void flush().then((saved) => {
      if (saved) toast.success("All changes saved");
      else
        toast.error(
          "Could not save your latest changes. Check storage access and retry.",
        );
    });
  }, []);

  const searchable = useMemo((): SearchDocument[] => {
    if (!lib) return [];
    const collectionNames = new Map(
      lib.collections.map((collection) => [collection.id, collection.name]),
    );
    const candidates = lib.prompts
      .filter((p) => {
        switch (view.k) {
          case "archived":
            return p.status === "archived";
          case "trash":
            return p.status === "trash";
          default:
            if (p.status !== "active") return false;
        }
        switch (view.k) {
          case "favorites":
            return p.favorite;
          case "pinned":
            return p.pinned;
          case "recent":
            return !!p.lastUsedAt;
          case "templates":
            return p.vars.length > 0;
          case "collection":
            return p.collectionId === view.id;
          case "tag":
            return p.tags.includes(view.tag);
        }
        return true;
      })
      .filter((p) => {
        if (filterTags.length > 0 && view.k !== "tag") {
          return filterTags.every((t) => p.tags.includes(t));
        }
        return true;
      });
    return candidates.map((prompt) => ({
      ...prompt,
      collectionName: prompt.collectionId
        ? (collectionNames.get(prompt.collectionId) ?? "")
        : "",
    }));
  }, [lib, view, filterTags]);

  // The index is built only when the visible collection changes, not on each keystroke.
  const searchIndex = useMemo(
    () => createPromptSearchIndex(searchable),
    [searchable],
  );

  const filtered = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (terms.length) return searchPromptDocuments(searchIndex, q);

    const key: Record<Sort, (p: Prompt) => number | string> = {
      updated: (p) => -p.updatedAt,
      created: (p) => -p.createdAt,
      used: (p) => -(p.lastUsedAt ?? 0),
      frequent: (p) => -p.usageCount,
      alpha: (p) => p.title.toLowerCase(),
    };
    const sortKey = view.k === "recent" ? key.used : key[sort];
    return [...searchable].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const left = sortKey(a),
        right = sortKey(b);
      return left < right ? -1 : left > right ? 1 : 0;
    });
  }, [searchable, searchIndex, q, sort, view.k]);

  const newPrompt = useCallback(
    (p: Partial<Prompt> = {}) => {
      const id = actions.create({
        collectionId: view.k === "collection" ? view.id : null,
        tags: view.k === "tag" ? [view.tag] : [],
        ...p,
      });
      if (view.k !== "all" && view.k !== "collection" && view.k !== "tag")
        changeView({ k: "all" });
      setQ("");
      setSelected(id);
    },
    [view, changeView],
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "n") {
        e.preventDefault();
        newPrompt();
      } else if (mod && e.key === "k") {
        e.preventDefault();
        if (view.k === "dashboard" || view.k === "settings")
          setView({ k: "all" });
        setTimeout(() => searchRef.current?.focus());
      } else if (mod && e.key === "s") {
        e.preventDefault();
        window.dispatchEvent(new Event("promptshelf:commit-draft"));
        void flush();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setCapture(true);
      } else if (e.key === "Escape") {
        setFill(null);
        setCapture(false);
      }
    };
    const beforeUnload = () => {
      window.dispatchEvent(new Event("promptshelf:commit-draft"));
      void flush();
    };
    window.addEventListener("keydown", h);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("keydown", h);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [newPrompt, view.k]);

  useEffect(() => {
    const desktop = window.promptShelfDesktop;
    if (!desktop?.onBeforeClose) return;
    return desktop.onBeforeClose(async () => {
      window.dispatchEvent(new Event("promptshelf:commit-draft"));
      const saved = await flush();
      if (!saved) {
        const closeAnyway = confirm(
          "PromptShelf could not save your latest changes. Close anyway and risk losing them?",
        );
        if (!closeAnyway) {
          await desktop.cancelClose();
          return;
        }
      }
      // The main process closes the window only after this confirmation arrives.
      await desktop.confirmClose();
    });
  }, []);

  useEffect(() => {
    const desktop = window.promptShelfDesktop;
    if (!desktop?.onShortcut) return;
    return desktop.onShortcut((shortcut) => {
      if (shortcut === "export") {
        void desktop
          .exportBackup(
            actions.exportJson(),
            `promptshelf-backup-${new Date().toISOString().slice(0, 10)}.json`,
          )
          .then((result) => {
            if (!result.canceled) toast.success("Backup exported");
          })
          .catch((error: unknown) =>
            toast.error(
              error instanceof Error
                ? error.message
                : "Could not export backup",
            ),
          );
        return;
      }
      const shortcuts: Record<string, KeyboardEventInit> = {
        new: { key: "n", ctrlKey: true },
        search: { key: "k", ctrlKey: true },
        capture: { key: "c", ctrlKey: true, shiftKey: true },
        save: { key: "s", ctrlKey: true },
      };
      const options = shortcuts[shortcut];
      if (options)
        window.dispatchEvent(
          new KeyboardEvent("keydown", { bubbles: true, ...options }),
        );
    });
  }, []);

  const { allTagsWithCounts, sidebarTags, availableViewTags } = useTagMetadata(
    lib,
    view,
  );

  if (!lib) {
    if (loadError)
      return (
        <LibraryLoadError
          error={loadError}
          onRetry={() => {
            void load();
          }}
        />
      );
    return <LibraryLoading />;
  }

  const sel = lib.prompts.find((p) => p.id === selected) ?? null;

  const currentCollection =
    view.k === "collection"
      ? (lib.collections.find((c) => c.id === view.id) ?? null)
      : null;
  const countInCollectionToDelete = collectionToDelete
    ? lib.prompts.filter(
        (p) =>
          p.status === "active" && p.collectionId === collectionToDelete.id,
      ).length
    : 0;

  const confirmDeleteCollection = () => {
    if (!collectionToDelete) return;
    const name = collectionToDelete.name;
    actions.deleteCollection(collectionToDelete.id);
    if (view.k === "collection" && view.id === collectionToDelete.id) {
      changeView({ k: "all" });
    }
    toast.success(`Deleted collection "${name}"`);
    setCollectionToDelete(null);
  };

  const use = (p: Prompt) =>
    p.vars.length ? setFill(p) : copyText(p.content, p.id);

  const title =
    view.k === "collection"
      ? lib.collections.find((c) => c.id === view.id)?.name
      : view.k === "tag"
        ? `#${view.tag}`
        : {
            all: "All Prompts",
            favorites: "Favorites",
            pinned: "Pinned",
            recent: "Recently Used",
            templates: "Templates",
            archived: "Archived",
            trash: "Trash",
            settings: "Settings",
            dashboard: "Home",
          }[view.k];

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Toaster richColors position="bottom-center" />
        <PromptSidebar
          lib={lib}
          view={view}
          changeView={changeView}
          newPrompt={() => newPrompt()}
          allTagsWithCounts={allTagsWithCounts}
          sidebarTags={sidebarTags}
          setTagExplorerOpen={setTagExplorerOpen}
          setCollectionToDelete={setCollectionToDelete}
          saveState={saveState}
          onRetrySave={retrySave}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <MobileNavBar
            lib={lib}
            view={view}
            changeView={changeView}
            newPrompt={() => newPrompt()}
            saveState={saveState}
            onRetrySave={retrySave}
          />
          <div
            id="main-content"
            tabIndex={-1}
            className="flex min-h-0 min-w-0 flex-1 overflow-hidden outline-none"
          >
            {view.k === "dashboard" ? (
              <Dashboard
                lib={lib}
                open={(id) => {
                  changeView({ k: "all" });
                  setSelected(id);
                }}
                use={use}
                newPrompt={() => newPrompt()}
                capture={() => setCapture(true)}
                search={focusLibrarySearch}
              />
            ) : view.k === "settings" ? (
              <SettingsView />
            ) : (
              <>
                <PromptListPane
                  title={title ?? "Prompts"}
                  view={view}
                  currentCollection={currentCollection}
                  setCollectionToDelete={setCollectionToDelete}
                  trashCount={
                    lib.prompts.filter((prompt) => prompt.status === "trash")
                      .length
                  }
                  grid={grid}
                  setGrid={setGrid}
                  q={q}
                  setQ={setQ}
                  searchRef={searchRef}
                  cursor={cursor}
                  setCursor={setCursor}
                  filtered={filtered}
                  selected={selected}
                  setSelected={setSelected}
                  use={use}
                  filterTags={filterTags}
                  setFilterTags={setFilterTags}
                  availableViewTags={availableViewTags}
                  setTagExplorerOpen={setTagExplorerOpen}
                  changeView={changeView}
                  sort={sort}
                  setSort={setSort}
                  newPrompt={() => newPrompt()}
                />
                {sel && (
                  <Editor
                    key={sel.id}
                    p={sel}
                    lib={lib}
                    use={use}
                    close={() => setSelected(null)}
                    onDuplicate={(id) => setSelected(id)}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {fill && <FillDialog p={fill} close={() => setFill(null)} />}
        {capture && <QuickCapture close={() => setCapture(false)} />}
        {collectionToDelete && (
          <DeleteCollectionDialog
            collection={collectionToDelete}
            promptCount={countInCollectionToDelete}
            onConfirm={confirmDeleteCollection}
            onClose={() => setCollectionToDelete(null)}
          />
        )}
        {tagExplorerOpen && (
          <TagExplorerDialog
            tagsWithCounts={allTagsWithCounts}
            selectedTags={view.k === "tag" ? [view.tag] : filterTags}
            onApplyTags={(tags) => {
              if (view.k === "tag") {
                changeView({ k: "all" });
              }
              setFilterTags(tags);
              setTagExplorerOpen(false);
            }}
            onClose={() => setTagExplorerOpen(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

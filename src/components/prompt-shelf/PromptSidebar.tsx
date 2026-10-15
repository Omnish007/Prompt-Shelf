import type { Library } from "@/lib/store";
import {
  Archive,
  Clock,
  FileText,
  Home as HomeIcon,
  Library as LibIcon,
  Pin,
  Plus,
  Settings,
  Star,
  Tags,
  Trash2,
  Wand2,
} from "lucide-react";
import { Collections } from "./CollectionPanels";
import { ThemeToggleCompact } from "./ThemeControls";
import type { View } from "./types";

type TagCount = { tag: string; count: number };
type NavigationProps = {
  v: View;
  icon: typeof Star;
  label: string;
  n?: number | undefined;
};

interface PromptSidebarProps {
  saveState: "saved" | "saving" | "failed";
  onRetrySave: () => void;
  lib: Library;
  view: View;
  changeView: (nextView: View) => void;
  newPrompt: () => void;
  allTagsWithCounts: TagCount[];
  sidebarTags: TagCount[];
  setTagExplorerOpen: (open: boolean) => void;
  setCollectionToDelete: (collection: Library["collections"][number]) => void;
}

function NavItem({
  v,
  currentView,
  icon: Icon,
  label,
  n,
  onNavigate,
}: NavigationProps & {
  currentView: View;
  onNavigate: (nextView: View) => void;
}) {
  const isActive = JSON.stringify(v) === JSON.stringify(currentView);
  return (
    <button
      className="nav-item"
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      onClick={() => onNavigate(v)}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />{" "}
      <span className="truncate">{label}</span>
      {n !== undefined && n > 0 && <span className="count">{n}</span>}
    </button>
  );
}

export function PromptSidebar({
  lib,
  view,
  changeView,
  newPrompt,
  allTagsWithCounts,
  sidebarTags,
  setTagExplorerOpen,
  setCollectionToDelete,
  saveState,
  onRetrySave,
}: PromptSidebarProps) {
  const count = (filter: (prompt: Library["prompts"][number]) => boolean) =>
    lib.prompts.filter(filter).length;
  const active = (prompt: Library["prompts"][number]) =>
    prompt.status === "active";

  const renderNav = ({ v, icon, label, n }: NavigationProps) => (
    <NavItem
      key={label}
      v={v}
      currentView={view}
      icon={icon}
      label={label}
      n={n}
      onNavigate={changeView}
    />
  );

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-5 overflow-y-auto border-r bg-sidebar px-3.5 py-4 md:flex xl:w-64">
      <div className="flex items-center gap-2.5 px-1.5">
        <span
          className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <LibIcon className="size-4" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">
          PromptShelf
        </span>
      </div>
      <button
        className="btn-primary h-9 w-full py-1"
        onClick={() => newPrompt()}
      >
        <Plus className="size-4" /> New prompt{" "}
        <kbd className="ml-auto font-mono text-[10px] opacity-70">Ctrl N</kbd>
      </button>
      <nav aria-label="Primary navigation" className="space-y-1">
        {renderNav({ v: { k: "dashboard" }, icon: HomeIcon, label: "Home" })}
        {renderNav({
          v: { k: "all" },
          icon: FileText,
          label: "All Prompts",
          n: count(active),
        })}
        {renderNav({
          v: { k: "favorites" },
          icon: Star,
          label: "Favorites",
          n: count((p) => active(p) && p.favorite),
        })}
        {renderNav({
          v: { k: "pinned" },
          icon: Pin,
          label: "Pinned",
          n: count((p) => active(p) && p.pinned),
        })}
        {renderNav({ v: { k: "recent" }, icon: Clock, label: "Recently Used" })}
        {renderNav({
          v: { k: "templates" },
          icon: Wand2,
          label: "Templates",
          n: count((p) => active(p) && p.vars.length > 0),
        })}
      </nav>
      <Collections
        lib={lib}
        Nav={renderNav}
        onDelete={(c) => setCollectionToDelete(c)}
      />
      {allTagsWithCounts.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2">
            <span className="label">Tags</span>
            <button
              type="button"
              className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setTagExplorerOpen(true)}
              title="Browse all tags"
            >
              View all ({allTagsWithCounts.length})
            </button>
          </div>
          <div className="flex flex-wrap gap-1 px-1">
            {sidebarTags.map(({ tag, count: tagCount }) => (
              <button
                key={tag}
                type="button"
                className="chip group flex items-center gap-1 hover:border-primary/50 hover:bg-accent transition-colors"
                data-active={view.k === "tag" && view.tag === tag}
                onClick={() => changeView({ k: "tag", tag })}
              >
                <span>#{tag}</span>
                <span className="text-[10px] opacity-60 tabular-nums font-mono">
                  {tagCount}
                </span>
              </button>
            ))}
          </div>
          {allTagsWithCounts.length > sidebarTags.length && (
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1 rounded-md py-1 text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
              onClick={() => setTagExplorerOpen(true)}
            >
              <Tags className="size-3" />
              <span>
                + {allTagsWithCounts.length - sidebarTags.length} more tags…
              </span>
            </button>
          )}
        </div>
      )}
      <nav
        aria-label="Library management"
        className="mt-auto space-y-1 border-t pt-3"
      >
        {renderNav({
          v: { k: "archived" },
          icon: Archive,
          label: "Archived",
          n: count((p) => p.status === "archived"),
        })}
        {renderNav({
          v: { k: "trash" },
          icon: Trash2,
          label: "Trash",
          n: count((p) => p.status === "trash"),
        })}
        {renderNav({
          v: { k: "settings" },
          icon: Settings,
          label: "Backup & Settings",
        })}
        <div className="flex items-center gap-2 px-2.5 pt-2">
          <ThemeToggleCompact />
          <div className="ml-auto flex min-w-0 items-center gap-1.5">
            <span
              className="save-status flex min-w-0 items-center gap-1.5 rounded-md px-1 py-1 text-[11px] text-muted-foreground"
              data-state={saveState}
              role="status"
              aria-live="polite"
            >
              <span
                className="status-dot"
                data-status={saveState === "saved" ? "idle" : saveState}
                aria-hidden="true"
              />
              <span className="truncate">
                {saveState === "saved"
                  ? "Saved locally"
                  : saveState === "saving"
                    ? "Saving…"
                    : "Save failed"}
              </span>
            </span>
            {saveState === "failed" && (
              <button
                type="button"
                className="rounded px-1.5 py-1 text-[11px] font-semibold text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                onClick={onRetrySave}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </nav>
    </aside>
  );
}

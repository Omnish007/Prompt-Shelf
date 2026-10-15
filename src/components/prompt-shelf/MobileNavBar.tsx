import type { Library } from "@/lib/store";
import { Library as LibIcon, Plus } from "lucide-react";
import { CustomSelect } from "./CustomSelect";
import { ThemeToggleCompact } from "./ThemeControls";
import type { View } from "./types";

interface MobileNavBarProps {
  lib: Library;
  view: View;
  changeView: (view: View) => void;
  newPrompt: () => void;
  saveState: "saved" | "saving" | "failed";
  onRetrySave: () => void;
}

export function MobileNavBar({
  lib,
  view,
  changeView,
  newPrompt,
  saveState,
  onRetrySave,
}: MobileNavBarProps) {
  const tags = [
    ...new Set(
      lib.prompts
        .filter((prompt) => prompt.status === "active")
        .flatMap((prompt) => prompt.tags),
    ),
  ].sort();
  const mobileView =
    view.k === "collection"
      ? `collection:${view.id}`
      : view.k === "tag"
        ? `tag:${view.tag}`
        : view.k;
  const navigateMobile = (value: string) => {
    if (value.startsWith("collection:"))
      changeView({ k: "collection", id: value.slice("collection:".length) });
    else if (value.startsWith("tag:"))
      changeView({ k: "tag", tag: value.slice("tag:".length) });
    else changeView({ k: value as Exclude<View["k"], "collection" | "tag"> });
  };

  return (
    <header className="flex shrink-0 items-center gap-2 border-b bg-sidebar px-3 py-2 md:hidden">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <LibIcon className="size-4" />
      </span>
      <span className="sr-only">PromptShelf navigation</span>
      <CustomSelect<string>
        value={mobileView}
        onChange={navigateMobile}
        className="min-w-0 flex-1 h-9"
        icon={LibIcon}
        options={[
          { value: "dashboard", label: "Home" },
          { value: "all", label: "All Prompts" },
          { value: "favorites", label: "Favorites" },
          { value: "pinned", label: "Pinned" },
          { value: "recent", label: "Recently Used" },
          { value: "templates", label: "Templates" },
          { value: "archived", label: "Archived" },
          { value: "trash", label: "Trash" },
          { value: "settings", label: "Backup & Settings" },
          ...lib.collections.map((collection) => ({
            value: `collection:${collection.id}`,
            label: collection.name,
          })),
          ...tags.map((tag) => ({ value: `tag:${tag}`, label: `#${tag}` })),
        ]}
      />
      <button
        className="btn-primary shrink-0 px-2"
        aria-label="New prompt"
        onClick={() => newPrompt()}
      >
        <Plus className="size-4" />
        <span className="hidden sm:inline">New</span>
      </button>
      {saveState === "failed" ? (
        <button
          type="button"
          className="btn-ghost size-8 shrink-0 justify-center px-0"
          aria-label="Saving failed. Retry saving changes"
          title="Retry saving changes"
          onClick={onRetrySave}
        >
          <span
            className="status-dot"
            data-status="failed"
            aria-hidden="true"
          />
        </button>
      ) : (
        <span
          className="mobile-save-indicator"
          role="status"
          aria-label={
            saveState === "saving"
              ? "Saving changes"
              : "All changes saved locally"
          }
          title={
            saveState === "saving"
              ? "Saving changes"
              : "All changes saved locally"
          }
        >
          <span
            className="status-dot"
            data-status={saveState === "saved" ? "idle" : "saving"}
            aria-hidden="true"
          />
        </span>
      )}
      <ThemeToggleCompact />
    </header>
  );
}

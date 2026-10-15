import type { Dispatch, RefObject, SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Copy,
  Hash,
  LayoutGrid,
  List,
  Pin,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { actions, type Collection, type Prompt } from "@/lib/store";
import { CustomSelect } from "./CustomSelect";
import { ago } from "./utils";
import type { SearchDocument, Sort, View } from "./types";

interface PromptListPaneProps {
  title: string;
  view: View;
  currentCollection: Collection | null;
  setCollectionToDelete: (collection: Collection) => void;
  trashCount: number;
  grid: boolean;
  setGrid: (grid: boolean) => void;
  q: string;
  setQ: (query: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  cursor: number;
  setCursor: Dispatch<SetStateAction<number>>;
  filtered: SearchDocument[];
  selected: string | null;
  setSelected: (id: string | null) => void;
  use: (prompt: Prompt) => void | Promise<void>;
  filterTags: string[];
  setFilterTags: Dispatch<SetStateAction<string[]>>;
  availableViewTags: string[];
  setTagExplorerOpen: (open: boolean) => void;
  changeView: (view: View) => void;
  sort: Sort;
  setSort: (sort: Sort) => void;
  newPrompt: () => void;
}

export function PromptListPane({
  title,
  view,
  currentCollection,
  setCollectionToDelete,
  trashCount,
  grid,
  setGrid,
  q,
  setQ,
  searchRef,
  cursor,
  setCursor,
  filtered,
  selected,
  setSelected,
  use,
  filterTags,
  setFilterTags,
  availableViewTags,
  setTagExplorerOpen,
  changeView,
  sort,
  setSort,
  newPrompt,
}: PromptListPaneProps) {
  return (
    <section
      className={`w-[320px] shrink-0 flex-col border-r data-[wide=true]:flex-1 lg:w-[410px] ${selected ? "hidden lg:flex" : "flex"}`}
      data-wide={!selected}
    >
      <header className="space-y-3 border-b px-4 pb-3.5 pt-4 bg-background/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] font-semibold tracking-tight truncate">
              {title}
            </h1>
            {view.k === "collection" && currentCollection && (
              <button
                type="button"
                className="btn-ghost size-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                title={`Delete collection "${currentCollection.name}"`}
                aria-label="Delete collection"
                onClick={() => setCollectionToDelete(currentCollection)}
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {view.k === "trash" && trashCount > 0 && (
              <button
                className="btn-danger text-xs"
                onClick={() =>
                  confirm("Permanently delete everything in Trash?") &&
                  actions.emptyTrash()
                }
              >
                Empty trash
              </button>
            )}
            <button
              className="btn-ghost p-1.5"
              aria-label="List view"
              data-active={!grid}
              onClick={() => setGrid(false)}
            >
              <List className="size-4" />
            </button>
            <button
              className="btn-ghost p-1.5"
              aria-label="Grid view"
              onClick={() => setGrid(true)}
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            className="field h-9 pl-9 pr-8"
            placeholder="Search prompts — typos welcome…"
            aria-label="Search prompts"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCursor(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, filtered.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              }
              if (e.key === "Enter" && filtered[cursor]) {
                if (e.ctrlKey) use(filtered[cursor]);
                else setSelected(filtered[cursor].id);
              }
              if (e.key === "Escape") setQ("");
            }}
          />
          {q && (
            <button
              type="button"
              className="btn-ghost absolute right-1 top-1/2 size-7 -translate-y-1/2 justify-center px-0"
              aria-label="Clear search"
              onClick={() => {
                setQ("");
                setCursor(0);
                searchRef.current?.focus();
              }}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Tag filter bar in prompt list - smart multi-tag management */}
        {view.k === "tag" ? (
          <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs text-primary">
            <div className="flex items-center gap-1.5 font-medium truncate">
              <Hash className="size-3.5 shrink-0" />
              <span className="truncate">Filtered by tag: #{view.tag}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button
                type="button"
                className="text-xs hover:underline font-medium text-primary"
                onClick={() => setTagExplorerOpen(true)}
              >
                + Add more tags
              </button>
              <button
                type="button"
                className="hover:underline font-semibold text-[11px]"
                onClick={() => changeView({ k: "all" })}
              >
                Clear
              </button>
            </div>
          </div>
        ) : availableViewTags.length > 0 || filterTags.length > 0 ? (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 shrink-0">
              Tags:
            </span>
            {filterTags.map((t) => (
              <button
                key={t}
                type="button"
                className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium shrink-0 shadow-xs hover:brightness-110 transition-colors"
                onClick={() => setFilterTags(filterTags.filter((x) => x !== t))}
                title={`Remove #${t}`}
              >
                <span>#{t}</span>
                <X className="size-3" />
              </button>
            ))}
            {filterTags.length > 1 && (
              <button
                type="button"
                className="text-[11px] text-muted-foreground hover:text-foreground font-medium px-1 shrink-0"
                onClick={() => setFilterTags([])}
              >
                Clear all
              </button>
            )}
            {availableViewTags
              .filter((t) => !filterTags.includes(t))
              .slice(0, 5)
              .map((t) => (
                <button
                  key={t}
                  type="button"
                  className="chip shrink-0 hover:border-primary/40 hover:bg-accent transition-colors"
                  onClick={() => setFilterTags([...filterTags, t])}
                >
                  #{t}
                </button>
              ))}
            <button
              type="button"
              className="text-[11px] text-muted-foreground hover:text-foreground px-1 shrink-0 font-medium"
              onClick={() => setTagExplorerOpen(true)}
            >
              {availableViewTags.length > 5
                ? `+${availableViewTags.length - 5} more…`
                : "Browse tags…"}
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
          <span>
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
            {q ? " · fuzzy search" : ""}
            {filterTags.length > 0
              ? ` · ${filterTags.map((t) => `#${t}`).join(" + ")}`
              : ""}
          </span>
          <CustomSelect<Sort>
            value={sort}
            onChange={(val) => setSort(val)}
            options={[
              { value: "updated", label: "Recently updated" },
              { value: "created", label: "Recently created" },
              { value: "used", label: "Recently used" },
              { value: "frequent", label: "Most used" },
              { value: "alpha", label: "A → Z" },
            ]}
            disabled={!!q}
            className="h-7 text-xs bg-transparent border-transparent hover:bg-accent/50 hover:border-border/60"
          />
        </div>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div
          className={
            grid
              ? "grid auto-rows-min grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5 p-3.5 sm:p-4"
              : "space-y-2.5 p-3.5 sm:p-4"
          }
        >
          {filtered.length === 0 && (
            <div className="col-span-full p-8 text-center text-sm text-muted-foreground">
              {q
                ? "No prompts found. Try fewer words or a different spelling."
                : filterTags.length > 0
                  ? `No prompts with matching tag${filterTags.length === 1 ? "" : "s"} (${filterTags.map((t) => `#${t}`).join(", ")}) found here.`
                  : "Nothing here yet."}
              {view.k !== "trash" &&
                view.k !== "archived" &&
                filterTags.length === 0 && (
                  <div className="mt-3">
                    <button className="btn-outline" onClick={() => newPrompt()}>
                      <Plus className="size-4" /> Create a prompt
                    </button>
                  </div>
                )}
              {filterTags.length > 0 && (
                <div className="mt-3">
                  <button
                    className="btn-outline text-xs"
                    onClick={() => setFilterTags([])}
                  >
                    Clear tag filters
                  </button>
                </div>
              )}
            </div>
          )}
          {filtered.map((p, i) => (
            <Card
              key={p.id}
              onClick={() => setSelected(p.id)}
              data-sel={p.id === selected}
              data-cur={i === cursor && !!q}
              className="prompt-row group"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {p.pinned && (
                      <Pin className="size-3.5 shrink-0 text-primary" />
                    )}
                    {p.favorite && (
                      <Star className="size-3.5 shrink-0 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
                    )}
                    <button
                      type="button"
                      className="min-w-0 truncate text-left text-[13.5px] font-semibold tracking-tight text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                      aria-label={`Open prompt: ${p.title || "Untitled"}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected(p.id);
                      }}
                    >
                      {p.title || "Untitled"}
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {p.description || p.content}
                  </p>
                </div>
                <button
                  className="btn-ghost size-7 shrink-0 justify-center p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  aria-label="Copy prompt"
                  title="Copy to clipboard"
                  onClick={(e) => {
                    e.stopPropagation();
                    use(p);
                  }}
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                {p.vars.length > 0 && (
                  <span className="chip border-primary/25 bg-primary/10 text-primary font-medium">
                    {p.vars.length} var{p.vars.length === 1 ? "" : "s"}
                  </span>
                )}
                {p.tags.slice(0, 2).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="chip hover:border-primary/40 hover:text-foreground cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      changeView({ k: "tag", tag: t });
                    }}
                    title={`Filter by #${t}`}
                    aria-label={`Filter prompts by tag ${t}`}
                  >
                    #{t}
                  </button>
                ))}
                {p.tags.length > 2 && (
                  <span className="text-[10px] text-muted-foreground/70">
                    +{p.tags.length - 2}
                  </span>
                )}
                <span className="ml-auto text-[10.5px] font-medium text-muted-foreground/80">
                  used {ago(p.lastUsedAt)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </section>
  );
}

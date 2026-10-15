import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Check,
  Folder,
  Hash,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { actions, type Library } from "@/lib/store";
import type { View } from "./types";

export function Collections({
  lib,
  Nav,
  onDelete,
}: {
  lib: Library;
  Nav: (p: {
    v: View;
    icon: typeof Star;
    label: string;
    n?: number | undefined;
  }) => ReactNode;
  onDelete: (c: { id: string; name: string }) => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between px-2">
        <span className="label">Collections</span>
        <button
          className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Add collection"
          title="Add collection"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {adding && (
        <input
          autoFocus
          className="field mb-1.5 py-1 text-xs"
          placeholder="Collection name"
          aria-label="New collection name"
          onBlur={() => setAdding(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              actions.addCollection(e.currentTarget.value.trim());
              setAdding(false);
            }
            if (e.key === "Escape") setAdding(false);
          }}
        />
      )}
      <div className="space-y-0.5">
        {lib.collections.map((c) => (
          <div key={c.id} className="group/col relative flex items-center">
            <div className="min-w-0 flex-1">
              <Nav
                key={c.id}
                v={{ k: "collection", id: c.id }}
                icon={Folder}
                label={c.name}
                n={
                  lib.prompts.filter(
                    (p) => p.status === "active" && p.collectionId === c.id,
                  ).length
                }
              />
            </div>
            <button
              type="button"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 size-6 rounded flex items-center justify-center text-muted-foreground/40 opacity-0 group-hover/col:opacity-100 hover:text-destructive hover:bg-destructive/15 transition-[color,background-color,opacity]"
              title={`Delete collection "${c.name}"`}
              aria-label={`Delete collection ${c.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c);
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeleteCollectionDialog({
  collection,
  promptCount,
  onConfirm,
  onClose,
}: {
  collection: { id: string; name: string };
  promptCount: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive mb-1">
            <Trash2 className="size-5" />
          </div>
          <AlertDialogTitle>
            Delete collection &ldquo;{collection.name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
            This will remove the collection folder. The{" "}
            <strong className="text-foreground">{promptCount}</strong> prompt
            {promptCount === 1 ? "" : "s"} inside will{" "}
            <strong className="text-foreground">not</strong> be deleted; they
            will stay safe in your library under{" "}
            <span className="font-medium text-foreground">All Prompts</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            <Trash2 className="size-4 mr-1.5" /> Delete Collection
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function TagExplorerDialog({
  tagsWithCounts,
  selectedTags,
  onApplyTags,
  onClose,
}: {
  tagsWithCounts: { tag: string; count: number }[];
  selectedTags: string[];
  onApplyTags: (tags: string[]) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string[]>(selectedTags);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const toggleTag = (tag: string) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return tagsWithCounts;
    return tagsWithCounts.filter((t) => t.tag.toLowerCase().includes(q));
  }, [tagsWithCounts, filter]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl panel pop p-5 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tag-explorer-title"
      >
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Hash className="size-4" />
            </span>
            <div>
              <h3
                id="tag-explorer-title"
                className="text-base font-semibold tracking-tight text-foreground"
              >
                Browse & Filter by Tags{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({tagsWithCounts.length} available)
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Select one or more tags to filter prompts. The dialog stays open
                while you pick.
              </p>
            </div>
          </div>
          <button
            className="btn-ghost size-8 p-0 justify-center"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            className="field h-9 pl-9 pr-8"
            placeholder="Search tags…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filter && (
            <button
              type="button"
              className="btn-ghost absolute right-1.5 top-1/2 size-6 -translate-y-1/2 justify-center p-0"
              onClick={() => setFilter("")}
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {selected.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-primary">
                {selected.length} selected:
              </span>
              {selected.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded bg-primary text-primary-foreground px-1.5 py-0.5 text-[11px] font-mono font-medium"
                >
                  #{tag}
                  <button
                    type="button"
                    className="hover:opacity-75"
                    onClick={() => toggleTag(tag)}
                    aria-label={`Remove #${tag}`}
                  >
                    <X className="size-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0 ml-2"
              onClick={() => setSelected([])}
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 min-h-[200px]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No tags matching &ldquo;{filter}&rdquo;
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 p-1">
              {filtered.map(({ tag, count }) => {
                const isSelected = selected.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono transition-[background-color,border-color,color,transform] hover:scale-102 active:scale-98 cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40 font-semibold"
                        : "border-border/70 bg-secondary/50 text-secondary-foreground hover:border-primary/40 hover:bg-accent"
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {isSelected && (
                      <Check className="size-3 text-primary-foreground shrink-0" />
                    )}
                    <span>#{tag}</span>
                    <span
                      className={`rounded px-1 text-[10px] tabular-nums ${
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                          : "bg-background/80 text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
          <span>
            {selected.length
              ? `${selected.length} tag${selected.length === 1 ? "" : "s"} selected`
              : "Click tags to select multiple"}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onApplyTags(selected)}
            >
              Apply Filter {selected.length > 0 ? `(${selected.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

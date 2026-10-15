import { Library as LibraryIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function LibraryLoading() {
  return (
    <main
      className="min-h-screen bg-background px-5 py-14 text-muted-foreground sm:px-8"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <span
            className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <LibraryIcon className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Opening PromptShelf
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Loading your saved library…
            </p>
          </div>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="mt-6 space-y-3 rounded-xl border bg-card p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </main>
  );
}

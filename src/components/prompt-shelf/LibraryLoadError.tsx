import { AlertTriangle, RotateCw, Database, ShieldCheck } from "lucide-react";

interface LibraryLoadErrorProps {
  error: string;
  onRetry: () => void;
}

export function LibraryLoadError({ error, onRetry }: LibraryLoadErrorProps) {
  return (
    <main
      className="library-recovery min-h-screen bg-background px-5 py-12 text-foreground sm:px-8"
      aria-labelledby="library-recovery-title"
    >
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center">
        <div className="mb-7 flex items-center gap-3">
          <span
            className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            <Database className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">PromptShelf</p>
            <p className="text-xs text-muted-foreground">
              Local-first prompt workspace
            </p>
          </div>
        </div>

        <section className="library-recovery-card rounded-2xl border bg-card p-6 sm:p-8">
          <div
            className="mb-4 grid size-11 place-items-center rounded-xl border border-warning-border bg-warning-bg text-warning-text"
            aria-hidden="true"
          >
            <AlertTriangle className="size-5" />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-warning-text">
            Library unavailable
          </p>
          <h1
            id="library-recovery-title"
            className="text-2xl font-semibold tracking-tight"
          >
            We couldn’t open your saved prompts.
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            Your saved library has not been replaced with starter data. Check
            that browser storage is available or that the desktop database can
            be opened, then try again.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-primary h-10 px-4"
              onClick={onRetry}
            >
              <RotateCw className="size-4" /> Retry loading
            </button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-success" /> Your existing
              data was not intentionally reset
            </div>
          </div>

          <details className="mt-6 rounded-lg border bg-background/60 px-3 py-2.5">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Technical details
            </summary>
            <p className="mt-2 break-words font-mono text-xs leading-relaxed text-muted-foreground">
              {error || "Storage access failed without a diagnostic message."}
            </p>
          </details>
        </section>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          If this keeps happening, avoid clearing site data or deleting the
          desktop database until you have a backup.
        </p>
      </div>
    </main>
  );
}

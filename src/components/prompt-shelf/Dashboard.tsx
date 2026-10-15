import {
  Archive,
  ArrowUpRight,
  Clock3,
  Copy,
  FileText,
  Pin,
  Plus,
  Search,
  Sparkles,
  Star,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzePromptQuality } from "@/lib/prompt-quality";
import type { Library, Prompt } from "@/lib/store";

interface DashboardProps {
  lib: Library;
  open: (id: string) => void;
  use: (prompt: Prompt) => void;
  newPrompt: () => void;
  capture: () => void;
  search: () => void;
}

interface DashboardBlockProps {
  title: string;
  description: string;
  items: Prompt[];
  icon: LucideIcon;
  open: (id: string) => void;
  onUsePrompt: (prompt: Prompt) => void;
  createPrompt: () => void;
}

function DashboardBlock({
  title,
  description,
  items,
  icon: Icon,
  open,
  onUsePrompt,
  createPrompt,
}: DashboardBlockProps) {
  return (
    <section className="dashboard-panel min-w-0" aria-label={title}>
      <div className="dashboard-panel-heading">
        <div className="dashboard-panel-icon" aria-hidden="true">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {description}
          </p>
        </div>
        <span className="dashboard-panel-count">{items.length}</span>
      </div>
      <div className="dashboard-items">
        {items.length === 0 ? (
          <div className="dashboard-empty">
            <p>
              {title === "Pinned & favorites"
                ? "Keep your best prompts close at hand."
                : title === "Reusable templates"
                  ? "Prompts with {{variables}} appear here."
                  : "Your recently edited prompts will appear here."}
            </p>
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline"
              onClick={createPrompt}
            >
              Create a prompt
            </button>
          </div>
        ) : (
          items.slice(0, 5).map((prompt) => (
            <div className="dashboard-item" key={prompt.id}>
              <button
                type="button"
                className="dashboard-item-open"
                onClick={() => open(prompt.id)}
              >
                <span className="dashboard-item-mark" aria-hidden="true">
                  {prompt.pinned ? (
                    <Pin className="size-3.5" />
                  ) : prompt.favorite ? (
                    <Star className="size-3.5" />
                  ) : (
                    <FileText className="size-3.5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="dashboard-item-title">
                    {prompt.title || "Untitled prompt"}
                  </span>
                  <span className="dashboard-item-description">
                    {prompt.description ||
                      prompt.content.replace(/\s+/g, " ").trim() ||
                      "No description added yet."}
                  </span>
                </span>
                <ArrowUpRight
                  className="dashboard-item-arrow size-3.5 shrink-0"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                className="dashboard-use"
                aria-label={`Use prompt: ${prompt.title || "Untitled prompt"}`}
                title="Use prompt"
                onClick={() => onUsePrompt(prompt)}
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function Dashboard({
  lib,
  open,
  use,
  newPrompt,
  capture,
  search,
}: DashboardProps) {
  const active = lib.prompts.filter((prompt) => prompt.status === "active");
  const templates = active.filter((prompt) => prompt.vars.length > 0);
  const favorites = active.filter((prompt) => prompt.favorite);
  const recentlyUpdated = [...active].sort((a, b) => b.updatedAt - a.updatedAt);
  const pinnedAndFavorite = [...active]
    .filter((prompt) => prompt.pinned || prompt.favorite)
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        Number(b.favorite) - Number(a.favorite) ||
        b.updatedAt - a.updatedAt,
    );
  const templateItems = [...templates].sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );
  const weakest = active
    .map((prompt) => ({ prompt, report: analyzePromptQuality(prompt) }))
    .filter((entry) => entry.report.improvements.length > 0)
    .sort((a, b) => a.report.score - b.report.score)
    .slice(0, 4);

  return (
    <main
      className="dashboard-workspace flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7 xl:px-10"
      aria-labelledby="dashboard-title"
    >
      <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
        <section className="dashboard-hero">
          <div className="dashboard-hero-content">
            <div className="dashboard-eyebrow">
              <Sparkles className="size-3.5" /> YOUR PROMPT WORKSPACE
            </div>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="max-w-2xl">
                <h1 id="dashboard-title" className="dashboard-title">
                  Your best thinking, <span>ready to reuse.</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  A calm home for the instructions worth keeping. Search your
                  library, refine a prompt, and get back to work.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={capture}>
                  Quick capture <kbd className="ml-1">Ctrl ⇧ C</kbd>
                </Button>
                <Button onClick={newPrompt}>
                  <Plus className="size-4" /> New prompt
                </Button>
              </div>
            </div>
            <button
              type="button"
              className="dashboard-search-launch"
              onClick={search}
              aria-label="Open the prompt library search"
            >
              <Search className="size-4 shrink-0" />
              <span>Search prompts, tags, collections, or content…</span>
              <kbd>Ctrl K</kbd>
            </button>
          </div>
        </section>

        <section className="dashboard-overview" aria-label="Library overview">
          <div className="dashboard-overview-item">
            <span className="dashboard-overview-icon">
              <FileText className="size-4" />
            </span>
            <span className="dashboard-overview-copy">
              <strong>{active.length}</strong>
              <span>Saved prompts</span>
            </span>
          </div>
          <div className="dashboard-overview-item">
            <span className="dashboard-overview-icon">
              <WandSparkles className="size-4" />
            </span>
            <span className="dashboard-overview-copy">
              <strong>{templates.length}</strong>
              <span>Reusable templates</span>
            </span>
          </div>
          <div className="dashboard-overview-item">
            <span className="dashboard-overview-icon">
              <Star className="size-4" />
            </span>
            <span className="dashboard-overview-copy">
              <strong>{favorites.length}</strong>
              <span>Favorites</span>
            </span>
          </div>
          <div className="dashboard-overview-note">
            <Archive className="size-4" />
            <span>
              {lib.collections.length} collections · Stored on this device
            </span>
          </div>
        </section>

        <section
          className="grid gap-4 xl:grid-cols-3"
          aria-label="Your prompts"
        >
          <DashboardBlock
            title="Recently updated"
            description="Pick up where you left off"
            items={recentlyUpdated}
            icon={Clock3}
            open={open}
            onUsePrompt={use}
            createPrompt={newPrompt}
          />
          <DashboardBlock
            title="Pinned & favorites"
            description="Your most dependable prompts"
            items={pinnedAndFavorite}
            icon={Pin}
            open={open}
            onUsePrompt={use}
            createPrompt={newPrompt}
          />
          <DashboardBlock
            title="Reusable templates"
            description="Prompts with fill-in variables"
            items={templateItems}
            icon={WandSparkles}
            open={open}
            onUsePrompt={use}
            createPrompt={newPrompt}
          />
        </section>

        <section
          className="dashboard-health"
          aria-labelledby="library-health-title"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="dashboard-health-icon">
                  <Sparkles className="size-4" />
                </span>
                <h2
                  id="library-health-title"
                  className="text-sm font-semibold tracking-tight"
                >
                  Library health
                </h2>
              </div>
              <p className="mt-1.5 max-w-2xl text-sm leading-5 text-muted-foreground">
                Find prompts that could use a clearer goal, more context, or a
                defined output. This check runs entirely on your device.
              </p>
            </div>
            <span className="dashboard-health-caption">
              Private · Offline checks
            </span>
          </div>
          {weakest.length ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {weakest.map(({ prompt, report }) => (
                <button
                  key={prompt.id}
                  type="button"
                  className="health-row"
                  onClick={() => open(prompt.id)}
                >
                  <span
                    className="health-score"
                    data-grade={report.score >= 60 ? "good" : "needs-work"}
                  >
                    {report.score}
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <strong className="block truncate text-sm">
                      {prompt.title}
                    </strong>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {report.improvements
                        .slice(0, 2)
                        .map((check) => check.label.toLowerCase())
                        .join(" · ")}
                    </span>
                  </span>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-success-border bg-success-bg px-3.5 py-3 text-sm text-success-text">
              Your active prompts pass the current structural checks.
            </p>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
          <p>Designed for fast capture, clear thinking, and reuse.</p>
          <p className="font-mono">
            Ctrl N new · Ctrl K search · Ctrl S save · Ctrl ⇧ C capture
          </p>
        </div>
      </div>
    </main>
  );
}

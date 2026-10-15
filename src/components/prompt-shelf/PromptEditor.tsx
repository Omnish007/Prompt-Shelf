import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  Archive,
  CheckCircle2,
  Circle,
  Copy,
  CopyPlus,
  Folder,
  Hash,
  History,
  Pin,
  RotateCcw,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { CustomSelect } from "@/components/prompt-shelf/CustomSelect";
import {
  actions,
  norm,
  syncVars,
  type Library,
  type Prompt,
  type PromptVar,
} from "@/lib/store";
import { analyzePromptQuality } from "@/lib/prompt-quality";
import { ago } from "./utils";
import { VariableCard } from "./PromptVariables";

type EditorDraft = Pick<
  Prompt,
  "title" | "description" | "content" | "vars"
> & { dirty: boolean };

// Cache normalized content for untouched records; only the active draft changes while typing.
const normalizedContentCache = new WeakMap<Prompt, string>();
function normalizedPromptContent(prompt: Prompt) {
  const cached = normalizedContentCache.get(prompt);
  if (cached !== undefined) return cached;
  const value = norm(prompt.content);
  normalizedContentCache.set(prompt, value);
  return value;
}

export function Editor({
  p,
  lib,
  use,
  close,
  onDuplicate,
}: {
  p: Prompt;
  lib: Library;
  use: (p: Prompt) => void;
  close: () => void;
  onDuplicate: (id: string) => void;
}) {
  const [tagInput, setTagInput] = useState("");
  const [showHist, setShowHist] = useState(false);
  const [draft, setDraft] = useState<EditorDraft>(() => ({
    title: p.title,
    description: p.description,
    content: p.content,
    vars: p.vars,
    dirty: false,
  }));

  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const commitDraft = useCallback(
    (updateUI = true) => {
      const latest = draftRef.current;
      if (!latest.dirty) return;
      actions.update(p.id, {
        title: latest.title,
        description: latest.description,
        content: latest.content,
        vars: latest.vars,
      });
      const saved = { ...latest, dirty: false };
      draftRef.current = saved;
      if (updateUI) setDraft(saved);
    },
    [p.id],
  );

  // Editing stays local for a short debounce window so the whole library and Fuse index
  // are not rebuilt for every keystroke. Explicit saves and unmounts commit synchronously.
  useEffect(() => {
    if (!draft.dirty) return;
    const timeout = window.setTimeout(() => commitDraft(), 300);
    return () => window.clearTimeout(timeout);
  }, [
    draft.dirty,
    draft.title,
    draft.description,
    draft.content,
    draft.vars,
    commitDraft,
  ]);
  useEffect(() => {
    const onCommitRequest = () => commitDraft();
    window.addEventListener("promptshelf:commit-draft", onCommitRequest);
    return () =>
      window.removeEventListener("promptshelf:commit-draft", onCommitRequest);
  }, [commitDraft]);
  useEffect(() => () => commitDraft(false), [commitDraft]);

  const up = (patch: Partial<Prompt>) => {
    const localPatch: Partial<Omit<EditorDraft, "dirty">> = {};
    if (patch.title !== undefined) localPatch.title = patch.title;
    if (patch.description !== undefined)
      localPatch.description = patch.description;
    if (patch.content !== undefined) localPatch.content = patch.content;
    if (patch.vars !== undefined) localPatch.vars = patch.vars;
    const metadataPatch = { ...patch };
    delete metadataPatch.title;
    delete metadataPatch.description;
    delete metadataPatch.content;
    delete metadataPatch.vars;

    if (Object.keys(localPatch).length) {
      setDraft((previous) => {
        const content = localPatch.content ?? previous.content;
        const vars =
          localPatch.vars ??
          (localPatch.content !== undefined
            ? syncVars(content, previous.vars)
            : previous.vars);
        return { ...previous, ...localPatch, vars, dirty: true };
      });
    }
    if (Object.keys(metadataPatch).length) actions.update(p.id, metadataPatch);
  };

  const currentPrompt: Prompt = useMemo(
    () => ({
      ...p,
      title: draft.title,
      description: draft.description,
      content: draft.content,
      vars: syncVars(draft.content, draft.vars),
    }),
    [p, draft.title, draft.description, draft.content, draft.vars],
  );
  const dup = lib.prompts.find(
    (other) =>
      other.id !== p.id &&
      other.status !== "trash" &&
      draft.content.trim() &&
      normalizedPromptContent(other) === norm(draft.content),
  );
  const quality = useMemo(
    () => analyzePromptQuality(currentPrompt),
    [currentPrompt],
  );
  const similarTitle = useMemo(() => {
    if (draft.title.trim().length < 7) return null;
    const candidates = lib.prompts.filter(
      (other) =>
        other.id !== p.id &&
        other.status === p.status &&
        other.status !== "trash",
    );
    if (!candidates.length) return null;
    const index = new Fuse(candidates, {
      keys: [
        { name: "title", weight: 0.82 },
        { name: "description", weight: 0.18 },
      ],
      includeScore: true,
      ignoreLocation: true,
      threshold: 0.25,
    });
    const match = index.search(draft.title)[0];
    return match && (match.score ?? 1) <= 0.2 ? match.item : null;
  }, [lib.prompts, p.id, p.status, draft.title]);
  const setVar = (i: number, patch: Partial<PromptVar>) =>
    up({
      vars: currentPrompt.vars.map((v, j) =>
        j === i ? { ...v, ...patch } : v,
      ),
      content: draft.content,
    });

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex min-h-[57px] flex-wrap items-center gap-1 border-b px-2 py-2 sm:px-3">
        <button className="btn-primary" onClick={() => use(currentPrompt)}>
          <Copy className="size-4" />{" "}
          {currentPrompt.vars.length ? "Fill & copy" : "Copy"}
        </button>
        <button
          className="btn-ghost"
          onClick={() => actions.flag(p.id, { favorite: !p.favorite })}
          aria-label="Favorite"
        >
          <Star
            className={
              p.favorite ? "size-4 fill-primary text-primary" : "size-4"
            }
          />
        </button>
        <button
          className="btn-ghost"
          onClick={() => actions.flag(p.id, { pinned: !p.pinned })}
          aria-label="Pin"
        >
          <Pin className={p.pinned ? "size-4 text-primary" : "size-4"} />
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            commitDraft();
            onDuplicate(actions.duplicate(p.id));
          }}
          aria-label="Duplicate"
        >
          <CopyPlus className="size-4" />
        </button>
        <button
          className="btn-ghost"
          onClick={() => setShowHist(!showHist)}
          aria-label="History"
        >
          <History className="size-4" /> {p.versions.length}
        </button>
        <div className="ml-auto flex items-center gap-1">
          {p.status === "active" ? (
            <>
              <button
                className="btn-ghost"
                onClick={() => actions.flag(p.id, { status: "archived" })}
              >
                <Archive className="size-4" /> Archive
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  actions.flag(p.id, { status: "trash" });
                  close();
                  toast("Moved to Trash");
                }}
              >
                <Trash2 className="size-4" />
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-outline"
                onClick={() => actions.flag(p.id, { status: "active" })}
              >
                <RotateCcw className="size-4" /> Restore
              </button>
              {p.status === "trash" && (
                <button
                  className="btn-danger"
                  onClick={() => {
                    if (confirm("Delete this prompt forever?")) {
                      actions.deleteForever(p.id);
                      close();
                    }
                  }}
                >
                  Delete forever
                </button>
              )}
            </>
          )}
          <button className="btn-ghost" onClick={close} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          {dup && (
            <div className="rounded-lg border px-3.5 py-2.5 text-sm banner-warning">
              This content matches “{dup.title}”.{" "}
              <button
                className="font-semibold underline underline-offset-2"
                onClick={() => onDuplicate(dup.id)}
              >
                Open existing
              </button>
            </div>
          )}
          {!dup && similarTitle && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-sm banner-info">
              <span>
                <strong>Similar title:</strong> “{similarTitle.title}” — you may
                already have a prompt for this task.
              </span>
              <button
                className="font-semibold underline underline-offset-2"
                onClick={() => onDuplicate(similarTitle.id)}
              >
                Review it
              </button>
            </div>
          )}
          <input
            aria-label="Prompt title"
            maxLength={500}
            className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40"
            value={draft.title}
            placeholder="Untitled prompt"
            onChange={(e) => up({ title: e.target.value })}
          />
          <input
            aria-label="Prompt description"
            maxLength={5000}
            className="w-full bg-transparent text-sm leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/40"
            value={draft.description}
            placeholder="Short description (optional)"
            onChange={(e) => up({ description: e.target.value })}
          />
          <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border/60 bg-card/50 p-3 text-xs">
            <span className="font-medium text-muted-foreground">
              Collection:
            </span>
            <CustomSelect<string>
              value={p.collectionId ?? ""}
              onChange={(val) => up({ collectionId: val || null })}
              options={[
                { value: "", label: "No collection" },
                ...lib.collections.map((c) => ({
                  value: c.id,
                  label: c.name,
                  icon: Folder,
                })),
              ]}
              className="h-8 text-xs min-w-[170px]"
            />
            <div className="mx-1 hidden h-4 w-px bg-border/60 sm:block" />
            <span className="font-medium text-muted-foreground">Tags:</span>
            {p.tags.map((t) => (
              <span key={t} className="chip">
                <Hash className="size-3" />
                {t}
                <button
                  aria-label={`Remove ${t}`}
                  onClick={() => up({ tags: p.tags.filter((x) => x !== t) })}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              className="w-28 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/60"
              placeholder="+ add tag"
              aria-label="Add a prompt tag"
              maxLength={100}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                const t = norm(tagInput).replace(/\s/g, "-").replace(/^#/, "");
                if ((e.key === "Enter" || e.key === ",") && t) {
                  e.preventDefault();
                  if (!p.tags.includes(t)) up({ tags: [...p.tags, t] });
                  setTagInput("");
                }
              }}
            />
          </div>
          <textarea
            className="field min-h-[360px] resize-y rounded-xl bg-surface p-4 font-mono text-[13.5px] leading-[1.75]"
            value={draft.content}
            aria-label="Prompt content"
            maxLength={1_000_000}
            placeholder={
              "Write your prompt…\nUse {{variable}} for fill-in fields."
            }
            onChange={(e) => up({ content: e.target.value })}
          />
          {currentPrompt.vars.length > 0 && (
            <div className="panel space-y-4 p-5">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="label">Template Variables</span>
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                      {currentPrompt.vars.length}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Variables detected from{" "}
                    <code className="font-mono text-primary font-semibold">
                      {"{{name}}"}
                    </code>{" "}
                    in your prompt. Configure labels, input types, and defaults.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {currentPrompt.vars.map((v, i) => (
                  <VariableCard
                    key={v.name}
                    v={v}
                    onChange={(patch) => setVar(i, patch)}
                  />
                ))}
              </div>
            </div>
          )}
          <section
            className="panel prompt-coach space-y-3 p-4"
            aria-labelledby="prompt-coach-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="prompt-coach-title" className="text-sm font-semibold">
                    Prompt coach
                  </h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  A quick structural checklist. Your prompt is never sent to an
                  AI service.
                </p>
              </div>
              <div
                className="quality-score"
                data-grade={
                  quality.grade === "Strong structure"
                    ? "strong"
                    : quality.grade === "Good foundation"
                      ? "good"
                      : "needs-work"
                }
                aria-label={`Prompt quality score ${quality.score} out of 100`}
              >
                <strong>{quality.score}</strong>
                <span>/100</span>
              </div>
            </div>
            <Progress
              value={quality.score}
              className="h-1.5 bg-muted"
              aria-label="Prompt structure score"
            />
            <p className="text-xs font-medium text-foreground">
              {quality.grade}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {quality.checks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs"
                  data-passed={check.passed}
                >
                  {check.passed ? (
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                  ) : (
                    <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <div className="font-medium">{check.label}</div>
                    {!check.passed && (
                      <p className="mt-0.5 leading-relaxed text-muted-foreground">
                        {check.advice}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="border-t pt-2 text-[11px] leading-relaxed text-muted-foreground">
              This score checks structure, not model intelligence or guaranteed
              answer quality. Treat it as guidance, not a pass/fail grade.
            </p>
          </section>
          <div className="font-mono text-[11px] text-muted-foreground">
            Created {new Date(p.createdAt).toLocaleString()} · Updated{" "}
            {ago(p.updatedAt)} · Used {p.usageCount}× · {draft.content.length}{" "}
            chars
          </div>
        </div>
        {showHist && (
          <aside className="w-72 max-w-[45%] shrink-0 overflow-y-auto border-l p-3">
            <div className="label mb-2">Version history</div>
            {p.versions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Earlier versions appear here as you edit.
              </p>
            )}
            {p.versions.map((v) => (
              <div key={v.at} className="mb-2 rounded-md border p-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {new Date(v.at).toLocaleString()}
                  </span>
                  <button
                    className="text-primary hover:underline"
                    onClick={() => {
                      up({ title: v.title, content: v.content });
                      toast.success("Version restored");
                    }}
                  >
                    Restore
                  </button>
                </div>
                <p className="mt-1 line-clamp-4 font-mono text-[11px] text-muted-foreground">
                  {v.content}
                </p>
              </div>
            ))}
          </aside>
        )}
      </div>
    </section>
  );
}

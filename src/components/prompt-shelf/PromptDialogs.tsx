import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { CustomSelect } from "@/components/prompt-shelf/CustomSelect";
import { actions, render, type Prompt } from "@/lib/store";
import { copyText } from "./utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function Modal({
  children,
  close,
  title,
}: {
  children: ReactNode;
  close: () => void;
  title: string;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto border-border bg-popover p-6">
        <DialogHeader className="mb-1">
          <DialogTitle className="text-base font-semibold tracking-tight">
            {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function FillDialog({ p, close }: { p: Prompt; close: () => void }) {
  const init = () =>
    Object.fromEntries(
      p.vars.map((v) => [
        v.name,
        v.default || (v.type === "select" ? (v.options[0] ?? "") : ""),
      ]),
    );
  const [vals, setVals] = useState<Record<string, string>>(init);
  const missing = p.vars.filter((v) => v.required && !vals[v.name]?.trim());
  const out = render(p.content, vals);
  const go = () => {
    if (!missing.length) copyText(out, p.id).then(close);
  };
  return (
    <Modal title={p.title} close={close}>
      <div className="grid gap-4 md:grid-cols-2">
        <div
          className="space-y-3"
          onKeyDown={(e) => e.ctrlKey && e.key === "Enter" && go()}
        >
          {p.vars.map((v, i) => (
            <label key={v.name} className="block space-y-1">
              <span className="text-xs font-medium">
                {v.label}
                {v.required && <span className="text-primary"> *</span>}
              </span>
              {v.type === "multiline" ? (
                <textarea
                  autoFocus={i === 0}
                  className="field min-h-24 font-mono text-xs"
                  value={vals[v.name]}
                  onChange={(e) =>
                    setVals({ ...vals, [v.name]: e.target.value })
                  }
                />
              ) : v.type === "select" ? (
                <CustomSelect<string>
                  value={vals[v.name] || (v.options[0] ?? "")}
                  onChange={(val) => setVals({ ...vals, [v.name]: val })}
                  options={v.options.map((o) => ({ value: o, label: o }))}
                  className="w-full text-xs"
                />
              ) : (
                <input
                  autoFocus={i === 0}
                  className="field"
                  value={vals[v.name]}
                  onChange={(e) =>
                    setVals({ ...vals, [v.name]: e.target.value })
                  }
                />
              )}
            </label>
          ))}
        </div>
        <div className="flex flex-col">
          <span className="label mb-1">Preview</span>
          <pre className="max-h-80 flex-1 overflow-auto whitespace-pre-wrap rounded-md border bg-background p-3 font-mono text-xs">
            {out}
          </pre>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        {missing.length > 0 && (
          <span className="mr-auto text-xs text-muted-foreground">
            Fill in: {missing.map((m) => m.label).join(", ")}
          </span>
        )}
        <button className="btn-ghost" onClick={() => setVals(init())}>
          Reset
        </button>
        <button className="btn-ghost" onClick={close}>
          Cancel
        </button>
        <button
          className="btn-primary"
          disabled={missing.length > 0}
          onClick={go}
        >
          <Copy className="size-4" /> Copy rendered{" "}
          <kbd className="font-mono text-[10px] opacity-70">Ctrl ↵</kbd>
        </button>
      </div>
    </Modal>
  );
}

export function QuickCapture({ close }: { close: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const save = () => {
    if (!content.trim()) return;
    actions.create({
      title: title.trim() || content.trim().split("\n")[0]!.slice(0, 60),
      content,
    });
    toast.success("Prompt saved");
    close();
  };
  return (
    <Modal title="Quick capture" close={close}>
      <div
        className="space-y-3"
        onKeyDown={(e) => e.ctrlKey && e.key === "Enter" && save()}
      >
        <input
          className="field"
          aria-label="Prompt title (optional)"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          autoFocus
          className="field min-h-48 font-mono text-xs"
          placeholder="Paste or type a prompt…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={close}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!content.trim()}
            onClick={save}
          >
            Save <kbd className="font-mono text-[10px] opacity-70">Ctrl ↵</kbd>
          </button>
        </div>
      </div>
    </Modal>
  );
}

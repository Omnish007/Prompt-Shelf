import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { CustomSelect } from "@/components/prompt-shelf/CustomSelect";
import type { PromptVar } from "@/lib/store";

export function VariableCard({
  v,
  onChange,
}: {
  v: PromptVar;
  onChange: (patch: Partial<PromptVar>) => void;
}) {
  const optionsString = v.options.join(", ");
  const [prevOptionsString, setPrevOptionsString] = useState(optionsString);
  const [optionsInput, setOptionsInput] = useState(optionsString);

  if (prevOptionsString !== optionsString) {
    setPrevOptionsString(optionsString);
    setOptionsInput(optionsString);
  }

  const commitOptions = (str: string) => {
    const list = str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ options: list });
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-3.5 transition-[background-color,border-color] hover:border-border hover:bg-card/85 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-xs font-semibold text-primary border-primary/25 bg-primary/10"
          >
            {`{{${v.name}}}`}
          </Badge>
          <span className="text-[11px] text-muted-foreground font-medium">
            template placeholder
          </span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground select-none">
          <Switch
            checked={v.required}
            onCheckedChange={(checked) => onChange({ required: checked })}
          />
          <span>Required field</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Display Label
          </label>
          <input
            className="field h-8 text-xs"
            value={v.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={
              v.name.charAt(0).toUpperCase() +
              v.name.slice(1).replace(/[-_]/g, " ")
            }
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Input Type
          </label>
          <CustomSelect<PromptVar["type"]>
            value={v.type}
            onChange={(val) => onChange({ type: val })}
            options={[
              { value: "text", label: "Single line text" },
              { value: "multiline", label: "Multi-line text" },
              { value: "select", label: "Dropdown choices" },
            ]}
            className="h-8 text-xs w-full"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            {v.type === "select" ? "Default Choice" : "Default Value"}
          </label>
          {v.type === "select" ? (
            v.options.length > 0 ? (
              <CustomSelect<string>
                value={v.default || v.options[0] || ""}
                onChange={(val) => onChange({ default: val })}
                options={[
                  { value: "", label: "No default (select on fill)" },
                  ...v.options.map((opt) => ({ value: opt, label: opt })),
                ]}
                className="h-8 text-xs w-full"
              />
            ) : (
              <input
                className="field h-8 text-xs text-muted-foreground opacity-70"
                value=""
                placeholder="Add choices below first"
                disabled
              />
            )
          ) : (
            <input
              className="field h-8 text-xs"
              value={v.default}
              onChange={(e) => onChange({ default: e.target.value })}
              placeholder="Optional default…"
            />
          )}
        </div>
      </div>

      {v.type === "select" && (
        <div className="rounded-lg bg-surface/50 border border-border/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <label className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
              Choices List (comma separated)
            </label>
            <span className="text-muted-foreground text-[10.5px]">
              {v.options.length} choice{v.options.length === 1 ? "" : "s"}
            </span>
          </div>
          <input
            className="field h-8 text-xs"
            value={optionsInput}
            placeholder="Option 1, Option 2, Option 3"
            onChange={(e) => {
              setOptionsInput(e.target.value);
              commitOptions(e.target.value);
            }}
            onBlur={(e) => commitOptions(e.target.value)}
          />
          {v.options.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {v.options.map((choice) => (
                <span
                  key={choice}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-mono text-secondary-foreground border border-border/60"
                >
                  {choice}
                  <button
                    type="button"
                    className="hover:text-destructive cursor-pointer"
                    onClick={() => {
                      const updated = v.options.filter((c) => c !== choice);
                      onChange({ options: updated });
                      setOptionsInput(updated.join(", "));
                    }}
                    aria-label={`Remove option ${choice}`}
                  >
                    <X className="size-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

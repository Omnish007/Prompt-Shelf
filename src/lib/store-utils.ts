import type { PromptVar } from "./store-types";

export const uid = () => crypto.randomUUID();

export function extractVarNames(content: string): string[] {
  const out = new Set<string>();
  for (const m of content.matchAll(/\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g))
    out.add(m[1]!);
  return [...out];
}
export function syncVars(content: string, vars: PromptVar[]): PromptVar[] {
  return extractVarNames(content).map(
    (n) =>
      vars.find((v) => v.name === n) ?? {
        name: n,
        label: n.replace(/_/g, " "),
        type: "text",
        default: "",
        required: true,
        options: [],
      },
  );
}
export function render(content: string, values: Record<string, string>) {
  return content.replace(
    /\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g,
    (_, n) => values[n] ?? "",
  );
}

export const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

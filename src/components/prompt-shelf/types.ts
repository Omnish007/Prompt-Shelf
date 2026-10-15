import type { Prompt } from "@/lib/store";
import type { PromptSearchDocument } from "@/lib/prompt-search";

export type SearchDocument = Prompt & PromptSearchDocument;
export type View =
  | {
      k:
        | "all"
        | "favorites"
        | "pinned"
        | "recent"
        | "templates"
        | "archived"
        | "trash"
        | "settings"
        | "dashboard";
    }
  | { k: "collection"; id: string }
  | { k: "tag"; tag: string };
export type Sort = "updated" | "created" | "used" | "frequent" | "alpha";

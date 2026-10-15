export type VarType = "text" | "multiline" | "select";
export interface PromptVar {
  name: string;
  label: string;
  type: VarType;
  default: string;
  required: boolean;
  options: string[];
}
export interface Version {
  at: number;
  title: string;
  content: string;
}
export type Status = "active" | "archived" | "trash";
export interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  collectionId: string | null;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  status: Status;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
  usageCount: number;
  vars: PromptVar[];
  versions: Version[];
}
export interface Collection {
  id: string;
  name: string;
}
export interface Library {
  version: 1;
  /** Built-in library revision; separate from the exported file format version. */
  seedLibraryVersion?: number;
  prompts: Prompt[];
  collections: Collection[];
}

import {
  SEED_COLLECTIONS,
  SEED_LIBRARY_VERSION,
  SEED_PROMPTS,
} from "./seed-prompts";
import type { Collection, Library, Prompt } from "./store-types";
import { norm, syncVars, uid } from "./store-utils";

export function makePrompt(raw: Partial<Prompt>): Prompt {
  const p = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined),
  ) as Partial<Prompt>;
  const now = Date.now();
  const content = p.content ?? "";
  return {
    id: uid(),
    title: "Untitled prompt",
    description: "",
    content,
    collectionId: null,
    tags: [],
    favorite: false,
    pinned: false,
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    usageCount: 0,
    versions: [],
    ...p,
    vars: syncVars(content, p.vars ?? []),
  };
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeSeedPrompt(
  seed: (typeof SEED_PROMPTS)[number],
  collectionId: string | null,
): Prompt {
  const prompt = makePrompt({
    id: `builtin:${slug(seed.title)}`,
    title: seed.title,
    description: seed.description,
    content: seed.content,
    collectionId,
    tags: [...new Set(["starter", ...seed.tags])],
    favorite: seed.favorite ?? false,
    pinned: seed.pinned ?? false,
  });
  // Shared defaults keep newly seeded prompts consistent across first launch and later upgrades.
  for (const variable of prompt.vars) {
    if (variable.name === "length") {
      variable.type = "select";
      variable.options = [
        "3 bullet points",
        "one paragraph",
        "one page",
        "detailed report",
      ];
      variable.default = "one page";
    } else if (
      [
        "code",
        "error",
        "source_text",
        "notes",
        "feedback",
        "argument",
        "evidence",
        "repository_evidence",
        "data_or_summary",
        "schema",
      ].includes(variable.name)
    ) {
      variable.type = "multiline";
    } else if (variable.name === "tone") {
      variable.type = "select";
      variable.options = [
        "professional",
        "friendly",
        "concise",
        "formal",
        "persuasive",
      ];
      variable.default = "professional";
    }
  }
  return prompt;
}

export function starter(): Library {
  const collections: Collection[] = SEED_COLLECTIONS.map((name) => ({
    id: `builtin-collection:${slug(name)}`,
    name,
  }));
  const collectionId = new Map(
    collections.map((collection) => [collection.name, collection.id]),
  );
  const prompts = SEED_PROMPTS.map((seed) =>
    makeSeedPrompt(seed, collectionId.get(seed.collection) ?? null),
  );
  return {
    version: 1,
    seedLibraryVersion: SEED_LIBRARY_VERSION,
    prompts,
    collections,
  };
}

/** Add newly shipped built-ins without overwriting existing records or user edits. */
export function upgradeSeedLibrary(current: Library): Library {
  if ((current.seedLibraryVersion ?? 0) >= SEED_LIBRARY_VERSION) return current;
  const next: Library = {
    ...current,
    prompts: [...current.prompts],
    collections: [...current.collections],
    seedLibraryVersion: SEED_LIBRARY_VERSION,
  };
  const byName = new Map(
    next.collections.map((collection) => [
      norm(collection.name),
      collection.id,
    ]),
  );
  for (const name of SEED_COLLECTIONS) {
    const key = norm(name);
    if (!byName.has(key)) {
      const id = `builtin-collection:${slug(name)}`;
      next.collections.push({ id, name });
      byName.set(key, id);
    }
  }
  const existingIds = new Set(next.prompts.map((prompt) => prompt.id));
  for (const seed of SEED_PROMPTS) {
    const id = `builtin:${slug(seed.title)}`;
    if (existingIds.has(id)) continue;
    const prompt = makeSeedPrompt(
      seed,
      byName.get(norm(seed.collection)) ?? null,
    );
    next.prompts.push(prompt);
    existingIds.add(id);
  }
  return next;
}

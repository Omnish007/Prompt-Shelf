import Fuse from "fuse.js";

/** Fields intentionally included in local search; prompt content remains on-device. */
export interface PromptSearchDocument {
  id: string;
  title: string;
  description: string;
  tags: string[];
  content: string;
  collectionName: string;
  pinned: boolean;
}

/** Build once per visible collection so typing never rebuilds the index. */
export function createPromptSearchIndex<T extends PromptSearchDocument>(
  documents: T[],
) {
  return new Fuse<T>(documents, {
    includeScore: true,
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 1,
    keys: [
      { name: "title", weight: 0.5 },
      { name: "description", weight: 0.2 },
      { name: "tags", weight: 0.12 },
      { name: "content", weight: 0.13 },
      { name: "collectionName", weight: 0.05 },
    ],
  });
}

/** Match every query word somewhere in each result, while allowing small spelling errors. */
export function searchPromptDocuments<T extends PromptSearchDocument>(
  index: Fuse<T>,
  query: string,
): T[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const combined = new Map<string, { prompt: T; score: number }>();
  terms.forEach((term, termIndex) => {
    const results = index.search(term);
    const scores = new Map(
      results.map((result) => [result.item.id, result.score ?? 1] as const),
    );
    if (termIndex === 0) {
      for (const result of results) {
        combined.set(result.item.id, {
          prompt: result.item,
          score: result.score ?? 1,
        });
      }
    } else {
      for (const [id, entry] of combined) {
        const score = scores.get(id);
        if (score === undefined) combined.delete(id);
        else entry.score += score;
      }
    }
  });

  return [...combined.values()]
    .sort(
      (a, b) =>
        a.score - b.score || Number(b.prompt.pinned) - Number(a.prompt.pinned),
    )
    .map((entry) => entry.prompt);
}

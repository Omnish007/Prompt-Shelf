import { describe, expect, it } from "vitest";
import {
  createPromptSearchIndex,
  searchPromptDocuments,
  type PromptSearchDocument,
} from "@/lib/prompt-search";

const documents: PromptSearchDocument[] = [
  {
    id: "api-review",
    title: "Review API authorization",
    description: "Audit who may perform each operation.",
    tags: ["api", "security"],
    content: "Review endpoint access and object ownership.",
    collectionName: "Security",
    pinned: true,
  },
  {
    id: "database-index",
    title: "Optimize a database query",
    description: "Choose indexes from query plans.",
    tags: ["database", "performance"],
    content: "Compare explain plans and measure query latency.",
    collectionName: "Software Development",
    pinned: false,
  },
  {
    id: "outreach",
    title: "Write personalized client outreach",
    description: "Draft concise professional outreach.",
    tags: ["sales", "writing"],
    content: "Use a relevant observation and a clear next step.",
    collectionName: "Business",
    pinned: false,
  },
];

describe("local fuzzy prompt search", () => {
  const index = createPromptSearchIndex(documents);

  it("finds misspelled search terms without a remote service", () => {
    expect(
      searchPromptDocuments(index, "authorizaton").map((prompt) => prompt.id),
    ).toContain("api-review");
  });

  it("requires every query word to match somewhere in a result", () => {
    const results = searchPromptDocuments(index, "API security");
    expect(results.map((prompt) => prompt.id)).toEqual(["api-review"]);
  });

  it("returns no results for an empty query", () => {
    expect(searchPromptDocuments(index, "  ")).toEqual([]);
  });
});

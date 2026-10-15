import { describe, expect, it } from "vitest";
import {
  SEED_COLLECTIONS,
  SEED_LIBRARY_VERSION,
  SEED_PROMPTS,
} from "@/lib/seed-prompts";
import { extractVarNames, render } from "@/lib/store";

describe("built-in prompt library", () => {
  it("ships at least 100 complete, uniquely named, categorized prompts", () => {
    expect(SEED_LIBRARY_VERSION).toBeGreaterThan(0);
    expect(SEED_PROMPTS.length).toBeGreaterThanOrEqual(100);
    expect(
      new Set(SEED_PROMPTS.map((prompt) => prompt.title.toLowerCase())).size,
    ).toBe(SEED_PROMPTS.length);
    expect(
      SEED_PROMPTS.every(
        (prompt) =>
          prompt.title.trim() &&
          prompt.description.trim() &&
          prompt.content.length >= 300,
      ),
    ).toBe(true);
    expect(
      SEED_PROMPTS.every((prompt) =>
        (SEED_COLLECTIONS as readonly string[]).includes(prompt.collection),
      ),
    ).toBe(true);
    expect(SEED_COLLECTIONS).toContain("Freelancing & Client Work");
    expect(SEED_COLLECTIONS).toContain("Career & Interview Prep");
    expect(SEED_COLLECTIONS).toContain("AI & LLM Engineering");
  });

  it("uses only valid, unique named variables in built-in templates", () => {
    for (const prompt of SEED_PROMPTS) {
      const names = extractVarNames(prompt.content);
      expect(new Set(names).size).toBe(names.length);
      expect(names.every((name) => /^[a-zA-Z_][\w]*$/.test(name))).toBe(true);
    }
  });

  it("renders provided variables and safely replaces missing values", () => {
    expect(
      render("Hello {{ name }} — {{task}}", {
        name: "Sam",
        task: "review the diff",
      }),
    ).toBe("Hello Sam — review the diff");
    expect(render("A={{first}}; B={{second}}", { first: "one" })).toBe(
      "A=one; B=",
    );
  });
});

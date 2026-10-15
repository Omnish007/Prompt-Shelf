import { describe, expect, it } from "vitest";
import { analyzePromptQuality } from "@/lib/prompt-quality";

describe("local prompt quality checks", () => {
  it("rewards prompts with a clear goal, context, boundaries, and verification", () => {
    const report = analyzePromptQuality({
      title: "Review a production API",
      description: "Review correctness and security risks.",
      content: `Act as a senior engineer. Your task is to review the API code below.\n\nContext and constraints:\n{{code}}\n\nInclude findings in a table with evidence and impact. Do not invent issues; separate assumptions from facts. Verify each recommendation with a test and finish with a checklist. Explain which observations are confirmed by the supplied code, which remain hypotheses, and what additional evidence would resolve uncertainty. Prioritize fixes by realistic risk and user impact.`,
    });
    expect(report.score).toBeGreaterThanOrEqual(85);
    expect(report.improvements).toHaveLength(0);
  });

  it("gives actionable local suggestions for a vague prompt", () => {
    const report = analyzePromptQuality({
      title: "Help",
      description: "",
      content: "Do the thing.",
    });
    expect(report.score).toBeLessThan(60);
    expect(report.improvements.map((check) => check.id)).toContain("context");
    expect(report.improvements.every((check) => check.advice.length > 20)).toBe(
      true,
    );
  });

  it("does not transmit or modify prompt content", () => {
    const content = "Explain this simply.";
    const before = content;
    analyzePromptQuality({ title: "Explain simply", description: "", content });
    expect(content).toBe(before);
  });
});

export interface PromptQualityCheck {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  advice: string;
}

export interface PromptQualityReport {
  score: number;
  grade: "Strong structure" | "Good foundation" | "Needs more detail";
  checks: PromptQualityCheck[];
  improvements: PromptQualityCheck[];
}

type PromptForQuality = { title: string; description: string; content: string };

/**
 * Runs deterministic, offline checks against the prompt text. This deliberately avoids an
 * AI service: results are explainable, instant, free, and never transmit prompt content.
 */
export function analyzePromptQuality(
  prompt: PromptForQuality,
): PromptQualityReport {
  const content = prompt.content.trim();
  const text = content.toLowerCase();
  const checks: PromptQualityCheck[] = [
    {
      id: "goal",
      label: "Clear task or objective",
      passed:
        /\b(act as|your task|objective|goal|task|help me|create|analyze|design|review|explain|write|build|compare|evaluate)\b/.test(
          text,
        ),
      weight: 2,
      advice:
        "State the action you want and what a successful result should accomplish.",
    },
    {
      id: "context",
      label: "Relevant context or inputs",
      passed:
        /\b(context|background|input|evidence|requirements|constraints|source|code|data|audience|example|current state)\b|\{\{\s*[a-zA-Z_]/.test(
          text,
        ),
      weight: 2,
      advice:
        "Tell the model what information it can rely on; use {{variables}} for details that change between runs.",
    },
    {
      id: "output",
      label: "Expected output is described",
      passed:
        /\b(output|format|structure|return|include|deliver|table|checklist|schema|sections|bullet points|report)\b/.test(
          text,
        ),
      weight: 2,
      advice:
        "Specify the format, sections, level of detail, or examples that make the answer usable.",
    },
    {
      id: "constraints",
      label: "Constraints and boundaries",
      passed:
        /\b(do not|don't|avoid|must|should|limit|preserve|constraint|never|only when|out of scope)\b/.test(
          text,
        ),
      weight: 2,
      advice:
        "State non-negotiables, exclusions, relevant safety boundaries, and what not to assume.",
    },
    {
      id: "evidence",
      label: "Uncertainty and evidence handled",
      passed:
        /\b(evidence|source|cite|verify|assumption|uncertain|unknown|do not invent|don't invent|fact|hypothesis)\b/.test(
          text,
        ),
      weight: 1,
      advice:
        "Ask the model to separate facts from assumptions and to say when evidence is missing.",
    },
    {
      id: "verification",
      label: "Quality or verification step",
      passed:
        /\b(test|validate|verify|check|acceptance criteria|success criteria|regression|review|quality|measure)\b/.test(
          text,
        ),
      weight: 1,
      advice:
        "Add a final checklist, test case, or explicit criteria for judging whether the response is correct.",
    },
    {
      id: "specificity",
      label: "Enough detail to guide a useful answer",
      passed: content.length >= 300,
      weight: 2,
      advice:
        "Add task-specific context, edge cases, constraints, or a concrete example; length alone is not quality.",
    },
    {
      id: "title",
      label: "Descriptive prompt title",
      passed: prompt.title.trim().length >= 8,
      weight: 1,
      advice:
        "Use a task-focused title that will still make sense when it appears in search results.",
    },
  ];
  const possible = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce(
    (sum, check) => sum + (check.passed ? check.weight : 0),
    0,
  );
  const score = Math.round((earned / possible) * 100);
  return {
    score,
    grade:
      score >= 85
        ? "Strong structure"
        : score >= 60
          ? "Good foundation"
          : "Needs more detail",
    checks,
    improvements: checks.filter((check) => !check.passed),
  };
}

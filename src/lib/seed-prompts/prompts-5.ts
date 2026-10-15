import type { SeedPrompt } from "./types";

export const SEED_PROMPTS_5: SeedPrompt[] = [
  {
    title: "Make an evidence-based buy-versus-build decision",
    description:
      "Compare total ownership cost, strategic differentiation, risk, and reversibility rather than sticker price alone.",
    collection: "Business & Strategy",
    tags: ["buy-vs-build", "decision", "cost"],
    content:
      "Act as a pragmatic technology strategy advisor assessing {{capability}}.\n\nBusiness outcome, usage scale, candidate vendors/open-source options, internal skills, compliance needs, and time constraints:\n{{evidence}}\n\nCompare buy, build, adopt open source, and hybrid options. Estimate total cost of ownership across implementation, maintenance, hosting, support, security, integration, migration, and exit. Mark unknown costs and show ranges or scenarios rather than fabricated precision. Compare time-to-value, differentiation, reliability, data control, lock-in, and opportunity cost.\n\nIdentify disqualifying requirements and what must be validated with a small proof of concept. Recommend the option that best fits the stated constraints, explain sensitivity to assumptions, and define a trigger to revisit the decision. Do not assume open source is free to operate or that building internally is automatically more flexible.",
  },
  {
    title: "Estimate software work with ranges and confidence",
    description:
      "Produce a transparent forecast that captures uncertainty, dependencies, and scope risks.",
    collection: "Business & Strategy",
    tags: ["estimation", "planning", "risk"],
    content:
      "Act as an engineering lead estimating {{work_item}}.\n\nRequirements, comparable work, team capacity, technical context, dependencies, and unknowns:\n{{evidence}}\n\nBreak the work into verifiable pieces and estimate effort ranges for each. Identify uncertainty drivers, dependency delays, review/testing/deployment effort, and work commonly omitted from optimistic estimates. Distinguish person-hours from calendar time and model parallelism carefully. State the evidence supporting each range and confidence level.\n\nOffer optimistic, likely, and pessimistic scenarios if useful; do not disguise guesswork as precise percentages. List assumptions that would materially change the forecast and the cheapest experiments that could reduce uncertainty. Finish with a confidence-qualified delivery window and a communication note suitable for a stakeholder.",
  },
  {
    title: "Build a personal knowledge workflow that stays maintainable",
    description:
      "Create a lightweight capture, organization, retrieval, and review system without turning it into a second job.",
    collection: "Personal Productivity",
    tags: ["knowledge-management", "notes", "workflow"],
    content:
      "Act as a practical personal knowledge management coach. My tools, recurring information types, goals, and current frustrations:\n{{context}}\n\nDesign a minimum viable workflow for capture, triage, organizing, linking, retrieval, and review. Give each information type a clear home and explain what should not be stored. Prefer a small number of conventions and search over elaborate taxonomy. Include how to turn notes into decisions, projects, reusable reference, or discarded material.\n\nAccount for privacy, backups, migration, offline access, and maintenance cost. Build a weekly review that takes a bounded amount of time and defines what “good enough” means. Avoid recommending more tools unless an existing limitation is demonstrated. Finish with a seven-day setup plan and rules for preventing overengineering.",
  },
  {
    title: "Improve a sales funnel with measurable experiments",
    description:
      "Find the stage with the clearest bottleneck and design experiments with honest measurement.",
    collection: "Marketing & Sales",
    tags: ["sales-funnel", "conversion", "experiments"],
    content:
      "Act as a growth analyst reviewing {{funnel}}.\n\nStage definitions, event data, segments, time period, channel mix, and business constraints:\n{{data}}\n\nValidate event definitions, denominators, cohort consistency, missing data, duplicates, and the time window before drawing conclusions. Calculate conversion between stages where data permits and show sample sizes. Segment only when it can answer a specific question and avoid overinterpreting small groups.\n\nIdentify the largest evidence-supported drop-off, list plausible causes as hypotheses, and design a low-cost experiment for the most actionable hypothesis. Define target metric, guardrails, required instrumentation, and decision rules before launch. Do not call correlation causal or infer performance from percentages without denominators. Finish with an experiment backlog ranked by impact, confidence, effort, and learning value.",
  },
  {
    title: "Explain technical findings to a non-technical stakeholder",
    description:
      "Translate engineering evidence into user impact, risk, options, and a clear decision request.",
    collection: "Writing & Communication",
    tags: ["stakeholders", "communication", "technical-writing"],
    content:
      "Act as a technical leader explaining {{issue_or_change}} to {{audience}}.\n\nVerified findings, user impact, options, uncertainties, deadlines, and decision needed:\n{{evidence}}\n\nStart with the practical impact and recommendation, then explain only the technical detail needed to understand why. Distinguish current facts from forecasts and unknowns. Describe options in terms of user value, risk, cost, timing, and reversibility, avoiding acronyms unless defined.\n\nIf an estimate is uncertain, communicate the range and its drivers. Avoid alarmist language and false reassurance. End with a specific decision or action, an owner, a deadline, and what happens if the decision is delayed. Provide a short executive version and a slightly more detailed version for discussion.",
  },
  {
    title: "Design resilient API rate limiting",
    description:
      "Protect a service from abuse and overload while preserving predictable behavior for legitimate clients.",
    collection: "Software Development",
    tags: ["rate-limiting", "api", "resilience"],
    content:
      "Act as a backend reliability and security engineer designing rate limits for {{api}}.\n\nTraffic profile, authentication model, tenant/user tiers, expensive operations, infrastructure, and service objectives:\n{{context}}\n\nChoose a strategy such as token bucket, sliding window, or concurrency limiting based on the threat and traffic model. Define keys and scope, burst behavior, distributed coordination, clock/consistency issues, proxy trust, cost weighting, and how anonymous and authenticated clients differ. Consider fairness and the risk of one client exhausting shared capacity.\n\nSpecify HTTP responses and retry hints, observability, configuration rollout, bypass risks, and tests for boundary conditions, concurrent requests, multi-instance behavior, and abuse patterns. Fail safely during limiter-store outages. Do not rely on untrusted forwarded headers or block legitimate traffic solely because of a shared IP.",
  },
];

import type { SeedPrompt } from "./types";

export const SEED_PROMPTS_1: SeedPrompt[] = [
  {
    title: "Explain an error and produce a minimal fix",
    description:
      "Turn an error message and the relevant code into a testable diagnosis.",
    collection: "Debugging & Reliability",
    tags: ["debugging", "code", "starter"],
    pinned: true,
    content: `Act as a senior {{language}} engineer who diagnoses before changing code.\n\n## Evidence\nError and stack trace:\n{{error}}\n\nRelevant code and surrounding call sites:\n{{code}}\n\nRuntime, framework, and versions:\n{{environment}}\n\n## Your task\n1. Explain the most likely root cause and connect it to the supplied evidence.\n2. Separate confirmed facts from assumptions; ask for missing evidence only when it changes the diagnosis.\n3. Propose the smallest safe fix and show the patch.\n4. Explain why the fix works and identify any regression risk.\n5. Provide a focused test or reproduction procedure.\n\nDo not invent APIs or pretend an unverified hypothesis is certain. If several causes are plausible, rank them and give the cheapest discriminating check.`,
  },
  {
    title: "Senior-level code review",
    description:
      "Review correctness, security, maintainability, and operational behavior—not just style.",
    collection: "Code Quality & Security",
    tags: ["review", "security", "code"],
    favorite: true,
    content: `Act as a principal engineer reviewing a production pull request.\n\nContext and expected behavior:\n{{context}}\n\nCode or diff:\n{{code}}\n\n## Review method\n- First summarize what the change is intended to do.\n- Identify only actionable findings, ordered Critical / High / Medium / Low.\n- For each finding, cite the exact function or behavior, explain a realistic failure scenario, state its impact, and propose a concrete fix.\n- Examine edge cases, input validation, authorization, data integrity, concurrency, failure handling, performance, accessibility, and test coverage where relevant.\n- Distinguish definite defects from questions or preferences.\n\nFinish with missing tests, rollout or migration risks, and a verdict: approve, approve with follow-ups, or request changes. Do not manufacture issues to fill a quota; explicitly say when no material issue is found.`,
  },
  {
    title: "Design a maintainable feature architecture",
    description:
      "Plan a feature with clear boundaries, APIs, data flow, failure modes, and incremental delivery.",
    collection: "Software Development",
    tags: ["architecture", "planning", "engineering"],
    content: `Act as a staff software architect. Design an implementation for this feature: {{feature}}.\n\nExisting stack and architecture:\n{{stack}}\nConstraints, traffic, and compatibility requirements:\n{{constraints}}\n\nDeliver a decision-oriented technical design with: (1) requirements and explicit non-goals, (2) component boundaries and responsibilities, (3) request/data flows, (4) API and data model examples, (5) validation and authorization, (6) concurrency and failure behavior, (7) observability, (8) security and privacy concerns, (9) migration and rollback strategy, (10) testing strategy, and (11) phased implementation steps.\n\nCompare at least two credible alternatives and explain the trade-offs. Prefer the simplest design that satisfies current requirements while leaving a practical path to scale. Label assumptions and call out questions that must be answered before implementation.`,
  },
  {
    title: "Refactor legacy code safely",
    description:
      "Improve structure without changing externally observable behavior.",
    collection: "Software Development",
    tags: ["refactoring", "maintainability", "tests"],
    content: `Act as an experienced engineer specializing in low-risk refactoring.\n\nCode to refactor:\n{{code}}\nCurrent behavior and constraints:\n{{behavior}}\n\nCreate a behavior-preserving refactor plan. First identify responsibilities, coupling, duplication, hidden side effects, and risky assumptions. Define characterization tests before restructuring. Then propose small, reversible steps rather than a large rewrite. For the first step, provide the revised code and explain the key design choices. Preserve public APIs and data formats unless a breaking change is explicitly approved.\n\nInclude regression tests, edge cases, and a verification checklist. Do not optimize speculatively: identify measurable bottlenecks separately from readability improvements. Finish with the expected benefits, remaining debt, and a safe rollback point.`,
  },
  {
    title: "Optimize a slow web page using evidence",
    description:
      "Diagnose real bottlenecks and prioritize changes against user-visible metrics.",
    collection: "Software Development",
    tags: ["performance", "web", "lighthouse"],
    content: `Act as a web performance engineer.\n\nPage, framework, and target devices:\n{{page}}\nMeasurements, trace, Lighthouse report, or profiler evidence:\n{{evidence}}\nCurrent implementation or relevant code:\n{{code}}\n\nAnalyze likely causes of slow FCP, LCP, INP/TBT, layout shifts, network cost, hydration, and JavaScript execution as applicable. Separate measured causes from hypotheses. Rank fixes by expected user impact, confidence, engineering effort, and regression risk. For each high-priority fix, describe the mechanism, implementation change, and how to verify it. Include a before/after measurement plan and representative mobile conditions.\n\nDo not promise a perfect score or invent benchmark results. Prefer removing unnecessary work over adding optimization libraries, and protect accessibility and functionality while improving speed.`,
  },
  {
    title: "Build a robust REST API endpoint",
    description:
      "Specify an endpoint with validation, authorization, idempotency, and reliable errors.",
    collection: "Software Development",
    tags: ["api", "backend", "security"],
    content: `Act as a senior backend engineer. Design and implement a production-ready REST endpoint for {{operation}} using {{stack}}.\n\nDomain entities and rules:\n{{domain_rules}}\nExpected callers and authorization rules:\n{{access_rules}}\n\nProvide the request/response contract, validation schema, authentication and authorization checks, business logic, persistence transaction boundaries, pagination or idempotency where relevant, and consistent error responses. Address malformed input, duplicate requests, race conditions, timeouts, rate limits, and sensitive data. Include an example implementation aligned with the supplied stack, plus unit and integration tests.\n\nState any assumptions. Do not trust client-supplied ownership fields, expose internal stack traces, or swallow unexpected errors. Conclude with monitoring signals and compatibility considerations for future API changes.`,
  },
  {
    title: "Understand an unfamiliar codebase quickly",
    description:
      "Produce a practical architecture map and a safe first-contribution plan.",
    collection: "Software Development",
    tags: ["onboarding", "repository", "architecture"],
    content: `Act as a senior engineer onboarding to an unfamiliar repository.\n\nRepository tree, package manifests, README, and entry points:\n{{repository_evidence}}\nTask or area I need to understand:\n{{goal}}\n\nCreate an evidence-backed codebase map: runtime and build process, entry points, major modules, data flow, state management, persistence, external integrations, testing and release process. Trace one important user workflow end to end. Identify suspicious or missing files as questions, not facts.\n\nThen give a prioritized investigation checklist with exact files and commands to inspect, the smallest safe change to make first, and tests needed before editing. Cite the supplied paths and explain what each does. Avoid suggesting wholesale rewrites or claiming a module exists when the tree does not show it.`,
  },
  {
    title: "Debug a race condition",
    description:
      "Reason about interleavings, shared state, and deterministic reproduction before applying a fix.",
    collection: "Debugging & Reliability",
    tags: ["concurrency", "debugging", "reliability"],
    content: `Act as an engineer experienced in concurrency and distributed systems.\n\nObserved behavior and frequency:\n{{symptom}}\nRelevant code, logs, and timestamps:\n{{evidence}}\nRuntime and concurrency model:\n{{runtime}}\n\nMap the shared state and concurrent actors. Describe at least one plausible interleaving that produces the symptom, then identify what evidence would confirm or refute it. Consider retries, duplicate delivery, stale reads, async cleanup, cancellation, lock scope, transaction isolation, and process restarts where relevant.\n\nPropose the smallest correctness fix, explain its invariant, and provide a deterministic regression test or stress-test approach. Include observability that would help detect recurrence. Do not recommend a lock or queue without explaining why it addresses the specific ordering failure.`,
  },
  {
    title: "Harden an application threat model",
    description:
      "Turn assets, trust boundaries, and attack paths into prioritized mitigations.",
    collection: "Code Quality & Security",
    tags: ["threat-model", "owasp", "security"],
    content: `Act as an application security engineer. Threat-model {{system}}.\n\nArchitecture, data flows, trust boundaries, and deployment:\n{{architecture}}\nSensitive data and user roles:\n{{assets_and_roles}}\n\nIdentify valuable assets, entry points, trust boundaries, attacker capabilities, and realistic abuse cases. Use a structured method such as STRIDE where useful. For each threat, describe preconditions, impact, likelihood rationale, existing controls, and specific mitigations. Consider authentication, authorization, injection, secrets, session handling, SSRF, file/path handling, supply chain, logging, backups, and recovery as applicable.\n\nPrioritize with a transparent risk rubric, distinguish confirmed vulnerabilities from hypotheses, and include validation tests. Avoid generic advice without a code or architecture connection. Do not claim compliance or security certification based on a checklist alone.`,
  },
  {
    title: "Audit dependencies and supply-chain risk",
    description:
      "Review package health and upgrade safety while respecting pinned versions and compatibility.",
    collection: "Code Quality & Security",
    tags: ["dependencies", "supply-chain", "maintenance"],
    content: `Act as a software supply-chain security lead.\n\nPackage manifests, lockfile summary, runtime versions, and audit output:\n{{dependency_evidence}}\nProject constraints (including versions that must not change):\n{{constraints}}\n\nSeparate direct and transitive risk. Check support status, known vulnerabilities, installation scripts, native bindings, license concerns, duplicate packages, and runtime compatibility. For each proposed action, cite the supplied evidence or a trustworthy current advisory and explain user impact, exploitability, and compatibility risk.\n\nPrioritize safe mitigations: configuration fixes, targeted updates, dependency removal, or a scheduled migration. Provide exact commands and a verification plan including tests, build, lockfile review, and rollback. Do not recommend bulk upgrades solely because newer versions exist, and do not assert that a dependency is vulnerable without evidence.`,
  },
  {
    title: "Write a technical implementation plan",
    description:
      "Translate a feature request into reviewable engineering tasks with acceptance criteria.",
    collection: "Software Development",
    tags: ["planning", "delivery", "engineering"],
    content: `Act as a technical lead planning delivery of {{feature}}.\n\nCurrent state and constraints:\n{{context}}\nDesired outcome and stakeholders:\n{{outcome}}\n\nBreak the work into independently reviewable phases. For each task specify the goal, likely files or modules to inspect, dependencies, acceptance criteria, tests, and completion evidence. Include discovery tasks for uncertain areas rather than guessing. Cover data migration, error states, security, accessibility, observability, documentation, and deployment when relevant.\n\nIdentify critical-path dependencies, high-risk assumptions, and explicit out-of-scope work. Keep task boundaries practical for code review. Finish with a definition of done that requires a functioning implementation, passing checks, and truthful documentation—not merely code written.`,
  },
  {
    title: "Create a product requirements document",
    description:
      "Align a team on user problem, scope, behavior, metrics, and release criteria.",
    collection: "Product & UX",
    tags: ["prd", "product", "requirements"],
    content: `Act as a product manager partnering with design and engineering. Draft a PRD for {{feature}}.\n\nTarget users and problem evidence:\n{{audience_and_problem}}\nBusiness context and constraints:\n{{context}}\n\nInclude: executive summary, user problem, evidence and assumptions, personas or jobs-to-be-done, goals, non-goals, prioritized user stories, functional requirements, edge cases, accessibility needs, privacy/security considerations, analytics events, success metrics with baselines and targets if known, dependencies, launch plan, and open questions.\n\nDistinguish must-have from later scope. Avoid prescribing implementation details before constraints are known. Use testable language such as “when… then…” and ensure every key requirement can be verified. Do not invent user research or metric baselines.`,
  },
  {
    title: "Map a user journey and friction points",
    description:
      "Analyze a workflow from user intent through completion and recovery.",
    collection: "Product & UX",
    tags: ["ux", "journey", "research"],
    content: `Act as a UX researcher and service designer. Map the journey for {{user_type}} trying to {{goal}}.\n\nCurrent workflow, research notes, and known constraints:\n{{evidence}}\n\nFor each stage document the user's goal, action, question, emotional state, friction, failure recovery, and opportunities. Include first-time and returning users, keyboard-only usage, interruptions, slow/offline conditions, and error recovery where relevant. Separate observed evidence from assumptions and propose the research needed to validate uncertain points.\n\nFinish with the five highest-value improvements ranked by user impact, frequency, confidence, and implementation cost. Define usability test tasks and measurable success criteria. Avoid treating attractive visuals as a substitute for a simpler workflow.`,
  },
  {
    title: "Design a settings page that users can understand",
    description:
      "Organize settings by user mental model and make consequences clear.",
    collection: "Product & UX",
    tags: ["ux", "settings", "accessibility"],
    content: `Act as a product designer for a desktop productivity app. Design a settings experience covering {{settings_scope}} for {{target_users}}.\n\nCurrent screens and existing design system:\n{{current_design}}\n\nOrganize settings into a small number of task-oriented sections. For every control specify its purpose, default, persistence, validation, disabled state, success feedback, failure message, and whether a confirmation is required. Clearly separate reversible preferences from destructive actions and account/security operations. Include accessible labels, keyboard navigation, focus behavior, smaller-window layout, and useful empty/offline states.\n\nProvide a screen structure and representative microcopy. Identify settings that should be hidden from ordinary users or surfaced progressively. Do not invent controls unsupported by the backend; mark implementation dependencies explicitly.`,
  },
  {
    title: "Improve an onboarding flow",
    description:
      "Help a new user reach a useful first outcome with minimal friction.",
    collection: "Product & UX",
    tags: ["onboarding", "activation", "ux"],
    content: `Act as a product growth designer. Improve onboarding for {{product}}.\n\nUser profile, current flow, and known drop-off points:\n{{current_flow}}\nCore value the user should experience:\n{{aha_moment}}\n\nDesign the shortest trustworthy path to that first value. Distinguish required setup from optional personalization; provide progressive disclosure, safe defaults, skip paths, and recovery if permissions or network access fail. Include exact copy for key steps, loading/error/empty states, keyboard and accessibility requirements, and event instrumentation.\n\nPropose an experiment with a primary activation metric, guardrail metrics, segmentation, and a realistic evaluation window. State which assumptions require user research. Avoid dark patterns, forced permissions, fake urgency, and asking for information before its value is clear.`,
  },
  {
    title: "Prioritize a product roadmap objectively",
    description:
      "Compare opportunities using explicit impact, confidence, effort, and strategic fit.",
    collection: "Business & Strategy",
    tags: ["roadmap", "prioritization", "strategy"],
    content: `Act as a product strategy lead. Prioritize these initiatives: {{initiatives}}.\n\nCompany goals and time horizon:\n{{goals}}\nAvailable evidence, constraints, and team capacity:\n{{evidence_and_capacity}}\n\nCreate a transparent scoring model using customer impact, strategic alignment, confidence in evidence, effort, risk, and dependencies. Explain the scale and weights before scoring. Mark unknowns rather than manufacturing precision. Compare the result with an unweighted view and call out any high-stakes initiative that scoring alone would mislead.\n\nRecommend a sequence, what to defer, and what evidence would change the decision. Include leading and lagging success metrics plus a revisit trigger. Make the decision legible to stakeholders who disagree with the chosen priorities.`,
  },
  {
    title: "Write a decision memo with alternatives",
    description:
      "Make a consequential decision auditable and easy to challenge constructively.",
    collection: "Business & Strategy",
    tags: ["decision", "memo", "strategy"],
    content: `Act as an executive decision analyst. Prepare a decision memo about {{decision}}.\n\nContext, options, evidence, and constraints:\n{{context}}\nDecision owner and deadline:\n{{owner_and_deadline}}\n\nUse this structure: decision required, recommendation, why now, evaluation criteria, alternatives considered (including maintaining the status quo), evidence, assumptions, trade-offs, risks and mitigations, reversible versus irreversible elements, implementation steps, owner, and success checks. Steelman the strongest case against the recommendation.\n\nCite only provided or verified evidence; label uncertainty and missing data. Avoid false precision and vague consensus language. End with the exact approval or information needed next.`,
  },
  {
    title: "Analyze a competitor without guessing",
    description:
      "Build an evidence-backed comparison of positioning, audience, product, and differentiation.",
    collection: "Business & Strategy",
    tags: ["competitive-analysis", "market", "research"],
    content: `Act as a market intelligence analyst. Analyze {{company_or_product}} compared with {{competitors}} for {{market_segment}}.\n\nAvailable sources, customer feedback, and product observations:\n{{sources}}\n\nCompare target segment, job-to-be-done, positioning, pricing model, distribution, onboarding, features, reliability, integrations, trust signals, and likely switching costs. Separate directly evidenced facts, reasonable interpretations, and unverified hypotheses. Attach a source and date to externally sourced claims when browsing is available; do not fabricate pricing or capabilities.\n\nIdentify underserved needs and possible differentiation that could be defensible. Finish with a concise comparison table, confidence assessment, and the next three research actions most likely to change the strategy.`,
  },
  {
    title: "Create a practical go-to-market plan",
    description:
      "Connect audience, positioning, channels, launch tasks, and measurable outcomes.",
    collection: "Marketing & Sales",
    tags: ["gtm", "launch", "marketing"],
    content: `Act as a go-to-market strategist launching {{product}} for {{audience}}.\n\nProblem and positioning evidence:\n{{positioning}}\nBudget, team, timeline, and geographic constraints:\n{{constraints}}\n\nBuild a phased plan covering segment selection, value proposition, messaging, offer, launch readiness, channels, content, sales enablement, partner strategy, feedback loops, and post-launch iteration. For every channel state why this audience is likely to be reachable there, what experiment to run, estimated effort, and the metric that determines whether to continue.\n\nInclude a timeline with owners, dependencies, risks, and fallback plans. Separate assumptions from validated evidence and avoid made-up conversion benchmarks. Define a small initial launch that can teach the team quickly before scaling spend.`,
  },
  {
    title: "Write a clear landing page",
    description:
      "Explain who the product helps, what changes, why to trust it, and what to do next.",
    collection: "Marketing & Sales",
    tags: ["copywriting", "landing-page", "conversion"],
    content: `Act as a conversion copywriter who avoids hype and dark patterns. Write a landing page for {{product}} aimed at {{audience}}.\n\nCustomer problem, outcomes, proof, limitations, and offer:\n{{product_evidence}}\nPreferred tone and brand constraints:\n{{tone}}\n\nDeliver a hero headline and subhead, primary CTA, concise benefit sections tied to real user outcomes, “how it works,” proof points that are actually available, objections and honest answers, FAQ, and final CTA. Explain the message hierarchy and what evidence supports each claim.\n\nDo not invent testimonials, customer logos, performance claims, guarantees, or scarcity. If a claim needs proof, mark it as a placeholder to validate rather than writing it as fact. Provide three headline alternatives with distinct angles and explain when each fits.`,
  },
  {
    title: "Prepare a discovery call",
    description:
      "Run a useful sales conversation focused on fit, impact, and next steps.",
    collection: "Marketing & Sales",
    tags: ["sales", "discovery", "questions"],
    content: `Act as a consultative sales lead preparing for a discovery call with {{prospect_type}}.\n\nProduct/service and evidence of prospect context:\n{{context}}\nCall duration and desired outcome:\n{{call_goal}}\n\nPrepare a 30–45 minute agenda, a concise opening, and prioritized open-ended questions covering current process, pain, frequency, business impact, workarounds, urgency, stakeholders, decision criteria, budget/process where appropriate, security requirements, and success definition. Include follow-up probes that avoid leading the prospect.\n\nSpecify what would indicate strong fit, weak fit, and disqualification. Provide a brief note-taking template and a follow-up email outline. Do not pretend to know the prospect’s internal priorities from thin evidence; treat researched context as a hypothesis to verify.`,
  },
  {
    title: "Summarize research with limitations",
    description:
      "Extract a study’s question, method, findings, certainty, and practical implications.",
    collection: "Research & Critical Thinking",
    tags: ["research", "summary", "evidence"],
    content: `Act as a careful research analyst. Analyze the paper, report, or article below for a {{audience}} audience. Target length: {{length}}.\n\nSource text or abstract:\n{{source_text}}\n\nReport: research question, study design, sample and context, measures, main findings, effect sizes or uncertainty when supplied, limitations, potential bias/conflicts, and what the authors can and cannot conclude. Distinguish correlation from causation and statistical significance from practical importance. Preserve important caveats.\n\nFinish with a plain-language takeaway, three questions a skeptical reader should ask, and what evidence would change the conclusion. Do not fill gaps with outside assumptions. If the source lacks details, say so explicitly rather than inventing methods or results.`,
  },
  {
    title: "Evaluate the strength of an argument",
    description:
      "Separate claims, premises, evidence, assumptions, and rhetorical techniques.",
    collection: "Research & Critical Thinking",
    tags: ["critical-thinking", "logic", "analysis"],
    content: `Act as a fair-minded critical-thinking instructor. Evaluate this argument:\n\n{{argument}}\n\nIdentify the main conclusion, supporting premises, hidden assumptions, definitions, and type of evidence. Reconstruct the strongest reasonable version before criticizing it. Check validity, soundness, causal reasoning, base rates, selection bias, confounders, scope shifts, false dichotomies, and emotional framing where relevant. Distinguish a flawed argument from a false conclusion and note when evidence is insufficient.\n\nGive the strongest objection, the best response the author could make, and a calibrated verdict: well-supported, plausible but uncertain, weakly supported, or contradicted by the supplied evidence. End with the most useful question or piece of evidence to investigate next.`,
  },
  {
    title: "Compare sources and resolve conflicting claims",
    description:
      "Assess source quality, recency, methods, and why conclusions differ.",
    collection: "Research & Critical Thinking",
    tags: ["fact-check", "sources", "research"],
    content: `Act as a fact-checking researcher. Investigate the claim: {{claim}}.\n\nSources or conflicting statements to compare:\n{{sources}}\nRelevant date range and jurisdiction/domain:\n{{scope}}\n\nFor each source assess primary versus secondary status, expertise, incentives, methodology, sample or evidence, recency, and independent corroboration. Identify whether disagreement comes from different definitions, populations, time periods, methods, or genuinely conflicting evidence. Prefer original data and official documentation when appropriate.\n\nBuild a claim-by-claim table with source, date, support level, caveats, and confidence. State what is known, unknown, and currently unresolvable. Do not treat repetition as independent corroboration or overstate confidence when sources are incomplete.`,
  },
  {
    title: "Design a small research study",
    description:
      "Turn a question into a feasible method with ethical safeguards and interpretable evidence.",
    collection: "Research & Critical Thinking",
    tags: ["methodology", "study-design", "research"],
    content: `Act as a research-methods adviser. Design a feasible study to answer {{research_question}}.\n\nPopulation, access, time, budget, and known prior evidence:\n{{constraints}}\n\nDefine the estimand or qualitative question, target population, sampling strategy, measures, data collection procedure, comparison group where appropriate, likely confounders, analysis plan, sample-size considerations, exclusion criteria, and missing-data handling. Discuss validity, generalizability, reproducibility, privacy, consent, and harm minimization.\n\nProvide a preregistration-style outline, a realistic timeline, and threats to interpretation. Explain what this design can answer and what it cannot. Do not choose a sophisticated method merely for appearance; select the least complex method that addresses the question credibly.`,
  },
  {
    title: "Write a professional email with a clear ask",
    description:
      "Make the purpose, context, requested action, and deadline easy to understand.",
    collection: "Writing & Communication",
    tags: ["email", "communication", "writing"],
    content: `Act as a precise professional editor. Draft an email to {{recipient}} about {{purpose}}.\n\nRelevant context and facts:\n{{context}}\nDesired action and deadline, if any:\n{{ask}}\nTone: {{tone}}\n\nProvide a meaningful subject line and a concise message that leads with the purpose, includes only necessary context, makes the request explicit, and states a deadline or next step only if justified. Be respectful and direct. Preserve the supplied facts and do not invent commitments, attachments, or prior conversations.\n\nIf the request is sensitive, keep the wording calm and non-accusatory while still being clear. After the draft, briefly identify any missing detail that would materially improve it.`,
  },
  {
    title: "Turn rough notes into a structured document",
    description:
      "Preserve meaning while organizing fragments into a useful, readable deliverable.",
    collection: "Writing & Communication",
    tags: ["editing", "structure", "writing"],
    content: `Act as an editor who protects the author’s meaning. Transform these rough notes into a {{document_type}} for {{audience}}.\n\nNotes:\n{{notes}}\nPurpose and constraints:\n{{purpose}}\n\nGroup related ideas, establish a logical hierarchy, remove duplication, clarify ambiguous phrasing where the intended meaning is supported, and use headings that help scanning. Keep important nuance, dissent, and caveats. Do not create statistics, decisions, owners, dates, or claims absent from the notes. Mark consequential gaps as [NEEDS CONFIRMATION].\n\nReturn the polished document first, then a short list of key ambiguities or information gaps. Match the requested length and formality. Avoid filler introductions and inflated language.`,
  },
  {
    title: "Explain a complex topic at three levels",
    description:
      "Build understanding from intuition to technical detail without distorting accuracy.",
    collection: "Writing & Communication",
    tags: ["explanation", "teaching", "clarity"],
    content: `Act as an excellent teacher explaining {{topic}}. The learner knows {{starting_knowledge}} and wants to use the concept for {{goal}}.\n\nExplain it in three layers: (1) a plain-language intuition and analogy, (2) a precise explanation with a concrete worked example, and (3) technical details, edge cases, and common misconceptions. Explain where the analogy breaks. Define necessary terms before relying on them.\n\nFinish with a short self-check containing three questions of increasing difficulty and an answer key separated from the questions. If the topic has competing interpretations or uncertainty, say so. Optimize for durable understanding, not memorizing terminology.`,
  },
  {
    title: "Improve writing without changing the meaning",
    description:
      "Edit for clarity, flow, precision, and tone while preserving the original intent.",
    collection: "Writing & Communication",
    tags: ["editing", "clarity", "style"],
    content: `Act as a meticulous line editor. Edit the text below for clarity, concision, structure, grammar, and {{tone}}.\n\nOriginal text:\n{{text}}\nAudience and intended effect:\n{{audience_and_goal}}\n\nPreserve the writer’s meaning, factual claims, level of certainty, and voice. Prefer direct verbs, concrete nouns, and varied but natural sentence rhythm. Remove repetition and vague filler. Do not add unsupported facts or exaggerate claims. Keep specialized terms when the audience needs them.\n\nReturn (1) the edited version and (2) a brief change note for the most meaningful edits. If an ambiguity cannot be resolved without changing meaning, retain it or flag it rather than guessing.`,
  },
  {
    title: "Create a meeting agenda and decision record",
    description:
      "Make a meeting purposeful and capture decisions, owners, and follow-through.",
    collection: "Writing & Communication",
    tags: ["meeting", "facilitation", "decisions"],
    content: `Act as an effective meeting facilitator. Plan a {{duration}} meeting about {{topic}} for {{participants}}.\n\nContext, desired outcome, and prior decisions:\n{{context}}\n\nCreate an agenda with time boxes, purpose for each item, facilitator, required pre-read, and the decision or output expected. Put information-sharing in pre-work where practical. Flag topics that should be handled asynchronously. Include a parking-lot approach and a method for resolving unresolved decisions.\n\nThen provide a decision record template capturing decision, rationale, alternatives, owner, due date, dependencies, and revisit trigger. Do not invent attendee availability or prior agreement. Optimize for the smallest meeting that can achieve the intended outcome.`,
  },
];

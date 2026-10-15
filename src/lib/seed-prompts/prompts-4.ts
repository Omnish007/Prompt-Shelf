import type { SeedPrompt } from "./types";

export const SEED_PROMPTS_4: SeedPrompt[] = [
  {
    title: "Design MongoDB indexes from real query patterns",
    description:
      "Use representative reads and writes to propose justified indexes and validation measurements.",
    collection: "Software Development",
    tags: ["mongodb", "indexes", "performance"],
    content:
      "Act as a MongoDB performance engineer. Collection schema, sample cardinalities, query patterns, sort orders, and current explain output:\n{{evidence}}\nRead/write mix and correctness constraints:\n{{constraints}}\n\nFor each important query, inspect predicates, sort, projection, selectivity, pagination, and expected data growth. Propose compound index field order with reasoning, and discuss index intersection, covered queries, partial indexes, uniqueness, multikey behavior, and write/storage cost where relevant. Verify each recommendation against the actual query shape and MongoDB version.\n\nRank indexes by observed benefit and operational cost. Provide explain-plan fields to compare, a staging benchmark, and a safe rollout/removal plan. Do not recommend indexes simply because a field is frequently mentioned, and do not invent performance results without measurements.",
  },
  {
    title: "Review API authorization boundaries",
    description:
      "Find object-level access bugs and ensure every sensitive operation enforces the correct permission.",
    collection: "Code Quality & Security",
    tags: ["api-security", "authorization", "rbac"],
    content:
      "Act as an application security engineer reviewing authorization for {{api_or_resource}}.\n\nRoutes, handlers, data model, roles, tenant model, and relevant middleware:\n{{evidence}}\n\nBuild an operation-by-role matrix for read, create, update, delete, export, and administrative actions. Check object-level authorization on every user-controlled identifier, tenant scoping in database queries, role escalation, mass assignment, ownership transfer, background jobs, and alternate API routes. Assume client-side hiding is not a security control.\n\nFor each finding, give a concrete request sequence, preconditions, impact, and minimal fix. Include tests for same-tenant allowed access, cross-tenant denied access, missing identity, insufficient role, and identifier substitution. Distinguish verified vulnerabilities from hypotheses and avoid exposing real secrets in test fixtures.",
  },
  {
    title: "Design a secure file-upload workflow",
    description:
      "Specify limits, validation, storage isolation, content handling, and failure-safe upload behavior.",
    collection: "Code Quality & Security",
    tags: ["upload", "file-security", "validation"],
    content:
      "Act as a secure application engineer designing uploads for {{file_use_case}}.\n\nAccepted formats, maximum sizes, users, storage, processing pipeline, and current framework:\n{{context}}\n\nSpecify extension allowlists, MIME checks, content signature validation, size/count limits, filename normalization, random storage names, path traversal defenses, authorization, malware scanning needs, safe parsing, and storage outside executable/public paths where appropriate. Treat client-provided filename and MIME type as untrusted. Define download authorization and content-disposition behavior.\n\nAddress partial uploads, duplicate submissions, cleanup, timeouts, quota, retention, and audit logs. Include malicious test cases such as double extensions, huge files, malformed archives, and traversal paths. Use layered controls based on threat model and do not claim a file is safe based on its extension alone.",
  },
  {
    title: "Run a practical accessibility audit",
    description:
      "Find high-impact keyboard, screen-reader, contrast, and motion issues with reproducible checks.",
    collection: "Product & UX",
    tags: ["accessibility", "wcag", "audit"],
    content:
      "Act as an accessibility specialist auditing {{page_or_flow}}.\n\nScreens, DOM/components, interaction flow, screenshots, current automated reports, and target platforms:\n{{evidence}}\n\nInspect semantic structure, names and labels, heading order, keyboard-only completion, focus visibility/order, modal focus trap and restoration, errors and instructions, contrast, text scaling, reflow, non-color cues, motion preferences, and assistive-technology announcements. Separate automated findings from manual checks and prioritize barriers by severity and frequency.\n\nFor each issue, provide a minimal reproduction, who is affected, expected behavior, relevant WCAG criterion when applicable, proposed fix, and regression test. Do not equate a clean automated score with accessibility conformance. Finish with a short manual test script and a prioritized remediation plan.",
  },
  {
    title: "Write an SEO content brief from search intent",
    description:
      "Create a useful, original content plan based on reader intent rather than keyword repetition.",
    collection: "Marketing & Sales",
    tags: ["seo", "content", "search-intent"],
    content:
      "Act as an evidence-led content strategist for {{topic}} and {{audience}}.\n\nSearch data, competitor pages, product expertise, first-party evidence, and business goal:\n{{evidence}}\n\nInfer the likely intent behind the query set and note where intent is ambiguous. Create a brief with primary question, reader's next decision, original angle, required subtopics, firsthand examples or data to add, subject-matter reviewer, useful sources to cite, title/meta-description concepts, internal-link opportunities, and a clear call to action. Distinguish observed SERP evidence from hypotheses.\n\nDo not promise rankings, stuff keywords, copy competitor phrasing, or recommend pages with no distinct user value. Include freshness and fact-check requirements, accessibility/readability guidance, and success metrics appropriate to the goal. Identify missing evidence that should be collected before drafting.",
  },
  {
    title: "Audit Core Web Vitals with a fix-first plan",
    description:
      "Turn field and lab performance evidence into prioritized, measurable remediation work.",
    collection: "Marketing & Sales",
    tags: ["web-vitals", "lighthouse", "performance"],
    content:
      "Act as a web performance lead. Site URL or route, devices, field data, Lighthouse report, traces, and build details:\n{{evidence}}\n\nSeparate field metrics from lab estimates and identify sample size, device/network conditions, route variability, and collection period. Investigate LCP element and resource timing, INP interactions and main-thread work, CLS contributors, image/font loading, JavaScript cost, caching, server response, and third-party scripts as relevant.\n\nRank changes by user impact, confidence, effort, and regression risk. For every proposed fix, describe the suspected mechanism and exact before/after measurement. Include mobile low-end-device scenarios and repeat tests over comparable conditions. Do not guarantee a perfect Lighthouse score or treat one lab run as proof of real-user improvement.",
  },
  {
    title: "Write ethical personalized cold outreach",
    description:
      "Draft a relevant message based on verified context and a specific, low-friction ask.",
    collection: "Marketing & Sales",
    tags: ["outreach", "sales", "personalization"],
    content:
      "Act as a thoughtful B2B outreach writer. Recipient role/company and verified public context:\n{{recipient_evidence}}\nMy relevant offer and proof I can genuinely support:\n{{offer_and_proof}}\n\nWrite a short message that connects one verified observation to a plausible business problem, explains why the offer may be relevant, and asks one easy-to-answer question. Keep personalization factual and modest. If there is no verified context, use an honest role- or industry-based opening instead of pretending to know the recipient's work.\n\nAvoid fake familiarity, exaggerated claims, pressure tactics, deceptive subject lines, and sensitive personal references. Provide two subject lines and a concise follow-up that adds information rather than repeating the first note. Include an appropriate opt-out where the channel and applicable rules call for it.",
  },
  {
    title: "Optimize a LinkedIn profile for a target role",
    description:
      "Make a professional profile easier to understand and more credible without keyword stuffing.",
    collection: "Career & Interview Prep",
    tags: ["linkedin", "career", "personal-brand"],
    content:
      "Act as a career positioning editor. Target roles and markets:\n{{target_roles}}\nCurrent profile and verifiable projects, results, and skills:\n{{profile_evidence}}\n\nClarify the strongest professional positioning, then propose a headline, About section, experience bullet revisions, featured-project choices, and a skills order. Tie important keywords to evidence that appears in the supplied profile or project record. Explain which changes improve clarity for a recruiter and which assumptions need validation.\n\nDo not invent metrics, endorsements, clients, or expertise. Avoid a crowded headline and generic superlatives. Preserve a natural voice and give a short checklist for consistency between profile, resume, portfolio, and target job description.",
  },
  {
    title: "Design a SaaS onboarding activation experiment",
    description:
      "Test whether a specific onboarding change helps new users reach meaningful value.",
    collection: "Product & UX",
    tags: ["saas", "onboarding", "experimentation"],
    content:
      "Act as a product growth researcher. Product, target users, current funnel, activation definition, and known friction:\n{{evidence}}\n\nState the behavioral hypothesis, the mechanism by which the change may help, target cohort, primary metric, guardrail metrics, instrumentation requirements, experiment unit, eligibility, and success threshold. Define the current baseline and minimum detectable effect only if data supports them; otherwise specify what baseline must be measured first.\n\nCover novelty effects, selection bias, sample-size limits, spillover, accessibility, privacy, and implementation risks. Include a qualitative feedback plan and decision rules for positive, negative, or inconclusive results. Do not claim statistical significance from a small or unplanned sample. Finish with a lightweight experiment brief and event QA checklist.",
  },
  {
    title: "Design a retrieval-augmented generation pipeline",
    description:
      "Plan a RAG system with traceable sources, retrieval evaluation, and safe handling of untrusted documents.",
    collection: "AI & LLM Engineering",
    tags: ["rag", "llm", "retrieval"],
    content:
      "Act as an applied AI architect designing RAG for {{use_case}}.\n\nCorpus types, volume, update frequency, access rules, latency target, deployment constraints, and example questions:\n{{context}}\n\nDesign ingestion, parsing, chunking, metadata, permission-aware filtering, embedding/model selection, indexing, retrieval, reranking if justified, context assembly, citation mapping, response validation, and update/deletion behavior. Compare lexical, vector, and hybrid retrieval for the actual query types. Keep access control enforced before content reaches the model.\n\nDefine a representative evaluation set with retrieval recall/precision, citation support, answer correctness, latency, and failure cases. Treat documents as untrusted data and include prompt-injection tests. Identify where model or embedding API usage incurs cost and offer a local-model option where feasible. Do not promise grounded answers without measuring source support.",
  },
  {
    title: "Create a prompt-injection red-team test suite",
    description:
      "Test whether an LLM workflow respects trust boundaries when retrieved or user-supplied content is adversarial.",
    collection: "AI & LLM Engineering",
    tags: ["prompt-injection", "red-team", "llm-security"],
    content:
      "Act as an LLM application security tester. System architecture, tools, data access, trust boundaries, and policy constraints:\n{{architecture}}\n\nBuild a risk-based test matrix for direct user injection, malicious instructions inside retrieved documents, tool-output injection, data exfiltration attempts, cross-tenant retrieval, secret disclosure, unauthorized tool calls, content-format tricks, multilingual attacks, and benign quoted examples. For each test specify setup, adversarial input, expected safe behavior, observed evidence, severity rationale, and regression assertion.\n\nEvaluate controls at the application/tool boundary rather than relying only on system prompts. Prefer least privilege, structured tool schemas, authorization checks, output validation, and explicit trust separation. Do not include real secrets in tests. Distinguish a model refusal from actual data isolation, and make every finding reproducible.",
  },
  {
    title: "Build reliable Playwright end-to-end tests",
    description:
      "Create resilient tests that assert user outcomes and avoid race-prone sleeps or implementation details.",
    collection: "Testing & QA",
    tags: ["playwright", "e2e", "reliability"],
    content:
      "Act as a test automation engineer working in {{framework}}. Critical user journey, application setup, existing tests, and known flaky behavior:\n{{context}}\n\nCreate an end-to-end test plan around user-visible outcomes. Use semantic locators and stable test IDs only when semantics are unavailable. Isolate test data, control network or clock dependencies deliberately, wait for observable states rather than fixed sleeps, and capture useful traces/screenshots on failure. Cover validation, permissions, navigation, reload persistence, keyboard usage, and important error states.\n\nIdentify what belongs in unit, integration, and E2E layers. Keep retries from hiding real flakiness, and avoid broad assertions that pass when the workflow is broken. Provide one representative test, test-fixture strategy, and CI command. Explain how to debug a failure locally and ensure tests clean up created records.",
  },
  {
    title: "Create a local LLM evaluation scorecard",
    description:
      "Compare model or prompt variants using the same cases, rubric, and resource measurements.",
    collection: "AI & LLM Engineering",
    tags: ["local-llm", "evaluation", "benchmark"],
    content:
      "Act as an LLM evaluation researcher comparing {{candidates}} for {{task}}.\n\nHardware, runtime/context settings, task examples, privacy constraints, and acceptable latency or memory:\n{{context}}\n\nDesign a reproducible evaluation set with representative, difficult, ambiguous, and adversarial cases. Define task-specific quality criteria and a rubric before running candidates. Track answer correctness, instruction adherence, groundedness, structured-output validity, refusal behavior, latency, memory/VRAM, throughput, and stability. Keep prompt and generation settings comparable and record exact model identifiers and quantization.\n\nSeparate subjective human ratings from deterministic checks, sample sufficiently, and report uncertainty and failure examples. Do not generalize from a single demo or compare scores produced by different evaluation methods. Finish with a scorecard template and a decision rule matched to the intended workload.",
  },
  {
    title: "Review a pull request for release readiness",
    description:
      "Assess whether a change has enough tests, rollback safety, and operational clarity to merge.",
    collection: "Testing & QA",
    tags: ["pull-request", "release", "code-review"],
    content:
      "Act as a staff engineer reviewing a pull request for {{change}}.\n\nDiff, issue or requirement, test output, migration/configuration changes, and deployment context:\n{{evidence}}\n\nCheck requirement coverage, backward compatibility, data migrations, security and authorization, error handling, observability, performance, accessibility, dependency changes, and rollback/roll-forward strategy. Prioritize blockers separately from follow-up suggestions. For each finding, cite a file/behavior, describe a realistic failure, and state how to verify the fix.\n\nDo not duplicate comments about style if automated tools enforce it. Do not assume CI passed unless its result is provided. Give a merge recommendation and list missing evidence needed to make it confidently. Include tests for the highest-risk regression and note whether release sequencing or feature flags matter.",
  },
  {
    title: "Evaluate an open-source dependency before adopting it",
    description:
      "Check maintenance, licensing, security, compatibility, and exit costs before adding a package.",
    collection: "Code Quality & Security",
    tags: ["open-source", "dependencies", "supply-chain"],
    content:
      "Act as a dependency-governance engineer evaluating {{package}} for {{use_case}}.\n\nOfficial repository, license, version, release history, advisories, API docs, package manifest, and project constraints:\n{{evidence}}\n\nAssess license compatibility, supported runtimes, release/maintenance activity, issue response, transitive dependencies, install scripts/native code, known advisories, bundle/runtime cost, API stability, accessibility, and migration or removal path. Distinguish observed evidence from assumptions, and prefer official repository and advisory sources.\n\nCompare adopting, implementing a small internal utility, or choosing an alternative. Explain the long-term maintenance burden and define a pinning/update policy. Never infer safety from popularity alone, and do not label a package vulnerable without a specific relevant advisory. Finish with a concise decision record and verification steps.",
  },
  {
    title: "Design privacy-first product analytics",
    description:
      "Measure key user outcomes while avoiding collection of sensitive prompt content or unnecessary identifiers.",
    collection: "Data & Analytics",
    tags: ["analytics", "privacy", "product"],
    content:
      "Act as a privacy-first analytics architect. Product outcome, user journey, stakeholders, and current instrumentation:\n{{context}}\n\nDefine the decisions analytics should support before selecting events. For each event specify trigger semantics, minimum properties, aggregation level, identity rules, retention, consent/opt-out behavior, and validation. Explicitly exclude raw prompts, messages, credentials, personal content, and other sensitive values unless a documented necessity and legal basis exist. Prefer local aggregation or opt-in diagnostics for a local-first product.\n\nCreate a metric tree with event formulas, failure modes, guardrails, and a data-quality plan. Identify risks of overcounting, missing events, survivorship bias, and small cohorts. Finish with a deletion/retention checklist and concrete examples of what must never be logged.",
  },
  {
    title: "Turn customer feedback into prioritized product actions",
    description:
      "Synthesize raw feedback into themes while preserving minority signals and traceable evidence.",
    collection: "Product & UX",
    tags: ["feedback", "prioritization", "research"],
    content:
      "Act as a product researcher analyzing feedback from {{sources}}.\n\nFeedback records, customer segments, product context, and current roadmap constraints:\n{{evidence}}\n\nCode feedback into themes using explicit inclusion rules. Distinguish frequency from severity, business value, affected segment, and confidence. Preserve representative quotes or IDs only when appropriate and protect personal information. Identify conflicting feedback, outliers, unmet needs, and possible sampling bias.\n\nProduce a table of themes with evidence, user impact, confidence, affected segment, likely root cause, recommended discovery or product action, and success metric. Avoid treating volume alone as priority or inventing sentiments not present in the input. Separate quick fixes from strategic questions and explain which follow-up research would reduce uncertainty.",
  },
  {
    title: "Create an incident response runbook",
    description:
      "Give responders clear triage, containment, communication, recovery, and evidence-preservation steps.",
    collection: "Debugging & Reliability",
    tags: ["incident-response", "runbook", "operations"],
    content:
      "Act as a production operations lead for {{system}}.\n\nArchitecture, critical dependencies, service objectives, alert signals, access model, and recent incidents:\n{{context}}\n\nWrite a runbook with symptom recognition, severity criteria, first checks, customer impact assessment, safe containment options, escalation roles, communication cadence, recovery steps, verification, and exit criteria. For every action note preconditions, expected result, and rollback or stop condition. Preserve evidence and avoid destructive diagnostics until data safety is understood.\n\nInclude common false positives, dependency failures, feature-flag or rollback steps, and what to do if the primary runbook path fails. Do not include credentials. Finish with a post-incident checklist for timeline, contributing factors, actionable follow-ups, and updating the runbook.",
  },
];

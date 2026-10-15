import type { SeedPrompt } from "./types";

export const SEED_PROMPTS_3: SeedPrompt[] = [
  {
    title: "Create a risk register for a project",
    description:
      "Track uncertainty in a form that assigns owners and makes mitigation measurable.",
    collection: "Business & Strategy",
    tags: ["risk", "project-management", "planning"],
    content: `Act as a project risk facilitator. Create a risk register for {{project}}.\n\nScope, timeline, stakeholders, dependencies, prior issues, and constraints:\n{{context}}\n\nList specific uncertain events rather than vague categories. For each risk capture cause, event, consequence, likelihood rationale, impact, proximity, owner, preventive mitigation, contingency, early-warning signal, and residual risk. Separate risks from active issues and assumptions. Include opportunities where relevant.\n\nUse a clearly explained scoring scale and avoid giving the impression that scores are objective probabilities when they are not. Rank the few risks that deserve immediate action and state what evidence or trigger should prompt reassessment.`,
  },
  {
    title: "Plan data import and export safely",
    description:
      "Protect users against malformed files, duplicate records, and accidental overwrite.",
    collection: "Software Development",
    tags: ["data-portability", "validation", "recovery"],
    content: `Act as an application engineer designing import/export for {{data_type}}.\n\nExisting schema, file examples, maximum sizes, and compatibility requirements:\n{{context}}\n\nDefine a versioned format, required and optional fields, schema validation, size limits, encoding, unknown-field policy, duplicate detection, ID collision behavior, and merge versus replace semantics. Require explicit confirmation for destructive replacement. Validate the full file before mutating data, use transactions where possible, and keep a recoverable backup until verification succeeds.\n\nInclude malformed, oversized, truncated, old-version, and maliciously crafted examples in tests. Specify a human-readable validation report and round-trip integrity checks. Do not silently skip invalid records or trust file paths supplied inside imported content.`,
  },
  {
    title: "Design backup and restore for local-first software",
    description:
      "Define consistent snapshots, retention, restore verification, and credential boundaries.",
    collection: "Software Development",
    tags: ["backup", "restore", "reliability"],
    content: `Act as a database reliability engineer. Design backup and restore for {{application}} using {{storage}}.\n\nData volume, consistency requirements, destinations, schedule, and threat model:\n{{constraints}}\n\nSpecify the snapshot mechanism, transaction/WAL handling, integrity checks, encryption and key management, backup naming/versioning, retention policy, and behavior after partial failure. Define how credentials and tokens are excluded or separately protected. For restore, validate the archive before replacement, preserve current data, verify the restored database, and provide rollback if validation fails.\n\nAddress app shutdown, suspended devices, network outages, storage quota, clock changes, and backup retention deletion. Include restore drills and measurable RPO/RTO targets; label targets as proposed until the product requirements confirm them.`,
  },
  {
    title: "Audit event tracking and analytics privacy",
    description:
      "Track meaningful product actions without collecting unnecessary sensitive content.",
    collection: "Data & Analytics",
    tags: ["analytics", "privacy", "instrumentation"],
    content: `Act as a privacy-conscious product analytics engineer. Design instrumentation for {{product_goal}}.\n\nUser journeys and decisions the team needs to improve:\n{{journeys}}\n\nDefine event names, trigger semantics, required properties, user/session identity rules, deduplication, consent and opt-out behavior, retention, access, and data quality checks. Prefer coarse event metadata over raw content, secrets, prompt text, message bodies, or other sensitive fields. Include events for errors and abandoned workflows only when they help answer a defined question.\n\nCreate a measurement plan mapping each event to a product decision and metric. Include a validation checklist and deletion strategy. Explicitly call out high-risk data collection and avoid analytics “because we can.”`,
  },
  {
    title: "Scope a freelance software project before quoting",
    description:
      "Turn an early client idea into a bounded scope, assumptions, deliverables, and questions before estimating price.",
    collection: "Freelancing & Client Work",
    tags: ["freelance", "scope", "estimation"],
    content:
      "Act as a senior software consultant preparing to scope {{project_idea}}.\n\nClient context, users, constraints, existing systems, and desired outcome:\n{{context}}\n\nCreate a scope brief with: the problem to solve, measurable outcome, user roles, in-scope capabilities, explicitly out-of-scope work, deliverables, acceptance criteria, dependencies, assumptions, risks, and open questions. Separate facts supplied by the client from assumptions that need confirmation. Identify hidden work such as data migration, deployment, analytics, accessibility, documentation, and post-launch support.\n\nDo not provide a falsely precise estimate before critical unknowns are resolved. Recommend a discovery step where needed, and finish with a concise list of questions to send the client plus the decisions required before a fixed-price quote is safe.",
  },
  {
    title: "Write a freelance proposal grounded in evidence",
    description:
      "Create a client-specific proposal that demonstrates understanding without inventing experience or making vague promises.",
    collection: "Freelancing & Client Work",
    tags: ["proposal", "freelance", "client"],
    content:
      "Act as an experienced independent developer responding to a real client opportunity.\n\nClient brief or job post:\n{{brief}}\nRelevant, verifiable experience and portfolio evidence:\n{{experience}}\nProject constraints, availability, and pricing boundaries:\n{{constraints}}\n\nWrite a concise proposal that mirrors the client's actual problem, explains a credible approach, identifies one or two important questions, and connects relevant experience to evidence provided above. State deliverables and a practical first step. Address risks or ambiguity directly instead of pretending everything is already understood.\n\nDo not invent client research, years of experience, results, testimonials, availability, or portfolio work. Avoid generic claims such as “I am the perfect fit.” Use clear, natural language and end with one specific next action. Provide a shorter version if the platform has a tight character limit.",
  },
  {
    title: "Qualify a freelance opportunity before applying",
    description:
      "Score fit, risk, effort, and expected value so you spend time on worthwhile opportunities.",
    collection: "Freelancing & Client Work",
    tags: ["freelance", "qualification", "prioritization"],
    content:
      "Act as a pragmatic freelance business advisor. Evaluate this opportunity:\n{{opportunity}}\nMy skills, portfolio, availability, rate floor, and goals:\n{{profile}}\n\nAssess technical fit, clarity of requirements, client credibility based only on supplied evidence, competition or response effort, schedule fit, budget fit, learning value, scope-creep risk, and likely communication overhead. Use a transparent weighted score and explain each rating. Mark missing information as unknown rather than automatically treating it as good or bad.\n\nRecommend Apply, Ask a clarifying question, Watch, or Skip. If applying is sensible, identify the strongest truthful angle and one useful question. Flag suspicious requests involving unpaid production work, sensitive credentials, off-platform payment risk, or unrealistic guarantees without asserting fraud absent evidence.",
  },
  {
    title: "Create a client discovery questionnaire",
    description:
      "Ask focused questions that expose goals, constraints, stakeholders, and acceptance criteria early.",
    collection: "Freelancing & Client Work",
    tags: ["discovery", "requirements", "client"],
    content:
      "Act as a product-minded technical consultant preparing discovery for {{project_type}}.\n\nInitial brief and anything already known:\n{{brief}}\n\nBuild a prioritized interview guide grouped into business outcomes, users and workflows, current pain points, must-have capabilities, integrations and data, security/privacy, constraints, ownership and decisions, launch expectations, and success measures. Prefer open questions that uncover examples and trade-offs rather than leading questions that encourage the client to agree.\n\nFor each question, explain briefly what decision it informs. Separate must-answer questions from topics that can wait. Include prompts for concrete examples, exceptions, current workarounds, and how success will be measured. Finish with a one-page discovery summary template and a list of red flags or unanswered questions that would make an estimate unreliable.",
  },
  {
    title: "Draft a client update that manages expectations",
    description:
      "Communicate progress, blockers, risks, and decisions without surprises or defensive language.",
    collection: "Freelancing & Client Work",
    tags: ["client-communication", "status", "delivery"],
    content:
      "Act as a calm, accountable delivery lead writing a project update for {{client_or_project}}.\n\nCompleted work and evidence:\n{{completed}}\nCurrent work and next milestone:\n{{next_steps}}\nBlockers, risks, dates, and decisions needed:\n{{risks}}\n\nWrite an update with a brief overall status, completed outcomes, work in progress, concrete next steps, risks or blockers with impact, and clear client decisions needed by a date. Distinguish a confirmed delay from a possible risk. When a commitment changed, explain the reason and propose a recovery option without blame.\n\nUse plain professional language, avoid jargon unless the client uses it, and do not hide bad news behind vague positivity. End with owners and dates for every action that requires follow-through.",
  },
  {
    title: "Define acceptance criteria for a software feature",
    description:
      "Translate a loosely stated requirement into observable, testable behavior and edge cases.",
    collection: "Freelancing & Client Work",
    tags: ["acceptance-criteria", "requirements", "testing"],
    content:
      "Act as a business analyst and QA lead specifying acceptance criteria for {{feature}}.\n\nUser story or request:\n{{request}}\nDomain rules, permissions, and existing behavior:\n{{context}}\n\nWrite the user problem and expected outcome, then create testable criteria using Given / When / Then where appropriate. Cover normal behavior, boundaries, empty states, invalid input, permissions, duplicate actions, network or service failures, accessibility, and data persistence where relevant. Identify non-functional expectations such as performance, privacy, and auditability only when supported by the context.\n\nSeparate required behavior from implementation suggestions. Flag contradictions and missing decisions rather than guessing. Finish with a compact QA checklist and examples of evidence that would prove each criterion passed.",
  },
  {
    title: "Plan a milestone-based delivery roadmap",
    description:
      "Break a project into reviewable milestones with dependencies, demos, and decision gates.",
    collection: "Freelancing & Client Work",
    tags: ["milestones", "planning", "delivery"],
    content:
      "Act as a delivery architect planning {{project}} with the team and client.\n\nScope, team capacity, deadline constraints, dependencies, and known risks:\n{{context}}\n\nCreate milestones that produce reviewable value, not just internal activity. For each milestone define outcome, deliverables, dependencies, owner role, acceptance criteria, demo/review point, estimated effort range, and exit decision. Sequence risky assumptions early and include discovery, test data, security review, deployment, documentation, and handover as relevant.\n\nUse ranges and confidence levels instead of false precision. Identify the critical path, what can run in parallel, and what scope could be reduced if the date becomes fixed. Finish with the first two weeks of concrete actions and the decisions that the client must make to keep delivery moving.",
  },
  {
    title: "Tailor a resume to a job description without fabrication",
    description:
      "Align real experience to a role using relevant language while preserving truth and avoiding keyword stuffing.",
    collection: "Career & Interview Prep",
    tags: ["resume", "job-search", "career"],
    content:
      "Act as a meticulous resume editor. Target role and job description:\n{{job_description}}\nMy current resume and verified work examples:\n{{resume_and_evidence}}\n\nIdentify the role's core responsibilities, must-have skills, and repeated terminology. Map each requirement to direct evidence, adjacent evidence, or a real gap. Recommend changes to the headline, summary, skill ordering, and experience bullets so the strongest relevant evidence is easy to find. Rewrite bullets with action, scope, technical choices, and measurable outcome only when the evidence supports them.\n\nNever invent employers, dates, tools, metrics, promotions, or responsibilities. Do not claim keyword optimization guarantees an ATS score. Preserve a clean, readable format and finish with a change log plus questions needed to strengthen any weak or unsupported bullet.",
  },
  {
    title: "Practice a behavioral interview using STAR",
    description:
      "Turn real work examples into concise stories with specific actions and honest outcomes.",
    collection: "Career & Interview Prep",
    tags: ["interview", "behavioral", "star"],
    content:
      "Act as an experienced interviewer for {{target_role}}. My real project examples, responsibilities, and outcomes are:\n{{experience}}\n\nAsk one behavioral interview question at a time about ownership, disagreement, failure, ambiguity, prioritization, collaboration, or learning. Wait for my answer before moving on. Evaluate it using Situation, Task, Action, Result, and Reflection. Check whether my personal contribution is clear, whether actions are specific, and whether the result is supported by evidence.\n\nGive direct feedback, identify vague or overly rehearsed parts, and suggest follow-up questions an interviewer might ask. Never invent metrics or turn a team outcome into an individual claim. Help me improve the story using only truthful details, then provide a concise 60–90 second version and one lesson learned.",
  },
  {
    title: "Prepare for a MERN stack technical interview",
    description:
      "Build a targeted practice session across JavaScript, React, Node, APIs, databases, and production trade-offs.",
    collection: "Career & Interview Prep",
    tags: ["mern", "interview", "javascript"],
    content:
      "Act as a senior engineer interviewing for a {{experience_level}} MERN stack role. Target job description and my current strengths or gaps:\n{{context}}\n\nRun an adaptive mock interview covering JavaScript fundamentals, React rendering and state, HTTP and API design, Node.js event loop and error handling, MongoDB data modeling and indexes, authentication/authorization, testing, deployment, debugging, and performance. Ask one question at a time. Start with fundamentals and increase difficulty based on my answer.\n\nScore correctness, depth, trade-off awareness, and clarity separately. If I am wrong, first explain the misconception, then give a small example and a follow-up question to verify learning. Include production scenarios, not trivia alone. At the end, summarize strengths, weak topics, and a focused practice plan. Do not call a partial answer correct just to be encouraging.",
  },
  {
    title: "Turn a learning goal into an active-recall plan",
    description:
      "Plan deliberate practice with retrieval, spaced repetition, projects, and measurable checkpoints.",
    collection: "Career & Interview Prep",
    tags: ["learning", "active-recall", "study-plan"],
    content:
      "Act as a learning scientist and practical mentor. Goal, deadline, current level, and available weekly time:\n{{goal_and_constraints}}\nResources already available and preferred learning format:\n{{resources}}\n\nCreate a plan based on active recall, spaced review, interleaving, worked examples, and progressively harder practice. Define weekly outcomes, short study sessions, retrieval questions, implementation tasks, review intervals, and a small capstone that demonstrates capability. Distinguish consuming content from demonstrating skill.\n\nInclude checkpoints with observable pass criteria and a way to adjust when progress is slower than expected. Avoid unrealistic daily workloads and long resource lists without a purpose. Finish with the first session's exact task, a review schedule, and a lightweight log template for mistakes and lessons.",
  },
  {
    title: "Verify a factual claim using primary sources",
    description:
      "Check what a claim actually says, whether evidence supports it, and where uncertainty remains.",
    collection: "Research & Critical Thinking",
    tags: ["fact-check", "sources", "research"],
    content:
      "Act as a careful fact-checker. Claim to evaluate:\n{{claim}}\nContext, date range, jurisdiction, or definitions that may matter:\n{{context}}\nSources or evidence already collected:\n{{sources}}\n\nBreak the claim into independently checkable subclaims. Prioritize primary sources such as original datasets, legislation, official documentation, peer-reviewed studies, and first-hand statements. For every important source record publisher, date, what it directly establishes, limitations, and whether it is independent of other sources. Check base rates, denominators, causal language, cherry-picking, and whether evidence matches the claim's time period.\n\nUse Supported, Partially supported, Unsupported, or Unclear with a short rationale. Never fabricate citations or claim to have opened a source that was not provided or actually checked. Separate facts from interpretation and state what evidence would change the conclusion.",
  },
  {
    title: "Compare technical approaches with explicit trade-offs",
    description:
      "Choose an implementation using criteria, constraints, evidence, and a reversible decision where possible.",
    collection: "Research & Critical Thinking",
    tags: ["trade-offs", "architecture", "decision"],
    content:
      "Act as a neutral staff engineer comparing options for {{decision}}.\n\nOptions and architecture context:\n{{options_and_context}}\nHard constraints, traffic/data expectations, team skills, and operational needs:\n{{constraints}}\n\nDefine decision criteria before scoring. Compare correctness, security, latency, scalability, maintenance, ecosystem maturity, operational burden, migration cost, lock-in, and reversibility as applicable. Identify disqualifying constraints separately from weighted preferences. Use evidence for factual claims and clearly label assumptions.\n\nProvide a comparison table with trade-offs, the conditions under which each option wins, and unknowns that need a spike or benchmark. Recommend one option only if the evidence supports it; otherwise specify a small experiment. Finish with a concise decision record, trigger conditions that would justify revisiting it, and the lowest-risk next step.",
  },
  {
    title: "Specify a production-ready React component",
    description:
      "Turn a UI need into accessible behavior, state boundaries, component API, and testable states.",
    collection: "Software Development",
    tags: ["react", "components", "accessibility"],
    content:
      "Act as a senior React and TypeScript engineer designing {{component}} for {{product_context}}.\n\nExisting design system, dependencies, product requirements, and relevant code:\n{{context}}\n\nDefine the component's public props, controlled/uncontrolled behavior, state ownership, loading/empty/error/disabled states, event semantics, keyboard interactions, focus management, labels, and responsive behavior. Consider React rendering, memoization only where measured or justified, stable keys, effect cleanup, and server/client boundaries if relevant to the framework.\n\nImplement the smallest composable solution consistent with the existing stack. Include unit/component tests for primary behavior and meaningful edge cases, accessible queries, and a short usage example. Do not add a dependency or abstraction without a clear need, and do not change existing package versions unless compatibility evidence requires it.",
  },
  {
    title: "Diagnose unnecessary React re-renders",
    description:
      "Use profiling evidence to locate avoidable work without applying memoization indiscriminately.",
    collection: "Software Development",
    tags: ["react", "performance", "profiling"],
    content:
      "Act as a React performance engineer. Report, profiler flame graph, component tree, and relevant state/props:\n{{evidence}}\nFramework versions and reproduction steps:\n{{environment}}\n\nTrace what triggers each expensive render: parent render, changed object/function identity, context updates, state placement, subscriptions, or expensive derived work. Separate expected renders from avoidable ones and identify whether rendering is actually the bottleneck.\n\nPrioritize state colocation, derived-value simplification, list virtualization for genuinely large lists, stable keys, or memoization only when supported by evidence. Propose one change at a time and define a repeatable before/after measurement with the same workload. Include tests to protect behavior. Do not promise performance gains based on code appearance alone.",
  },
  {
    title: "Plan a Next.js App Router feature safely",
    description:
      "Clarify server/client boundaries, caching, metadata, data access, and error states before implementation.",
    collection: "Software Development",
    tags: ["nextjs", "app-router", "architecture"],
    content:
      "Act as a senior Next.js engineer implementing {{feature}} with {{nextjs_version}}.\n\nCurrent route structure, data source, authentication model, requirements, and constraints:\n{{context}}\n\nMap the route, layouts, Server and Client Components, data-fetching boundary, loading/error/not-found states, cache and revalidation needs, metadata, forms/actions or API boundaries, and authorization checks. Explain which code must run on the server and why. Protect secrets and server-only modules from client bundles.\n\nProvide a stepwise implementation plan aligned with the supplied version's official docs. Include tests for permissions, stale or missing data, invalid input, and navigation behavior. Identify deployment assumptions and avoid undocumented cache behavior. Do not force all components to be client-side or introduce extra state libraries unless required.",
  },
];

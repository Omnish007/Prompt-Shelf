import type { SeedPrompt } from "./types";

export const SEED_PROMPTS_2: SeedPrompt[] = [
  {
    title: "Write a constructive difficult-conversation script",
    description:
      "Address a problem directly with specific observations, impact, listening, and boundaries.",
    collection: "Writing & Communication",
    tags: ["feedback", "conflict", "communication"],
    content: `Act as a workplace communication coach. Help me prepare a conversation about {{issue}} with {{person_or_role}}.\n\nObserved facts, impact, and desired outcome:\n{{facts_and_goal}}\nRelationship and relevant constraints:\n{{context}}\n\nDraft a calm opening based on observable behavior rather than character judgments. Explain the impact, state the request or boundary clearly, invite the other perspective, and offer responses to plausible reactions without scripting manipulation. Include phrases for acknowledging valid points, correcting factual misunderstandings, pausing escalation, and agreeing on a follow-up.\n\nSeparate what I know from what I am assuming. Do not diagnose motives. Keep the goal constructive while preserving the ability to say no or document unresolved concerns.`,
  },
  {
    title: "Create a test strategy for a feature",
    description:
      "Choose meaningful test layers and cases based on risk, not raw test count.",
    collection: "Testing & QA",
    tags: ["testing", "qa", "strategy"],
    content: `Act as a QA architect. Create a test strategy for {{feature}} in {{stack}}.\n\nRequirements, architecture, and known failure history:\n{{context}}\n\nIdentify critical user journeys, business invariants, data boundaries, authorization rules, integration dependencies, and failure modes. Select unit, component, integration, end-to-end, accessibility, performance, and security tests only where they provide distinct value. Include happy paths, boundary values, invalid input, concurrency, retries, offline/timeouts, migration, and destructive actions.\n\nFor each priority test define setup, action, expected result, and why the risk matters. Recommend deterministic fixtures and test isolation. Finish with a release gate and explicit gaps that cannot be tested in the current environment. Do not equate high coverage percentage with adequate confidence.`,
  },
  {
    title: "Generate boundary and property-based tests",
    description:
      "Find classes of edge cases that example-based tests often miss.",
    collection: "Testing & QA",
    tags: ["edge-cases", "property-testing", "quality"],
    content: `Act as a test engineer who thinks adversarially. Analyze this function or behavior:\n\n{{code_or_contract}}\n\nLanguage, test framework, and constraints:\n{{test_stack}}\n\nList core invariants, input partitions, boundaries, invalid states, ordering issues, null/empty handling, Unicode or encoding risks, time-zone concerns, and resource limits where relevant. Propose example-based tests first, then property-based tests or fuzzing properties if they add value. Include minimal counterexamples for plausible defects.\n\nWrite executable tests using the specified framework, following its actual API. Explain any assumptions and ensure tests do not merely duplicate the implementation logic. Include a reproducible seed when randomness is involved.`,
  },
  {
    title: "Diagnose a flaky automated test",
    description:
      "Isolate nondeterminism before adding retries or weakening assertions.",
    collection: "Testing & QA",
    tags: ["flaky-tests", "ci", "debugging"],
    content: `Act as a test-infrastructure engineer. Diagnose this flaky test.\n\nTest code, failure logs, and pass/fail frequency:\n{{evidence}}\nCI/runtime/environment details:\n{{environment}}\n\nInvestigate timing assumptions, shared state, test order dependencies, random data, network/service instability, timezone, cleanup, retries, worker parallelism, and resource pressure. Rank hypotheses by evidence and suggest the cheapest experiment that distinguishes them.\n\nRecommend a fix that restores determinism and preserves the test’s intent. Provide a regression strategy and relevant instrumentation. Do not default to longer sleeps, retries, or weaker assertions unless the underlying timing contract genuinely requires them and the trade-off is explained.`,
  },
  {
    title: "Create a safe database migration plan",
    description:
      "Evolve a schema with validation, backfill, rollback, and compatibility controls.",
    collection: "Testing & QA",
    tags: ["database", "migration", "reliability"],
    content: `Act as a database reliability engineer. Plan a migration from {{current_schema}} to {{target_schema}} using {{database}}.\n\nData volume, traffic, availability needs, and application versions:\n{{constraints}}\n\nEvaluate a staged expand-migrate-contract approach where applicable. Specify DDL, backfill strategy, batching, locking/availability risks, indexes, constraints, dual-read/write needs, validation queries, monitoring, and rollback or roll-forward policy. Address deploy ordering across old and new application versions and how to recover from partial completion.\n\nProvide a rehearsal plan on a representative copy and post-migration integrity checks. State which operations are destructive or irreversible. Do not assume a transaction can wrap every migration operation; verify the database’s actual semantics.`,
  },
  {
    title: "Turn a bug report into a reproducible test",
    description:
      "Move from vague symptoms to a minimal reproduction and regression coverage.",
    collection: "Testing & QA",
    tags: ["bug-report", "reproduction", "regression"],
    content: `Act as a senior QA engineer. Convert this report into a reliable reproduction plan.\n\nBug report and observed symptoms:\n{{report}}\nEnvironment, expected behavior, and actual behavior:\n{{details}}\n\nIdentify the minimum missing facts. Write numbered reproduction steps with clean initial state, exact input, expected result, actual result, and evidence to capture. List plausible variables to isolate one at a time. Reduce the scenario to the smallest reproducible case and identify likely regression test layers.\n\nProvide a bug ticket title, severity rationale, impact, workaround if known, and acceptance criteria for the fix. Do not invent reproduction steps unsupported by the report; clearly mark assumptions and what must be confirmed.`,
  },
  {
    title: "Analyze a dataset without overstating conclusions",
    description:
      "Validate the data, define metrics, quantify uncertainty, and communicate limitations.",
    collection: "Data & Analytics",
    tags: ["analysis", "statistics", "data-quality"],
    content: `Act as a skeptical data analyst. Analyze {{business_question}} using this dataset description and available output:\n\n{{data_or_summary}}\n\nFirst inspect grain, definitions, coverage, missingness, duplicates, outliers, and data collection changes. Define each metric and denominator. Choose methods appropriate to the data type and sampling process. Distinguish descriptive patterns from causal claims and report uncertainty where possible. Check segmentation, survivorship bias, seasonality, and multiple comparisons if relevant.\n\nDeliver the main findings, supporting calculations, caveats, and recommended next analysis. State what cannot be inferred from this dataset. Do not fabricate rows or statistics; ask for the actual data or provide reproducible code when calculations cannot be performed from the supplied summary.`,
  },
  {
    title: "Design an actionable product dashboard",
    description:
      "Turn business questions into a compact dashboard with trustworthy metric definitions.",
    collection: "Data & Analytics",
    tags: ["dashboard", "metrics", "analytics"],
    content: `Act as an analytics product designer. Design a dashboard for {{audience}} to monitor {{business_goal}}.\n\nAvailable data sources and current metric definitions:\n{{data_sources}}\n\nFor each proposed KPI define the business question, exact numerator and denominator, aggregation window, dimensions, freshness, owner, source of truth, and known caveats. Separate leading indicators from lagging outcomes and include only metrics that can drive a decision. Specify visual form, filters, comparisons, alerts, empty states, and handling of stale or missing data.\n\nProvide a wireframe-level layout and acceptance criteria. Flag metrics that cannot currently be computed reliably and the instrumentation needed first. Avoid vanity metrics and misleading dual axes or truncated scales.`,
  },
  {
    title: "Investigate a metric drop",
    description:
      "Use a disciplined diagnostic tree to find whether a KPI change is real and why.",
    collection: "Data & Analytics",
    tags: ["metrics", "incident-analysis", "analytics"],
    content: `Act as a product analytics investigator. A key metric {{metric}} changed by {{observed_change}} during {{time_window}}.\n\nInstrumentation, segmentation, releases, and context:\n{{evidence}}\n\nFirst verify the measurement: event volume, schema changes, pipeline freshness, attribution, filters, denominator, and data quality. Then segment by cohort, platform, geography, acquisition channel, version, and user journey where appropriate. Compare seasonality and a valid baseline. Build a ranked hypothesis tree with evidence that supports or weakens each explanation.\n\nRecommend the next diagnostic queries, owner, and time window. Separate correlation from causation and avoid declaring a cause until the evidence supports it. Finish with immediate containment steps if user harm or data loss is plausible.`,
  },
  {
    title: "Write a SQL query safely and clearly",
    description:
      "Produce readable SQL with explicit grain, joins, date boundaries, and validation checks.",
    collection: "Data & Analytics",
    tags: ["sql", "database", "analytics"],
    content: `Act as a senior SQL analyst. Write a query for {{question}}.\n\nDatabase dialect and table schemas:\n{{schema}}\nDefinitions, filters, and expected grain:\n{{requirements}}\n\nExplain the intended row grain, join keys, filtering order, treatment of NULLs, duplicate risk, date/timezone boundaries, and aggregation semantics. Use explicit columns, clear aliases, and parameterized values where inputs are dynamic. Avoid SELECT * in production reporting queries.\n\nProvide the query, assumptions, and two or more validation checks (such as row counts, uniqueness, reconciliation to known totals, or edge-date examples). If the schema does not support a correct answer, state which field or relationship is missing rather than guessing table structure.`,
  },
  {
    title: "Create a personal learning roadmap",
    description:
      "Build a practice-led path with prerequisites, deliverables, feedback, and spaced review.",
    collection: "Learning & Career",
    tags: ["learning", "roadmap", "practice"],
    content: `Act as a learning scientist and practical mentor. Create a roadmap for learning {{subject}} from {{current_level}} to {{target_level}} in {{time_budget}}.\n\nGoal, constraints, preferred resources, and prior experience:\n{{context}}\n\nOrganize the path by prerequisite concepts and observable competencies, not just course titles. For each phase specify what to understand, a small exercise, a realistic project or deliverable, common misconceptions, a self-test, and criteria for moving on. Incorporate retrieval practice, spaced repetition, deliberate practice, interleaving, and feedback.\n\nRecommend trustworthy resources by type and explain what each is good for; do not invent links or claim to have reviewed unavailable material. Include a weekly schedule with buffer time and a method for measuring progress. Optimize for doing and feedback, not content consumption.`,
  },
  {
    title: "Practice a technical interview",
    description:
      "Simulate a realistic interview, evaluate answers, and target the biggest gaps.",
    collection: "Learning & Career",
    tags: ["interview", "career", "practice"],
    content: `Act as a fair but demanding interviewer for a {{role}} position at {{level}}. Relevant stack and job description:\n{{job_context}}\n\nRun a realistic interview one question at a time. Start by asking a question and wait for my answer before revealing the solution. Evaluate correctness, reasoning, trade-offs, edge cases, communication, and production awareness. Ask follow-up questions based on what I say. Do not rescue me too quickly or reward confident but incorrect answers.\n\nAfter each response, give concise feedback, identify the most important gap, and offer one hint if needed. At the end, provide a rubric-based score, strengths, gaps ranked by impact, and a targeted practice plan. Adapt question difficulty to my performance rather than following a fixed script.`,
  },
  {
    title: "Turn experience into strong resume bullets",
    description:
      "Translate real work into specific, credible, impact-oriented achievements.",
    collection: "Learning & Career",
    tags: ["resume", "career", "editing"],
    content: `Act as a resume editor and technical hiring manager for {{target_role}}.\n\nRaw experience, project context, and verified outcomes:\n{{experience}}\nTarget job description:\n{{job_description}}\n\nRewrite the experience into concise achievement bullets using action, scope, technical method, and verified result where available. Align truthful language to relevant job requirements without keyword stuffing. Distinguish personal contribution from team output, and preserve technologies and dates accurately.\n\nDo not invent metrics, users, revenue, scale, ownership, or performance improvements. Where a measurable result would help but is missing, ask a targeted question or mark [METRIC TO VERIFY]. Identify weak, repetitive, or unsupported claims and suggest which evidence the candidate should gather.`,
  },
  {
    title: "Negotiate an offer professionally",
    description:
      "Prepare a principled negotiation based on value, alternatives, and total compensation.",
    collection: "Learning & Career",
    tags: ["negotiation", "career", "communication"],
    content: `Act as a career negotiation coach. Help me negotiate {{offer_or_term}}.\n\nCurrent offer, priorities, constraints, and alternatives:\n{{details}}\nMarket evidence and role expectations, if available:\n{{evidence}}\n\nClarify my target, acceptable range, walk-away conditions, and highest-priority non-salary terms. Build a respectful rationale anchored in role scope, relevant evidence, and value—not personal need alone. Provide a concise conversation script and email option, plus responses to common objections.\n\nDistinguish verified market data from anecdotes and uncertainty. Avoid bluffing about competing offers or making threats. Include a decision framework for evaluating base pay, bonus, equity, benefits, learning, manager quality, stability, commute, and work-life trade-offs.`,
  },
  {
    title: "Build a weekly review that leads to action",
    description:
      "Review commitments, learn from outcomes, and choose a realistic next-week focus.",
    collection: "Personal Productivity",
    tags: ["planning", "reflection", "weekly-review"],
    content: `Act as a practical productivity coach. Help me run a weekly review using these notes:\n\nCompleted, unfinished, commitments, energy, and surprises:\n{{notes}}\nCurrent goals and constraints for next week:\n{{goals_and_constraints}}\n\nGuide the review through: capture open loops, reconcile calendar and task lists, assess progress against goals, identify why plans slipped, close or renegotiate stale commitments, and choose the few outcomes that matter most next week. Separate urgent maintenance from meaningful progress.\n\nProduce a realistic weekly plan with priority, first next action, time estimate, dependency, and “not doing” list. Include recovery time and buffers. Do not moralize missed goals; use them as evidence to improve the system.`,
  },
  {
    title: "Make a difficult decision using weighted criteria",
    description:
      "Compare options transparently and test whether assumptions dominate the result.",
    collection: "Personal Productivity",
    tags: ["decision-matrix", "planning", "critical-thinking"],
    content: `Act as a decision scientist. Help me compare {{options}} for the decision {{decision}}.\n\nMy goals, constraints, non-negotiables, and available evidence:\n{{context}}\n\nDefine decision criteria, identify deal-breakers, and assign weights that sum to 100 only after explaining the rationale. Score options with explicit evidence and confidence. Keep “must meet” thresholds separate from weighted preferences. Run sensitivity analysis to show whether a modest change in weights or uncertain scores changes the winner.\n\nInclude opportunity cost, reversibility, downside risk, time horizon, and information value. Give a recommendation with assumptions, a low-cost experiment where possible, and a date or condition for revisiting. Do not let a numerical score disguise subjective judgments.`,
  },
  {
    title: "Break an overwhelming goal into next actions",
    description:
      "Convert a vague goal into milestones small enough to start and verify.",
    collection: "Personal Productivity",
    tags: ["goals", "execution", "planning"],
    content: `Act as an execution coach. Help me achieve {{goal}} by {{deadline}}.\n\nStarting point, resources, obstacles, and time available each week:\n{{context}}\n\nDefine a concrete outcome and evidence of completion. Break it into milestones and the smallest next actions that can be started in under 30 minutes. Identify dependencies, likely obstacles, implementation intentions (“if X happens, I will do Y”), feedback checkpoints, and a minimum viable version if time becomes tight.\n\nCreate a realistic schedule with buffers and a weekly review. Distinguish controllable actions from outcomes affected by luck or other people. Avoid motivational clichés and overpacked plans; prioritize consistency and a feedback loop.`,
  },
  {
    title: "Create a standard operating procedure",
    description:
      "Document a repeatable process with owners, decision points, exceptions, and quality checks.",
    collection: "Business & Strategy",
    tags: ["sop", "operations", "process"],
    content: `Act as an operations architect. Create an SOP for {{process}} for {{team_or_role}}.\n\nCurrent workflow, tools, rules, and known failure cases:\n{{context}}\n\nInclude purpose, scope, owner, prerequisites, inputs/outputs, step-by-step procedure, decision branches, quality checks, exception handling, escalation path, data/security considerations, and version/review cadence. Specify what “done” means at each critical step and where evidence should be recorded.\n\nDesign for a competent new team member following it under normal working conditions. Highlight steps that need human judgment rather than pretending every case can be automated. Mark missing policies as [OWNER DECISION REQUIRED] instead of inventing rules.`,
  },
  {
    title: "Conduct a blameless incident postmortem",
    description:
      "Explain what happened and improve defenses without reducing the incident to individual blame.",
    collection: "Business & Strategy",
    tags: ["incident", "sre", "postmortem"],
    content: `Act as an SRE facilitator. Write a blameless postmortem for {{incident}}.\n\nTimeline, impact, signals, contributing factors, and response notes:\n{{evidence}}\n\nStructure the report around summary, customer impact, detection, timestamped timeline with timezone, response, contributing conditions, what went well, what made recovery harder, and where safeguards failed or were absent. Separate trigger from systemic contributors. Avoid hindsight bias and assigning motives.\n\nCreate corrective actions with owner, due date, expected risk reduction, verification method, and priority. Include prevention, detection, containment, and recovery. Do not present an action as complete without evidence, and explicitly note important unknowns still under investigation.`,
  },
  {
    title: "Estimate project effort with uncertainty",
    description:
      "Produce ranges, assumptions, dependencies, and confidence instead of a false exact date.",
    collection: "Business & Strategy",
    tags: ["estimation", "delivery", "planning"],
    content: `Act as a delivery lead estimating {{project}}.\n\nScope, acceptance criteria, team composition, historical throughput, and constraints:\n{{context}}\n\nBreak work into discovery, implementation, integration, testing, rollout, and operational follow-up. Give optimistic, likely, and pessimistic ranges based on explicit assumptions. Include dependencies, external approvals, unknowns, rework, parallelism limits, and calendar time versus person-days. Distinguish commitments from forecasts.\n\nIdentify the largest sources of uncertainty and propose the fastest discovery spikes to reduce them. Provide milestone confidence and a re-estimation trigger. Do not multiply an arbitrary buffer into a supposedly precise forecast; explain how uncertainty was represented.`,
  },
  {
    title: "Review privacy and data-retention practices",
    description:
      "Map personal data, purpose, access, retention, and deletion behavior.",
    collection: "Code Quality & Security",
    tags: ["privacy", "retention", "compliance"],
    content: `Act as a privacy engineering reviewer, not a substitute for legal counsel. Assess {{system_or_feature}}.\n\nData categories, collection paths, storage locations, processors, users, and jurisdictions:\n{{data_map}}\n\nFor each data element document purpose, necessity, consent or other applicable basis to verify, access controls, retention period, export, deletion, backups, logs, third parties, and breach exposure. Find data collected “just in case,” overbroad access, hidden copies, and deletion gaps. Consider derived data and identifiers as well as obvious personal fields.\n\nProduce prioritized engineering changes, questions for privacy/legal review, and tests proving retention and deletion behavior. Do not declare legal compliance without jurisdiction-specific review and verified facts.`,
  },
  {
    title: "Design an accessible interaction",
    description:
      "Specify keyboard, focus, semantics, validation, and assistive-technology behavior.",
    collection: "Product & UX",
    tags: ["accessibility", "a11y", "ux"],
    content: `Act as an accessibility specialist. Review or design the {{interaction}} in {{technology}}.\n\nCurrent behavior, component code, and visual states:\n{{evidence}}\n\nDefine semantic structure, accessible name and description, keyboard interaction, focus order and restoration, announcement of dynamic changes, error association, zoom/reflow, contrast, reduced motion, and screen-reader behavior. Use native platform semantics before custom ARIA. Cover empty, loading, validation, disabled, and failure states.\n\nProvide specific code-level changes and a manual test script for keyboard-only use plus at least one screen reader where available. Distinguish automated checks from human usability testing. Do not treat passing an automated checker as proof of accessibility.`,
  },
  {
    title: "Plan a production deployment and rollback",
    description:
      "Deploy safely with health checks, migration ordering, observability, and a practiced rollback.",
    collection: "Software Development",
    tags: ["deployment", "release", "reliability"],
    content: `Act as a production engineer planning release of {{change}}.\n\nArchitecture, environment, dependencies, migration needs, and current release process:\n{{context}}\n\nProvide preflight checks, build artifact verification, configuration/secrets checks, migration ordering, rollout strategy, health metrics, alert thresholds, smoke tests, user impact monitoring, and rollback or roll-forward criteria. Include compatibility with old and new versions during gradual rollout.\n\nIdentify irreversible steps, backup requirements, ownership, and communication plan. Define objective abort criteria rather than “watch it and see.” Finish with a runbook checklist that an on-call engineer can execute under pressure.`,
  },
  {
    title: "Improve search and information retrieval",
    description:
      "Match search behavior to user intent with useful ranking, filters, and empty states.",
    collection: "Product & UX",
    tags: ["search", "information-architecture", "ux"],
    content: `Act as a search relevance engineer and UX designer. Improve search across {{content_type}} for {{user_needs}}.\n\nCurrent search implementation and representative queries/results:\n{{evidence}}\n\nDefine indexed fields, tokenization, case/diacritic handling, phrase matching, ranking signals, filters, sorting, typo tolerance needs, and expected dataset size. Build a relevance test set with realistic successful and unsuccessful queries. Consider privacy, incremental updates, index rebuilds, and offline behavior.\n\nRecommend the least complex approach that meets measured needs. Specify useful empty states, result highlighting, keyboard navigation, and how users can recover from no results. Include a benchmark and regression plan; do not claim improved relevance without evaluating representative queries.`,
  },
  {
    title: "Turn a repeated task into safe automation",
    description:
      "Define triggers, idempotency, error handling, monitoring, and human approval boundaries.",
    collection: "Personal Productivity",
    tags: ["automation", "workflow", "reliability"],
    content: `Act as an automation architect. Design an automation for {{repeated_task}}.\n\nCurrent steps, systems, permissions, volume, and failure history:\n{{context}}\n\nMap the trigger, input validation, transformations, side effects, approval points, retries, deduplication/idempotency, rate limits, secrets, timeouts, partial failures, and recovery. Identify actions that require explicit human confirmation, especially irreversible operations. Include observability, audit trail, alert conditions, and safe shutdown.\n\nPropose a small pilot and acceptance tests before full rollout. Compare the cost of automation with the cost of maintaining it and handling exceptions. Never assume an external system guarantees exactly-once execution unless its documentation supports that claim.`,
  },
  {
    title: "Create reusable prompt templates with variables",
    description:
      "Design an adaptable prompt with named inputs, constraints, and quality checks.",
    collection: "Research & Critical Thinking",
    tags: ["prompt-engineering", "templates", "ai"],
    content: `Act as a prompt engineer designing a reusable template for {{task}}.\n\nTarget model or tool, users, inputs, and desired output:\n{{context}}\n\nWrite a ready-to-use prompt with clearly defined role, objective, context inputs, required steps, constraints, output schema, uncertainty behavior, and self-checks. Use {{variable_name}} placeholders only for information that changes between runs, and define each variable’s label, purpose, example, and whether it is required. Include a sensible default where safe.\n\nTest the template against a normal case, missing information, ambiguous input, and an adversarial edge case. Avoid asking the model to reveal hidden reasoning; request concise conclusions, evidence, assumptions, and verification steps instead. Finish with a short usage note and known limitations.`,
  },
  {
    title: "Evaluate an LLM feature before launch",
    description:
      "Build a practical evaluation set for quality, failure modes, cost, and latency.",
    collection: "Testing & QA",
    tags: ["llm", "evaluation", "ai"],
    content: `Act as an applied AI evaluation engineer. Evaluate an LLM feature that {{feature_behavior}}.\n\nModel/provider, prompt, user inputs, expected outcomes, and constraints:\n{{context}}\n\nDefine task-specific quality dimensions, a representative dataset, edge cases, refusal/safety criteria, grounding requirements, and a rubric that two reviewers can apply consistently. Include regression examples, prompt-injection attempts, empty or contradictory context, multilingual cases if relevant, and outputs that are syntactically valid but semantically wrong. Measure latency, token/cost use, and failure rate alongside quality.\n\nRecommend human review and automated checks, compare versions on the same held-out set, and state release thresholds. Explain evaluation limitations and monitor post-launch drift. Do not invent model performance numbers or treat one aggregate score as sufficient.`,
  },
  {
    title: "Design a practical API integration",
    description:
      "Integrate an external service with timeouts, retries, rate limits, and safe secret handling.",
    collection: "Software Development",
    tags: ["integration", "api", "resilience"],
    content: `Act as a backend integration specialist. Plan an integration with {{external_service}} for {{use_case}}.\n\nOfficial API documentation, authentication model, limits, and existing code:\n{{evidence}}\n\nSpecify credentials and secret storage, least-privilege scopes, request/response validation, timeout budgets, bounded retries with jitter, rate-limit handling, idempotency, pagination, schema evolution, and error mapping. Define which failures are retryable, how to avoid retry storms, and how to redact sensitive fields from logs.\n\nProvide an implementation outline and tests using the documented API semantics. Include a mock strategy, contract verification, and operational metrics. Do not invent endpoint fields or rely on undocumented behavior; identify anything that needs confirmation in the current official docs.`,
  },
  {
    title: "Write release notes users can act on",
    description:
      "Translate implementation changes into clear value, behavior changes, and known limitations.",
    collection: "Writing & Communication",
    tags: ["release-notes", "product", "communication"],
    content: `Act as a technical writer preparing release notes for {{release_version}}.\n\nMerged changes, issue links, behavior changes, and known limitations:\n{{changes}}\nAudience and tone:\n{{audience}}\n\nGroup changes into Added, Improved, Fixed, and Known Issues only when the categories fit. Explain user-visible impact rather than listing internal commits. Mention breaking changes, migration steps, security-relevant updates, and workarounds clearly. Keep internal implementation detail only when it helps the audience.\n\nDo not claim a defect is fixed unless the evidence says so, and do not expose vulnerabilities before coordinated disclosure. Include a short summary suitable for a notification and a fuller version suitable for documentation.`,
  },
  {
    title: "Build a customer feedback synthesis",
    description:
      "Identify patterns without letting the loudest anecdote dominate the conclusion.",
    collection: "Product & UX",
    tags: ["customer-feedback", "research", "synthesis"],
    content: `Act as a qualitative research analyst. Synthesize the feedback below about {{product_or_feature}}.\n\nFeedback records with dates and user context where available:\n{{feedback}}\n\nCreate a transparent coding scheme and group recurring needs, pain points, workarounds, desired outcomes, and contradictory views. Keep frequency distinct from severity and business impact. Note sampling bias, duplicate feedback, missing context, and whether comments can be linked to a particular user segment. Use brief anonymized evidence excerpts only when appropriate.\n\nRank opportunities by user impact, evidence strength, frequency, and strategic fit. Include counterexamples and follow-up research questions. Do not infer population-wide prevalence from an unrepresentative sample or turn a feature request directly into a solution requirement.`,
  },
];

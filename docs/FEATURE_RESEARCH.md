# PromptShelf — Free Feature Research (October 2026)

## Research question

Which prompt-management improvements meaningfully help a single user with a local-first desktop/browser app, while remaining free to run, easy to maintain, and safe for private prompts?

## Findings and implementation decisions

| Feature opportunity                                   | User value                                                                                                                                            | Ongoing cost / privacy                                                                                                                                                | Decision                                                                                                                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typo-tolerant weighted search                         | Finds a saved prompt even when its title is not remembered exactly, or a word is mistyped. Searches title, description, tags, collection and content. | Fuse.js runs locally; no account, API key, usage fee, or network call.                                                                                                | **Implemented** using a memoized index and title-heavy weights. Every query term must match somewhere, reducing loose false positives.                |
| Explainable prompt-structure checks                   | Helps improve vague prompts by calling out missing goals, context, output format, constraints, evidence handling, verification, or specificity.       | Small local heuristics; private prompt text never leaves the app.                                                                                                     | **Implemented** as a transparent Prompt Coach and a dashboard Library Health view. It is guidance, not a measure of model intelligence.               |
| Similar-title warning                                 | Prevents users from unintentionally creating multiple prompts for the same task.                                                                      | Runs locally; no automatic edits or merges.                                                                                                                           | **Implemented** as a review-only warning in the editor.                                                                                               |
| Larger starter collection                             | Useful on first launch without requiring prompt hunting or an AI subscription.                                                                        | Bundled static content, no runtime cost.                                                                                                                              | **Implemented**: 40 additions, 104 total prompts across 15 collections, with additive seed version 3 upgrades.                                        |
| Prompt histories and reusable variables               | Enables safe iteration and repeated use.                                                                                                              | Already supported in the existing application.                                                                                                                        | **Preserved** rather than replacing working workflows.                                                                                                |
| AI rewriting, multi-model prompt execution, team sync | Can be valuable for advanced workflows.                                                                                                               | Providers may charge per token/request; model keys and prompt content introduce privacy/security considerations. Collaboration needs accounts, a backend and hosting. | **Not added** as an alleged “free” feature. A local optional provider integration can be considered separately with explicit setup and cost labeling. |
| Automatic cloud backup                                | Supports recovery and cross-device continuity.                                                                                                        | Uses a user-authorized Google Drive account; requires OAuth configuration.                                                                                            | Existing optional Drive backup retained. No hidden always-on service was added.                                                                       |

## Technical evidence and design rationale

### Fuse.js

Fuse.js documents a Bitap-based fuzzy search algorithm, configurable threshold, weighted keys, and `ignoreLocation` for matches beyond the beginning of long fields. Its official performance guide reports that index cost scales with list size, number of keys, and indexed text length; the index is therefore built once per visible collection with React memoization, not on every keypress. Because PromptShelf has a local data model and does not need server ranking, client-side fuzzy search preserves privacy and avoids network latency.

- Fuzzy search: https://www.fusejs.io/fuzzy-search.html
- Performance and indexing: https://www.fusejs.io/performance.html
- License/source: https://github.com/krisk/Fuse (Apache-2.0)

### Prompt-manager feature comparison

A 2026 comparison of 25 prompt-management products identifies searchable prompt libraries, version history, reusable templates/dynamic variables, model testing/evaluation, integrations, collaboration and governance as recurring workflow areas. An open-source prompt-tool review also distinguishes local libraries from self-hosted/team platforms and model-operation/evaluation tools. This supports prioritizing robust local retrieval, reusable templates, and revision safety before adding server-backed collaboration or model execution.

- Feature landscape comparison (May 25, 2026): https://stealwhatworks.com/blogs/news/prompt-management-tool-features
- Open-source prompt managers reviewed (September 2026): https://prompt-architects.com/blog/536-best-open-source-prompt-management-tools-2026
- Example local-first prompt library features: https://github.com/PromptBranch/promptbranch

These reviews are useful for feature discovery, not definitive evidence that every listed product feature is free or that vendor claims are equivalent. The implementation decision is based on local cost and privacy characteristics, not marketing labels.

### UI reliability and offline use

The redesign uses the system font stack instead of importing a font stylesheet from a third-party CDN. This removes an avoidable network request and lets the interface render with installed system fonts while offline. Responsive editor rows, focus indicators, and reduced-motion styles help usability, but no specific Lighthouse/performance score is claimed because a complete production build and browser profiling could not run in this environment.

### Seed migration safety

The library version advances to `3`. The existing migration function is additive: it adds collections and seed IDs that are absent but leaves user-authored prompts, prompt edits, favorites, and deletions untouched. The static validation performed for this delivery found 104 unique titles, 15 collections, non-empty descriptions, body lengths of at least 674 characters, valid collection assignments, and no repeated named-variable placeholders within a prompt.

## What must still be verified on a network-connected machine

- Install/resolve Fuse.js via the package manager and verify that the lockfile is accepted by `npm ci` or the selected package manager.
- Run the actual Vitest suite, lint, production build, and Electron/SQLite smoke tests.
- Exercise typo search and multi-term intersection in the real UI; this environment had no working `vitest` executable and could not resolve the npm registry, so those integration tests are included but not reported as executed.
- Measure search responsiveness on a large user-generated library before claiming a performance bound.

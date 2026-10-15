# Research and technical decision log

This log records current design choices based on the supplied source and the official documentation reviewed for this implementation. It is not a substitute for final compatibility testing against the exact resolved package lock.

## Electron renderer isolation

**Decision:** use `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, a narrowly scoped preload bridge, blocked cross-origin navigation, denied permission requests, and sender validation in IPC handlers.

**Rationale:** the renderer handles user-authored prompt text and imported JSON; it should not have direct access to Node, raw IPC, or arbitrary filesystem operations. Electron's security checklist explicitly recommends isolation, sandboxing, CSP, restricted navigation, and sender validation.

Source: https://www.electronjs.org/docs/latest/tutorial/security/

## Credential protection on Linux

**Decision:** use Electron `safeStorage`'s asynchronous encryption/decryption methods, re-encrypt after key rotation when requested, and fail closed if Linux reports the `basic_text` or `unknown` synchronous storage backend.

**Rationale:** Electron documents that `basic_text` uses a hardcoded plaintext password and does not protect secrets adequately. Credential setup should not silently downgrade to that mode simply because encryption APIs are present. The async API also avoids blocking the main process while interacting with the OS secret store.

Source: https://www.electronjs.org/docs/latest/api/safe-storage/

## SQLite driver and packaging

**Decision:** use `better-sqlite3` in the Electron main process with `electron-builder` native dependency rebuilding and unpacking configured.

**Rationale:** it provides transactional SQLite access with prepared statements and is a mature Node SQLite driver. Because it is a native addon, it must be rebuilt for the Electron runtime ABI; the packaging step is configured to handle that. If the selected package versions do not provide a compatible prebuild for the target architecture, the packaging environment needs the usual Linux native build tools. This is an explicit release gate because dependency install/build could not be run in the current no-DNS environment. The archive's npm lock graph and existing Bun lock graph could not be regenerated here; run `npm install` on a network-connected machine before using `npm ci` or cutting a release. If using Bun instead, run `bun install` there to refresh `bun.lock`.

Source: https://github.com/WiseLibs/better-sqlite3/blob/master/docs/troubleshooting.md
Source: https://www.electron.build/docs/

## SQLite transaction and restore model

**Decision:** keep normalized entities in SQLite and write a validated full-library snapshot in one transaction for the initial implementation. Restore uses the application JSON format rather than loading arbitrary database files.

**Rationale:** the existing store exposes complete library state. The snapshot adapter minimizes changes to current UI flows and ensures a failed insert rolls back atomically. JSON restore is easier to validate and version than replacing an open SQLite file. Entity-level incremental IPC writes can be introduced if profiling demonstrates a need.

Source: https://www.sqlite.org/backup.html
Source: https://www.sqlite.org/lang_transaction.html

## Google Drive OAuth and least privilege

**Decision:** use a loopback IP callback on a random local port, authorization-code flow with PKCE S256, random `state` validation, and only `https://www.googleapis.com/auth/drive.appdata`. Store tokens in Electron `safeStorage`, and upload backups inside the hidden app-specific Drive folder.

**Rationale:** Google's installed-app OAuth guidance recommends PKCE and loopback redirect URIs for desktop apps. The Drive `appDataFolder` is isolated from normal user files and uses a non-sensitive app-data scope, which is a closer fit than granting access to a user's full Drive. The user must configure a Desktop OAuth client and consent before cloud functionality can be exercised.

Sources:

- https://developers.google.com/identity/protocols/oauth2/native-app
- https://developers.google.com/drive/api/guides/appdata

## Backup scheduling

**Decision:** schedule while the app is open, check for overdue work after launch, allow user-defined frequencies and retention, and notify only when enabled.

**Rationale:** an in-process scheduler cannot execute while the app is fully closed, and silently adding a daemon or startup task would violate user control expectations. The UI and documentation say this explicitly. Retention applies only to PromptShelf-named files after a new upload is verified.

## Built-in prompt library

**Decision:** seed 104 complete, variable-ready prompt definitions into the normal library on first launch. The library now includes 40 additional prompts across freelance/client work, career preparation, and AI/LLM engineering. Track a `seedLibraryVersion`, assign deterministic built-in IDs, and apply upgrades additively.

**Rationale:** seeding should help the first-run experience without overwriting user prompts or edits on later launches. The seed version is separate from the export format version so the built-in catalogue can evolve independently. Existing records remain the source of truth.

## Free feature research: local-first prompt productivity

### Fuse.js fuzzy search

**Decision:** use Fuse.js for indexed, weighted fuzzy matching over title, description, tags, content, and collection name. Index only the current view and reuse the memoized index while the visible library does not change. Title has the strongest weight; content has a lower weight so incidental mentions do not swamp an exact title match. Queries are split into terms and intersected, requiring every term to match somewhere while tolerating typos.

**Why this was selected:** Fuse.js is an open-source, zero-dependency, client-side search library under Apache-2.0. Its documented Bitap-based fuzzy matching supports typo tolerance, weighted keys, thresholds, and `ignoreLocation`; the latter helps find matches in long prompt bodies instead of only near the beginning. The official performance guide reports that small and medium-sized indexes are inexpensive to build, but the index is still memoized and narrowed to the current view so it is not recreated on each keystroke.

Sources: https://www.fusejs.io/fuzzy-search.html, https://www.fusejs.io/performance.html, https://github.com/krisk/Fuse

### Deterministic offline prompt-quality coach

**Decision:** add eight explainable checks for objective, context/input, expected output, constraints, evidence/uncertainty, verification, enough guiding detail, and descriptive title. Each check provides specific advice and contributes to a structural score. A dashboard health panel points to prompts that could be made more reusable.

**Why this stays free and private:** the checks are deterministic string/structure heuristics, not an LLM evaluation. Prompt text is not uploaded and users do not need an API key or paid subscription. The UI explicitly states that the score is guidance rather than proof of correctness or answer quality.

### Similar-title duplicate warning

**Decision:** use a second narrow Fuse.js index in the editor to flag titles that appear close to an existing prompt; exact content duplicates retain their separate, stronger warning.

**Why:** near-duplicate prompts make a library harder to maintain and search. A warning is safer than automatically merging or deleting user content. The heuristic only surfaces a candidate; the user decides what to do.

### Seed catalogue upgrade strategy

**Decision:** expand the library from 64 to 104 prompts, with 40 new ready-to-use templates covering freelance/client delivery, interviewing and career work, AI/LLM evaluation, security, accessibility, SaaS growth, and engineering reliability. Increase the seed-library version to 3 and keep additions additive.

**Why:** users get immediate value without configuring a model or finding prompt content themselves. Versioned additive seeding prevents routine upgrades from overwriting their edits. Titles are tested for uniqueness; each prompt has a category, description, content, valid named variables, and sufficient detail.

### UI and offline performance

**Decision:** keep a light, calm productivity-oriented visual system with clearer metric cards, editor quality feedback, stronger focus states, responsive layout adjustments, and reduced-motion support. Use the system font stack instead of a remote Google Fonts stylesheet.

**Why:** this removes an avoidable external font request, improves offline launch behavior, and reduces a third-party network dependency. It does not by itself prove a specific Lighthouse score; performance must be measured after a production build on a representative machine.

### Considered but not enabled

- **Hosted AI prompt scoring or rewriting:** not included because there is no universally free, unlimited model API and transmitting private prompts would change the privacy model.
- **Team collaboration and prompt sharing:** requires a trusted server, accounts, access controls, and ongoing hosting. A local desktop app should not imply these are free or secure without that infrastructure.
- **Local model integration:** potentially useful for users who already run Ollama, but it adds hardware, model storage, latency, and setup costs. Keep it optional until there is a clear configuration and failure UX.
- **Prompt A/B testing against live models:** a library comparison alone can be local and free, but automated model execution is provider-dependent and may incur costs. It is not represented as available in this build.

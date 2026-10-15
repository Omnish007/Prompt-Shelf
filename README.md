# PromptShelf

PromptShelf is a local-first prompt manager for quickly saving, organizing, templating, searching, and copying AI prompts. It runs as a standard Vite React single-page application (SPA) in the browser, while the Ubuntu desktop edition bundles Electron and SQLite for durable local storage.

## Highlights

- **104 built-in prompts** across 15 collections, including software engineering, debugging, security, product, research, writing, business, testing, analytics, freelance client work, career preparation, marketing, AI/LLM engineering, and productivity. The seed catalogue is upgraded additively: built-ins are added once per seed-library version without overwriting existing user edits or deleting user records.
- **Fuse.js fuzzy search** across titles, descriptions, tags, prompt content, and collection names; typo-tolerant matching is entirely local, with title weighted highest. Search terms are combined so every entered term must match somewhere.
- **SQLite persistence in the desktop edition**, with normalized prompt, collection, tag, variable, revision, settings, and backup-history tables.
- Browser edition keeps using IndexedDB. The UI talks to a small storage boundary instead of importing Electron or filesystem APIs.
- Prompt-quality coach with explainable offline checks, actionable improvement hints, and a library-health view to find weakly specified prompts—no AI API or network call. Similar-title warnings help avoid accidental near-duplicates.
- Search, collections, tags, favorites, pinned prompts, archives, trash, prompt variables, revision history, duplicate, and quick capture.
- JSON export/import with validation, merge/replace modes, and an explicit confirmation before replacement.
- Optional Google Drive backup in the hidden app-specific `appDataFolder`, encrypted OS-backed credential storage, upload verification, and configurable retention.
- Native Linux menus, clipboard bridge, file dialogs, tray affordance when available, secure IPC, and Ubuntu `.deb` / AppImage packaging.

## Interface, themes, and recovery

- The home screen prioritizes prompt discovery, quick capture, new-prompt creation, recently updated prompts, pinned/favorite items, reusable templates, and offline prompt-structure checks.
- Light and dark palettes use the same semantic roles but independently tuned surface and accent values. Run `npm run theme:contrast` after changing theme tokens.
- The app shows local persistence status on desktop and mobile. If a write fails, use the Retry action; if the saved library cannot be opened, PromptShelf shows a recovery screen instead of replacing it with starter content.
- Keyboard users can skip directly to the main workspace. Prompt cards expose a keyboard-operable title action while copy and tag-filter actions remain separate controls.

## Requirements

- Node.js 22+ and npm (the packaged Electron runtime carries its own Node runtime).
- PromptShelf uses the built-in `node:sqlite` engine, requiring no external C++ compilers (`make`, `g++`) or native rebuilds.
- Internet access is needed for first-time dependency installation and to use Google Drive backup.

## Install dependencies

```bash
npm install
```

The desktop build uses Electron and electron-builder with the Node.js built-in `node:sqlite` storage adapter. Because SQLite is statically provided by the Node/Electron runtime, native addon compilation is not required.

## Run the browser app

```bash
npm run dev
```

Open the local URL printed by Vite. Browser data is stored in IndexedDB for that browser origin. Export a JSON backup before clearing site data or changing browser profiles.

## Run the desktop app in development

```bash
npm run app:dev
```

Electron starts the local Vite development server on an available `127.0.0.1` loopback port, verifies that the response belongs to PromptShelf, then opens a hardened BrowserWindow. No remote application content is loaded into the renderer.

## Build for Ubuntu Linux

```bash
# Build the Vite bundle and package both .deb and AppImage
npm run package:linux

# Or build one format
npm run package:deb

# Create an unpacked directory for testing
npm run package:dir
```

Artifacts are written to `release/`. Install a Debian package with:

```bash
sudo apt install ./release/PromptShelf_1.0.0_amd64.deb
```

The exact artifact name may differ by architecture and electron-builder version. AppImage execution may require FUSE support on some distributions; consult `docs/TROUBLESHOOTING.md` if it fails to launch.

## Local data and migration

The desktop database is created under Electron's per-user application-data directory as `promptshelf.sqlite3`; on Ubuntu this is normally under `~/.config/PromptShelf/`. The precise location is shown in **Backup & Settings → Desktop storage**. The application opens the database only in Electron's main process and exposes validated operations through its preload API.

The first desktop launch initializes the SQLite schema and seeds the prompt library automatically. The store can migrate legacy IndexedDB data only when that data is reachable from the renderer’s current origin; Chromium isolates browser profiles and origins, and the desktop listener selects an available local port at launch. For the normal migration from an existing hosted or browser-origin app, use **Backup & Settings → Export backup** in the old app and **Import backup** in PromptShelf Desktop. Import validates the file and offers merge or replace; keep the source data until you have checked the imported record counts.

Built-in library upgrades are additive: new prompt IDs are added once per seed-library version, while existing prompts, edits, favorites, and deletions are not overwritten. Exported backups have their own file-format version, separate from the built-in library revision.

## Google Drive setup

Read [`docs/GOOGLE_DRIVE_SETUP.md`](docs/GOOGLE_DRIVE_SETUP.md). Drive backup is optional and only requests the `drive.appdata` scope. Credentials and tokens are encrypted with Electron `safeStorage`; if OS-backed secure storage is unavailable, the app refuses to save them in plain text.

Scheduled backups run while PromptShelf is open and check for missed work after the next launch. The application does not run a hidden service after it is fully closed. Retention is limited to files named `promptshelf-backup-*.json` in the app-specific Drive folder and deletes older backups only after verifying the new upload.

## Quality checks

```bash
npm test
npm run lint
npm run build
npm run theme:contrast
node --check electron/main.cjs
node --check electron/preload.cjs
```

Review [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) for the palette, contrast guard rails, and UI component guidance; [`docs/FEATURE_RESEARCH.md`](docs/FEATURE_RESEARCH.md) for free-feature research; and [`docs/ENGINEERING_AUDIT.md`](docs/ENGINEERING_AUDIT.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), and [`docs/RESEARCH_DECISIONS.md`](docs/RESEARCH_DECISIONS.md) for implementation decisions and release limitations.

## Privacy defaults

- No analytics or remote model calls are added. Fuzzy search and prompt-quality checks run locally.
- Prompts remain local unless you explicitly export them or configure a Google Drive backup.
- Prompt contents are not written to application logs by the desktop bridge.
- Google Drive backups are JSON prompt-library snapshots; OAuth tokens are stored separately in the OS-encrypted credential vault and are not included in exported backups.

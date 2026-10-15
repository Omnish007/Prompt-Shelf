# Troubleshooting PromptShelf

## Dependency installation or build fails

Run `node --version` and `npm --version`, then `npm install`. PromptShelf uses the built-in `node:sqlite` storage module in Node 22+ and Electron, requiring no external build tools or C++ compilation (`make`, `g++`).

```bash
npm run build
npm run package:dir
```

## Desktop application opens an error dialog

- Ensure `npm run build` completes before creating packages.
- Check that `.output/server/index.mjs` exists.
- Run `npm run app:dev` from the repository root; the Electron main process starts Vite on an available loopback port and verifies that the response belongs to PromptShelf.
- Check the terminal output for a missing database driver, schema constraint failure, or local-server startup error.

## Prompts do not appear to save

Open **Backup & Settings → Desktop storage** and run **Check database integrity**. The UI's save indicator should return to “Saved locally.” If a save fails, the main process logs the exception; do not delete the database before exporting or copying it. Use **Open data folder** to locate the local database, close PromptShelf before making any manual copy, and keep the `.sqlite3`, `-wal`, and `-shm` files together if present.

For a recoverable migration, export a JSON backup before updating or replacing the application. In browser mode, export from the old browser origin and import in desktop mode; different ports/profiles have separate IndexedDB stores.

## Google Drive connection fails

- Confirm the Google Drive API is enabled in the Cloud project.
- Confirm the OAuth client type is **Desktop app**.
- Confirm the signing-in account is allowed by the OAuth consent screen's test-user list while the app is in Testing mode.
- Ensure a browser can open `accounts.google.com` and the app can reach `oauth2.googleapis.com` and `www.googleapis.com`.
- On Ubuntu, unlock or configure a supported desktop keyring. PromptShelf intentionally refuses to store tokens as plaintext if Electron's `safeStorage` cannot provide encryption.
- If a token has been revoked, disconnect and connect again.

## Automatic backups do not run after quitting

This is expected: scheduling runs while PromptShelf is open and catches up on the next launch. Fully closed-app background execution is not implemented. Keep the app running for scheduled work; do not assume a tray icon means a background service remains active after Quit.

## AppImage cannot launch

Some Ubuntu installations lack the FUSE compatibility package needed by AppImage. Install the FUSE 2 compatibility package provided by your Ubuntu release or install the `.deb` package instead. Do not run untrusted AppImages with elevated privileges.

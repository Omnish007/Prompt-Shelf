# Google Drive backup setup

Google Drive backup is optional. PromptShelf asks only for access to its app-specific hidden Drive folder and does not request access to your other Drive documents.

## 1. Create a Desktop OAuth client

1. Open the Google Cloud Console: https://console.cloud.google.com/
2. Create or select a project.
3. Enable the **Google Drive API** for that project.
4. Configure the OAuth consent screen and fill in the required application details. If the app is in Testing mode, add the Google account you will use as a test user.
5. Create an OAuth client whose application type is **Desktop app**.
6. Copy the client ID and, if Google supplies it for the client, its client secret.

Google's native-app OAuth guide: https://developers.google.com/identity/protocols/oauth2/native-app
Drive app-data folder guide: https://developers.google.com/drive/api/guides/appdata

## 2. Configure PromptShelf

1. Open **Backup & Settings → Google Drive backup**.
2. Paste the Desktop OAuth client ID. Add the client secret only if your Cloud Console issued one.
3. Save configuration. PromptShelf uses Electron's asynchronous `safeStorage` API and rejects Linux's insecure `basic_text` fallback. If OS-backed secure storage is unavailable, resolve the Ubuntu desktop keyring issue before connecting.
4. Select **Connect Google Drive**. Your default browser opens Google's consent flow. Review the requested `drive.appdata` scope and approve it.
5. Return to PromptShelf and select **Back up now**. Verify the success feedback and last-backup timestamp.

The app uses a random `127.0.0.1` loopback callback and PKCE. Google OAuth credentials are never put in prompt content, JSON backups, or renderer local storage.

## 3. Configure retention and schedule

Choose a schedule (hourly, 6-hourly, 12-hourly, daily, every two days, or weekly), a retention count between 1 and 100, and whether to show desktop notifications. Automatic backup work runs while PromptShelf is open and checks for an overdue backup on launch. It does not run after the app is completely closed.

After upload, PromptShelf checks the uploaded file metadata and size before pruning older files matching `promptshelf-backup-*.json` in `appDataFolder`. It never removes ordinary Drive files. The Drive app-data folder itself can be deleted by the user through Google's app-data management behavior, so maintain a separate local export for important libraries.

## 4. Disconnect or troubleshoot

**Disconnect** removes saved access/refresh tokens from PromptShelf's encrypted credential vault. Existing Drive backups remain in Drive; the app does not delete them on disconnect.

If connection fails, confirm that Drive API is enabled, the OAuth client type is Desktop app, the app is allowed under the consent-screen publishing/test-user settings, network access is available, and the desktop keyring is unlocked. Reconnect to obtain consent again if a refresh token is revoked. For detailed symptoms see `TROUBLESHOOTING.md`.

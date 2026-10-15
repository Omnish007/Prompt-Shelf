import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CustomSelect } from "@/components/prompt-shelf/CustomSelect";

type DriveStatus = {
  connected: boolean;
  configured: boolean;
  secureStorageAvailable?: boolean;
  lastBackupAt: number | null;
  lastBackupError: string | null;
  error?: string;
  schedule: {
    enabled: boolean;
    intervalHours: number;
    retentionCount: number;
    notificationsEnabled?: boolean;
  };
};

export function GoogleDrivePanel() {
  const desktop = window.promptShelfDesktop;
  const [status, setStatus] = useState<DriveStatus | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [intervalHours, setIntervalHours] = useState("24");
  const [retentionCount, setRetentionCount] = useState("10");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!desktop) return;
    try {
      const next = await desktop.getDriveStatus();
      setStatus(next);
      setEnabled(next.schedule.enabled);
      setIntervalHours(String(next.schedule.intervalHours));
      setRetentionCount(String(next.schedule.retentionCount));
      setNotificationsEnabled(next.schedule.notificationsEnabled === true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load Google Drive status",
      );
    }
  }, [desktop]);

  useEffect(() => {
    let active = true;
    if (desktop) {
      desktop
        .getDriveStatus()
        .then((next) => {
          if (!active) return;
          setStatus(next);
          setEnabled(next.schedule.enabled);
          setIntervalHours(String(next.schedule.intervalHours));
          setRetentionCount(String(next.schedule.retentionCount));
          setNotificationsEnabled(next.schedule.notificationsEnabled === true);
        })
        .catch((error) => {
          if (!active) return;
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not load Google Drive status",
          );
        });
    }
    return () => {
      active = false;
    };
  }, [desktop]);

  const saveCredentials = async () => {
    if (!desktop) return;
    setBusy(true);
    try {
      await desktop.configureDrive({
        clientId,
        ...(clientSecret.trim() ? { clientSecret } : {}),
      });
      toast.success("Google OAuth configuration saved securely");
      setClientSecret("");
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save configuration",
      );
    } finally {
      setBusy(false);
    }
  };
  const connect = async () => {
    if (!desktop) return;
    setBusy(true);
    try {
      await desktop.connectDrive();
      toast.success("Google Drive connected");
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Google Drive connection failed",
      );
    } finally {
      setBusy(false);
    }
  };
  const saveSchedule = async () => {
    if (!desktop) return;
    setBusy(true);
    try {
      await desktop.setBackupSchedule({
        enabled,
        intervalHours: Number(intervalHours),
        retentionCount: Number(retentionCount),
        notificationsEnabled,
      });
      toast.success("Automatic backup settings saved");
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save backup settings",
      );
    } finally {
      setBusy(false);
    }
  };
  const backupNow = async () => {
    if (!desktop) return;
    setBusy(true);
    try {
      await desktop.runDriveBackup();
      toast.success("Backup uploaded and verified");
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Google Drive backup failed",
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  };
  const disconnect = async () => {
    if (
      !desktop ||
      !confirm(
        "Disconnect Google Drive? Existing backups in Drive will not be deleted.",
      )
    )
      return;
    setBusy(true);
    try {
      await desktop.disconnectDrive();
      toast.success("Google Drive disconnected");
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not disconnect Google Drive",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="label">Google Drive backup</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional encrypted credential storage, verified uploads, and
            retention limited to PromptShelf backups.
          </p>
        </div>
        <span className="chip" data-active={status?.connected === true}>
          {status?.connected ? "Connected" : "Not connected"}
        </span>
      </div>
      {status?.secureStorageAvailable === false && (
        <p className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
          OS secure storage is unavailable. Unlock/configure a supported desktop
          keyring before saving OAuth credentials; tokens will not be stored in
          plain text.
        </p>
      )}
      {status?.error && (
        <p className="text-sm text-destructive">{status.error}</p>
      )}
      <div className="space-y-1.5">
        <label className="label" htmlFor="google-client-id">
          Google OAuth Desktop client ID
        </label>
        <input
          id="google-client-id"
          className="field"
          autoComplete="off"
          spellCheck={false}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="xxxx.apps.googleusercontent.com"
        />
        <label className="label block pt-2" htmlFor="google-client-secret">
          Client secret (optional for Desktop OAuth clients)
        </label>
        <input
          id="google-client-secret"
          className="field"
          type="password"
          autoComplete="new-password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder={
            status?.configured
              ? "Leave blank to keep the saved value"
              : "Paste the Desktop OAuth client secret if issued"
          }
        />
        <p className="text-xs text-muted-foreground">
          Create a Desktop app OAuth client in Google Cloud and enable the
          Google Drive API. Use only the <code>drive.appdata</code> scope.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="btn-outline"
          disabled={
            busy || !clientId.trim() || status?.secureStorageAvailable === false
          }
          onClick={() => void saveCredentials()}
        >
          Save configuration
        </button>
        {status?.connected ? (
          <button
            className="btn-outline"
            disabled={busy}
            onClick={() => void disconnect()}
          >
            Disconnect
          </button>
        ) : (
          <button
            className="btn-primary"
            disabled={
              busy ||
              !status?.configured ||
              status?.secureStorageAvailable === false
            }
            onClick={() => void connect()}
          >
            Connect Google Drive
          </button>
        )}
        <button
          className="btn-outline"
          disabled={busy || !status?.connected}
          onClick={() => void backupNow()}
        >
          {busy ? "Working…" : "Back up now"}
        </button>
      </div>
      <div className="border-t pt-4">
        <div className="mb-3 label">Automatic backup schedule</div>
        <label className="flex items-start gap-2 text-sm">
          <input
            className="mt-0.5"
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />{" "}
          <span>
            <strong>Enable automatic backups</strong>
            <span className="block text-xs text-muted-foreground">
              Runs while PromptShelf is open and catches up after the next
              launch. It does not run while the app is fully closed.
            </span>
          </span>
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="label" htmlFor="backup-interval">
              Frequency
            </label>
            <CustomSelect<string>
              value={intervalHours}
              onChange={(val) => setIntervalHours(val)}
              options={[
                { value: "1", label: "Every hour" },
                { value: "6", label: "Every 6 hours" },
                { value: "12", label: "Every 12 hours" },
                { value: "24", label: "Daily" },
                { value: "48", label: "Every 2 days" },
                { value: "168", label: "Weekly" },
              ]}
              className="w-full text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="label" htmlFor="backup-retention">
              Keep latest backups
            </label>
            <input
              id="backup-retention"
              className="field"
              type="number"
              min={1}
              max={100}
              value={retentionCount}
              onChange={(e) => setRetentionCount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Older PromptShelf backups beyond this count are deleted only after
              a new backup is verified.
            </p>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
          />{" "}
          Notify me when a scheduled backup succeeds or fails
        </label>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button
            className="btn-outline"
            disabled={busy}
            onClick={() => void saveSchedule()}
          >
            Save schedule
          </button>
          <div className="text-xs text-muted-foreground">
            {status?.lastBackupAt
              ? `Last successful backup: ${new Date(status.lastBackupAt).toLocaleString()}`
              : "No successful cloud backup recorded yet."}
          </div>
        </div>
        {status?.lastBackupError && (
          <p className="mt-2 text-xs text-destructive">
            Last backup error: {status.lastBackupError}
          </p>
        )}
      </div>
    </div>
  );
}

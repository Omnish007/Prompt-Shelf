import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { actions, flush } from "@/lib/store";
import { ThemeSelector } from "./ThemeControls";
import { GoogleDrivePanel } from "./GoogleDrivePanel";

export function SettingsView() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const desktop =
    typeof window !== "undefined" ? window.promptShelfDesktop : undefined;
  const exportFile = async () => {
    try {
      const json = actions.exportJson();
      const name = `promptshelf-backup-${new Date().toISOString().slice(0, 10)}.json`;
      if (desktop) {
        const result = await desktop.exportBackup(json, name);
        if (!result.canceled) toast.success("Backup exported");
        return;
      }
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Backup downloaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not export backup",
      );
    }
  };
  const importText = async (text: string, sourceName: string) => {
    if (
      mode === "replace" &&
      !confirm(
        `Replace your entire library with “${sourceName}”? Export a backup first if unsure.`,
      )
    )
      return;
    try {
      actions.importJson(text, mode);
      if (!(await flush()))
        throw new Error(
          "The import is in memory but could not be saved. Check storage availability before closing the app.",
        );
      toast.success("Backup imported and saved");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The backup could not be imported",
      );
    }
  };
  const chooseImport = async () => {
    if (desktop) {
      try {
        const result = await desktop.importBackup();
        if (!result.canceled && result.text !== undefined)
          await importText(result.text, result.name || "backup.json");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not read backup",
        );
      }
      return;
    }
    fileRef.current?.click();
  };
  return (
    <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Backup & Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your library stays local by default. Backups are explicit and
            user-controlled.
          </p>
        </div>
        <div className="space-y-3 panel p-5">
          <div className="label">Appearance</div>
          <p className="text-sm text-muted-foreground">
            Choose how PromptShelf looks. System follows your OS preference.
          </p>
          <ThemeSelector />
        </div>
        <div className="space-y-3 panel p-5">
          <div className="label">Local backup</div>
          <p className="text-sm text-muted-foreground">
            Export prompts, collections, tags, variables, and revision history
            to a JSON file. Desktop exports use a native save dialog.
          </p>
          <button className="btn-primary" onClick={() => void exportFile()}>
            <Download className="size-4" /> Export backup
          </button>
        </div>
        <div className="space-y-3 panel p-5">
          <div className="label">Restore from file</div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="restore-mode"
                checked={mode === "merge"}
                onChange={() => setMode("merge")}
              />{" "}
              Merge with current library
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="restore-mode"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
              />{" "}
              Replace everything
            </label>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 20 * 1024 * 1024)
                  throw new Error("Backup must be 20 MiB or smaller.");
                await importText(await file.text(), file.name);
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Could not read backup",
                );
              } finally {
                e.target.value = "";
              }
            }}
          />
          <button className="btn-outline" onClick={() => void chooseImport()}>
            <Upload className="size-4" /> Import backup file
          </button>
          <p className="text-xs text-muted-foreground">
            Files are validated before changes are committed. Replace mode
            requires confirmation.
          </p>
        </div>
        {desktop ? <DesktopStoragePanel /> : null}
        {desktop ? <GoogleDrivePanel /> : null}
        <div className="space-y-2 panel p-5 text-sm text-muted-foreground">
          <div className="label">Storage & privacy</div>
          <p>
            {desktop
              ? "Desktop mode stores your prompts in a local SQLite database in the application’s user-data directory. The renderer cannot access the database file directly."
              : "Browser mode stores prompts in this browser’s IndexedDB. Browser storage can be cleared by site-data cleanup, so export backups regularly."}
          </p>
          <p>
            Google Drive access is optional and uses the app-specific data
            folder; PromptShelf does not request access to your general Drive
            files.
          </p>
        </div>
      </div>
    </main>
  );
}

function DesktopStoragePanel() {
  const desktop = window.promptShelfDesktop;
  const [info, setInfo] = useState<{
    platform: string;
    appVersion: string;
    databasePath: string;
    trayAvailable: boolean;
    closeToTray: boolean;
  } | null>(null);
  const [integrity, setIntegrity] = useState<{
    ok: boolean;
    details: string[];
  } | null>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    void desktop
      ?.getAppInfo()
      .then(setInfo)
      .catch((error: unknown) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not read desktop information",
        ),
      );
  }, [desktop]);
  const check = async () => {
    if (!desktop) return;
    setChecking(true);
    try {
      const result = await desktop.checkDatabase();
      setIntegrity(result);
      if (result.ok) toast.success("SQLite integrity check passed");
      else toast.error("SQLite reported an integrity problem");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "SQLite integrity check failed",
      );
    } finally {
      setChecking(false);
    }
  };
  return (
    <div className="space-y-3 panel p-5">
      <div className="label">Desktop storage</div>
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Persistence</span>
          <strong>SQLite · local-first</strong>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Application version</span>
          <span>{info?.appVersion ?? "Loading…"}</span>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">
            Database location
          </span>
          <p className="break-all rounded-md bg-background/60 p-2 font-mono text-xs">
            {info?.databasePath ?? "Loading…"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="btn-outline"
          onClick={() =>
            void desktop
              ?.openDataFolder()
              .catch((error: unknown) =>
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Could not open data folder",
                ),
              )
          }
        >
          Open data folder
        </button>
        <button
          className="btn-outline"
          disabled={checking}
          onClick={() => void check()}
        >
          {checking ? "Checking…" : "Check database integrity"}
        </button>
      </div>
      {info?.trayAvailable ? (
        <label className="flex items-start gap-2 border-t pt-3 text-sm">
          <input
            className="mt-0.5"
            type="checkbox"
            checked={info.closeToTray}
            onChange={async (event) => {
              try {
                const result = await desktop?.setCloseToTray(
                  event.target.checked,
                );
                if (result)
                  setInfo((current) =>
                    current
                      ? { ...current, closeToTray: result.enabled }
                      : current,
                  );
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Could not save tray preference",
                );
              }
            }}
          />
          <span>
            <strong>
              Keep running in the system tray when the window is closed
            </strong>
            <span className="block text-xs text-muted-foreground">
              When enabled, use the tray menu’s Quit action to fully exit
              PromptShelf. Disabled by default.
            </span>
          </span>
        </label>
      ) : null}
      {integrity && (
        <p
          className={
            "text-xs " + (integrity.ok ? "text-success" : "text-destructive")
          }
        >
          {integrity.ok
            ? "SQLite quick_check passed."
            : `SQLite check: ${integrity.details.join("; ")}`}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        The database is managed by Electron’s main process. The renderer
        receives validated operations only, never raw SQL or filesystem access.
      </p>
    </div>
  );
}

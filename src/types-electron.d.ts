import type { Library } from "./lib/store";

declare global {
  interface Window {
    promptShelfDesktop?: {
      getAppInfo: () => Promise<{
        platform: string;
        appVersion: string;
        databasePath: string;
        trayAvailable: boolean;
        closeToTray: boolean;
      }>;
      setCloseToTray: (enabled: boolean) => Promise<{ enabled: boolean }>;
      checkDatabase: () => Promise<{ ok: boolean; details: string[] }>;
      openDataFolder: () => Promise<{ opened: true }>;
      writeClipboard: (text: string) => Promise<{ copied: true }>;
      onShortcut: (callback: (shortcut: string) => void) => () => void;
      onBeforeClose: (callback: (willQuit: boolean) => void) => () => void;
      confirmClose: () => Promise<{ confirmed: boolean }>;
      cancelClose: () => Promise<{ canceled: true }>;
      loadLibrary: () => Promise<Library | null>;
      saveLibrary: (library: Library) => Promise<{ saved: true }>;
      exportBackup: (
        json: string,
        suggestedName: string,
      ) => Promise<{ canceled: boolean; path?: string }>;
      importBackup: () => Promise<{
        canceled: boolean;
        text?: string;
        name?: string;
      }>;
      getDriveStatus: () => Promise<{
        connected: boolean;
        configured: boolean;
        lastBackupAt: number | null;
        lastBackupError: string | null;
        secureStorageAvailable?: boolean;
        error?: string;
        schedule: {
          enabled: boolean;
          intervalHours: number;
          retentionCount: number;
          notificationsEnabled?: boolean;
        };
      }>;
      configureDrive: (config: {
        clientId: string;
        clientSecret?: string;
      }) => Promise<{ configured: true }>;
      connectDrive: () => Promise<{ connected: true }>;
      disconnectDrive: () => Promise<{ connected: false }>;
      runDriveBackup: () => Promise<{ fileId: string; createdAt: number }>;
      setBackupSchedule: (schedule: {
        enabled: boolean;
        intervalHours: number;
        retentionCount: number;
        notificationsEnabled?: boolean;
      }) => Promise<{ saved: true }>;
    };
  }
}

export {};

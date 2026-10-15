"use strict";

const { contextBridge, ipcRenderer } = require("electron");

// Expose task-specific capabilities only; the renderer never receives ipcRenderer or filesystem APIs.
contextBridge.exposeInMainWorld(
  "promptShelfDesktop",
  Object.freeze({
    getAppInfo: () => ipcRenderer.invoke("app:info"),
    setCloseToTray: (enabled) =>
      ipcRenderer.invoke("app:close-to-tray", enabled),
    checkDatabase: () => ipcRenderer.invoke("app:database-check"),
    openDataFolder: () => ipcRenderer.invoke("app:open-data-folder"),
    loadLibrary: () => ipcRenderer.invoke("library:load"),
    saveLibrary: (library) => ipcRenderer.invoke("library:save", library),
    exportBackup: (json, suggestedName) =>
      ipcRenderer.invoke("backup:export", json, suggestedName),
    importBackup: () => ipcRenderer.invoke("backup:import"),
    writeClipboard: (text) => ipcRenderer.invoke("clipboard:write", text),
    getDriveStatus: () => ipcRenderer.invoke("drive:status"),
    configureDrive: (config) => ipcRenderer.invoke("drive:configure", config),
    connectDrive: () => ipcRenderer.invoke("drive:connect"),
    disconnectDrive: () => ipcRenderer.invoke("drive:disconnect"),
    runDriveBackup: () => ipcRenderer.invoke("drive:backup"),
    setBackupSchedule: (schedule) =>
      ipcRenderer.invoke("drive:schedule", schedule),
    onShortcut: (callback) => {
      if (typeof callback !== "function") return () => {};
      const listener = (_event, shortcut) => callback(shortcut);
      ipcRenderer.on("app:shortcut", listener);
      return () => ipcRenderer.removeListener("app:shortcut", listener);
    },
    onBeforeClose: (callback) => {
      if (typeof callback !== "function") return () => {};
      const listener = (_event, willQuit) => callback(Boolean(willQuit));
      ipcRenderer.on("app:before-close", listener);
      return () => ipcRenderer.removeListener("app:before-close", listener);
    },
    confirmClose: () => ipcRenderer.invoke("app:confirm-close"),
    cancelClose: () => ipcRenderer.invoke("app:cancel-close"),
  }),
);

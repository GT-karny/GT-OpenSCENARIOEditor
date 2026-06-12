// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs
  showOpenDialog: (options: Record<string, unknown>) =>
    ipcRenderer.invoke('dialog:open', options),
  showSaveDialog: (options: Record<string, unknown>) =>
    ipcRenderer.invoke('dialog:save', options),

  // File system (direct Node.js fs via IPC)
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('fs:writeFile', filePath, content),
  readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),

  // Resolve the absolute path of a dropped File (drag-and-drop open).
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  // Menu commands (renderer listens for these)
  onMenuAction: (callback: (action: string) => void) => {
    const handler = (_event: unknown, action: string) => callback(action);
    ipcRenderer.on('menu:action', handler);
    return () => {
      ipcRenderer.removeListener('menu:action', handler);
    };
  },

  // Window controls (custom titlebar)
  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose: () => ipcRenderer.send('window:close'),
  windowIsMaximized: () => ipcRenderer.invoke('window:isMaximized') as Promise<boolean>,
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => {
    const handler = (_event: unknown, isMaximized: boolean) => callback(isMaximized);
    ipcRenderer.on('window:maximized-changed', handler);
    return () => {
      ipcRenderer.removeListener('window:maximized-changed', handler);
    };
  },

  // Recent files
  getRecentFiles: () => ipcRenderer.invoke('recent:get'),
  addRecentFile: (filePath: string) => ipcRenderer.send('recent:add', filePath),
  clearRecentFiles: () => ipcRenderer.send('recent:clear'),

  // Unsaved-changes close guard. The main process asks the renderer whether the
  // document is dirty before closing; the renderer replies via the callbacks below.
  onCloseRequested: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('app:close-requested', handler);
    return () => {
      ipcRenderer.removeListener('app:close-requested', handler);
    };
  },
  respondCloseDecision: (isDirty: boolean) =>
    ipcRenderer.send('app:close-decision', isDirty),
  onRunSave: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('app:run-save', handler);
    return () => {
      ipcRenderer.removeListener('app:run-save', handler);
    };
  },
  respondSaveComplete: (ok: boolean) => ipcRenderer.send('app:save-complete', ok),

  // Assembly presets (editor-wide)
  getAssemblyPresets: () => ipcRenderer.invoke('presets:get'),
  saveAssemblyPresets: (presets: unknown[]) => ipcRenderer.send('presets:save', presets),

  // Platform info
  platform: process.platform,
  isElectron: true,
});

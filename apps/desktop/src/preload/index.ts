// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextBridge, ipcRenderer } = require('electron');

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

  // Menu commands (renderer listens for these)
  onMenuAction: (callback: (action: string) => void) => {
    const handler = (_event: unknown, action: string) => callback(action);
    ipcRenderer.on('menu:action', handler);
    return () => {
      ipcRenderer.removeListener('menu:action', handler);
    };
  },

  // Window title
  setTitle: (title: string) => ipcRenderer.send('window:setTitle', title),

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

  // Assembly presets (editor-wide)
  getAssemblyPresets: () => ipcRenderer.invoke('presets:get'),
  saveAssemblyPresets: (presets: unknown[]) => ipcRenderer.send('presets:save', presets),

  // Platform info
  platform: process.platform,
  isElectron: true,
});

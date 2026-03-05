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

  // Recent files
  getRecentFiles: () => ipcRenderer.invoke('recent:get'),
  addRecentFile: (filePath: string) => ipcRenderer.send('recent:add', filePath),
  clearRecentFiles: () => ipcRenderer.send('recent:clear'),

  // Platform info
  platform: process.platform,
  isElectron: true,
});

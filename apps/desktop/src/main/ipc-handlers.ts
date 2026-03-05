import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import { getRecentFiles, addRecentFile, clearRecentFiles } from './recent-files.js';

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // File dialogs
  ipcMain.handle('dialog:open', async (_event, options) => {
    return dialog.showOpenDialog(mainWindow, options);
  });

  ipcMain.handle('dialog:save', async (_event, options) => {
    return dialog.showSaveDialog(mainWindow, options);
  });

  // File system operations (direct access via Node.js fs)
  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    return fs.readFile(filePath, 'utf-8');
  });

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf-8');
  });

  // Window title
  ipcMain.on('window:setTitle', (_event, title: string) => {
    mainWindow.setTitle(title);
  });

  // Recent files
  ipcMain.handle('recent:get', () => getRecentFiles());
  ipcMain.on('recent:add', (_event, filePath: string) => addRecentFile(filePath));
  ipcMain.on('recent:clear', () => clearRecentFiles());
}

export function unregisterIpcHandlers(): void {
  ipcMain.removeHandler('dialog:open');
  ipcMain.removeHandler('dialog:save');
  ipcMain.removeHandler('fs:readFile');
  ipcMain.removeHandler('fs:writeFile');
  ipcMain.removeHandler('recent:get');
  ipcMain.removeAllListeners('window:setTitle');
  ipcMain.removeAllListeners('recent:add');
  ipcMain.removeAllListeners('recent:clear');
}

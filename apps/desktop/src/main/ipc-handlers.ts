import type { BrowserWindow } from 'electron';
import { ipcMain, dialog } from 'electron';
import fs from 'node:fs/promises';
import { getRecentFiles, addRecentFile, clearRecentFiles } from './recent-files.js';
import { getAssemblyPresets, saveAssemblyPresets } from './assembly-presets.js';

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

  ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
    try {
      return await fs.readdir(dirPath);
    } catch {
      return [];
    }
  });

  // Window title
  ipcMain.on('window:setTitle', (_event, title: string) => {
    mainWindow.setTitle(title);
  });

  // Window controls (custom titlebar)
  ipcMain.on('window:minimize', () => {
    mainWindow.minimize();
  });
  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window:close', () => {
    mainWindow.close();
  });
  ipcMain.handle('window:isMaximized', () => {
    return mainWindow.isMaximized();
  });

  // Notify renderer when maximize state changes
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized-changed', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximized-changed', false);
  });

  // Recent files
  ipcMain.handle('recent:get', () => getRecentFiles());
  ipcMain.on('recent:add', (_event, filePath: string) => addRecentFile(filePath));
  ipcMain.on('recent:clear', () => clearRecentFiles());

  // Assembly presets (editor-wide)
  ipcMain.handle('presets:get', () => getAssemblyPresets());
  ipcMain.on('presets:save', (_event, presets: unknown[]) => saveAssemblyPresets(presets));
}

export function unregisterIpcHandlers(): void {
  ipcMain.removeHandler('dialog:open');
  ipcMain.removeHandler('dialog:save');
  ipcMain.removeHandler('fs:readFile');
  ipcMain.removeHandler('fs:writeFile');
  ipcMain.removeHandler('fs:readDir');
  ipcMain.removeHandler('recent:get');
  ipcMain.removeHandler('presets:get');
  ipcMain.removeAllListeners('presets:save');
  ipcMain.removeAllListeners('window:setTitle');
  ipcMain.removeAllListeners('window:minimize');
  ipcMain.removeAllListeners('window:maximize');
  ipcMain.removeAllListeners('window:close');
  ipcMain.removeHandler('window:isMaximized');
  ipcMain.removeAllListeners('recent:add');
  ipcMain.removeAllListeners('recent:clear');
}

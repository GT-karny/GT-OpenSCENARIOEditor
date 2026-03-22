import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { startServer, stopServer } from './server.js';
import { createMenu } from './menu.js';
import { registerIpcHandlers, unregisterIpcHandlers } from './ipc-handlers.js';
import { restoreWindowState, saveWindowState } from './window-state.js';

const IS_DEV = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let serverPort: number | undefined;

async function createWindow() {
  const windowState = restoreWindowState();

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    title: 'OpenSCENARIO Editor',
    backgroundColor: '#0a0a0f',
    frame: false,
    show: false,
    webPreferences: {
      preload: path.join(import.meta.dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  registerIpcHandlers(mainWindow);
  createMenu(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (IS_DEV) {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);
  }

  mainWindow.on('close', () => {
    if (mainWindow) saveWindowState(mainWindow);
  });

  mainWindow.on('closed', () => {
    if (mainWindow) unregisterIpcHandlers();
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  serverPort = await startServer();
  console.log(`Embedded server started on port ${serverPort}`);

  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  await stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

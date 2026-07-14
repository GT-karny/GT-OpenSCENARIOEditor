import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { DEFAULT_WEB_PORT, GTSIM_IPC_CHANNELS } from '@osce/shared';
import { startServer, stopServer } from './server.js';
import { createMenu } from './menu.js';
import { registerIpcHandlers, unregisterIpcHandlers } from './ipc-handlers.js';
import { restoreWindowState, saveWindowState } from './window-state.js';
import { installCloseGuard } from './close-guard.js';
import {
  getCurrentEndpoints,
  getCurrentStatus,
  isGtSimBackendEnabled,
  onBackendStatus,
  startGtSimBackend,
  stopGtSimBackend,
} from './python-server.js';

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
  installCloseGuard(mainWindow);
  wireGtSimStatus(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (IS_DEV) {
    await mainWindow.loadURL(`http://localhost:${DEFAULT_WEB_PORT}`);
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

/**
 * Forward GT_Sim backend status to a renderer window, and re-send the current
 * status on every load (handles reloads and renderers that mount after the
 * backend became ready). See IPC contract `gtsim:status`.
 */
function wireGtSimStatus(window: BrowserWindow): void {
  const send = (): void => {
    const status = getCurrentStatus();
    if (status && !window.isDestroyed()) {
      window.webContents.send(GTSIM_IPC_CHANNELS.status, status);
    }
  };
  const unsubscribe = onBackendStatus(send);
  window.webContents.on('did-finish-load', send);
  window.on('closed', unsubscribe);
}

/**
 * Register the `gtsim:getEndpoints` invoke handler and kick off the backend if
 * enabled. Backend startup is fire-and-forget so a slow/failed backend never
 * blocks the editor UI (status is pushed to the renderer instead).
 *
 * TODO(WP3): fold the gtsim handler registration into ipc-handlers.ts once a
 * settings-based enable toggle replaces the env-var gate (the handler is
 * app-lifetime, not per-window, hence kept here for now).
 */
function initGtSimBackend(): void {
  ipcMain.handle(GTSIM_IPC_CHANNELS.getEndpoints, () => getCurrentEndpoints());

  if (!isGtSimBackendEnabled()) {
    console.log('[gtsim] Backend disabled (set GTSIM_BACKEND=1 or GTSIM_PORT to enable).');
    return;
  }

  void startGtSimBackend({
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    mainDir: import.meta.dirname,
  }).catch((err) => {
    // A `failed` status has been pushed on every failure path (spawn retries
    // exhausted and connect-mode health failure alike), so the renderer banner
    // is informed; this log is for the main-process console only. The editor
    // keeps running without the backend.
    console.error('[gtsim] Backend startup failed:', err);
  });
}

app.whenReady().then(async () => {
  // Start the GT_Sim backend concurrently with the embedded web server — its
  // readiness is reported via gtsim:status, so nothing needs to wait on it.
  initGtSimBackend();

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
  stopGtSimBackend();
  await stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Belt-and-braces: ensure the backend child-process tree is torn down on any
// quit path (menu Quit, Cmd+Q, OS shutdown), not just window-all-closed (R4).
app.on('before-quit', () => {
  stopGtSimBackend();
});

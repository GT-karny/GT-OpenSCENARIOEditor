import Store from 'electron-store';
import type { BrowserWindow } from 'electron';

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

interface StoreSchema {
  windowState: WindowState;
}

const store = new Store<StoreSchema>({
  defaults: {
    windowState: {
      width: 1400,
      height: 900,
    },
  },
});

export function restoreWindowState(): WindowState {
  return store.get('windowState');
}

export function saveWindowState(window: BrowserWindow): void {
  const bounds = window.getBounds();
  store.set('windowState', {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
  });
}

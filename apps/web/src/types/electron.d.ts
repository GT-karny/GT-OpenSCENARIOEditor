import type { GtSimEndpoints, GtSimBackendStatus } from '@osce/shared';

interface ElectronOpenDialogResult {
  canceled: boolean;
  filePaths: string[];
}

interface ElectronSaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

interface ElectronDialogFilter {
  name: string;
  extensions: string[];
}

interface ElectronOpenDialogOptions {
  filters?: ElectronDialogFilter[];
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
  defaultPath?: string;
}

interface ElectronSaveDialogOptions {
  filters?: ElectronDialogFilter[];
  defaultPath?: string;
}

interface ElectronAPI {
  showOpenDialog: (options: ElectronOpenDialogOptions) => Promise<ElectronOpenDialogResult>;
  showSaveDialog: (options: ElectronSaveDialogOptions) => Promise<ElectronSaveDialogResult>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  readDir: (dirPath: string) => Promise<string[]>;
  onMenuAction: (callback: (action: string) => void) => () => void;
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;
  windowIsMaximized: () => Promise<boolean>;
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => () => void;
  getRecentFiles: () => Promise<string[]>;
  addRecentFile: (filePath: string) => void;
  clearRecentFiles: () => void;
  /** Open a file by absolute path (drag-and-drop / recent files). */
  getPathForFile?: (file: File) => string;
  // Unsaved-changes close guard
  onCloseRequested: (callback: () => void) => () => void;
  respondCloseDecision: (isDirty: boolean) => void;
  onRunSave: (callback: () => void) => () => void;
  respondSaveComplete: (ok: boolean) => void;
  getAssemblyPresets: () => Promise<unknown[]>;
  saveAssemblyPresets: (presets: unknown[]) => void;
  // --- GT_Sim execution-mode backend bridge (implemented in apps/desktop; see
  // `@osce/shared` gt-sim-ipc contract). Optional because they only exist in
  // builds that ship the GT_Sim backend supervisor. ---
  /**
   * Resolve the GT_Sim backend endpoints. Returns `null` before the backend is
   * ready (still starting / failed / not launched).
   */
  gtSimGetEndpoints?: () => Promise<GtSimEndpoints | null>;
  /**
   * Subscribe to GT_Sim backend lifecycle pushes. The main process re-sends the
   * current status on `did-finish-load`, so a late subscriber still gets state.
   * Returns an unsubscribe function.
   */
  onGtSimStatus?: (callback: (status: GtSimBackendStatus) => void) => () => void;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

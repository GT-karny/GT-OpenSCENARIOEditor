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
  setTitle: (title: string) => void;
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;
  windowIsMaximized: () => Promise<boolean>;
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => () => void;
  getRecentFiles: () => Promise<string[]>;
  addRecentFile: (filePath: string) => void;
  clearRecentFiles: () => void;
  getAssemblyPresets: () => Promise<unknown[]>;
  saveAssemblyPresets: (presets: unknown[]) => void;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

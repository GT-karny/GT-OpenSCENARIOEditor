import Store from 'electron-store';

interface StoreSchema {
  recentFiles: string[];
}

const store = new Store<StoreSchema>({
  defaults: {
    recentFiles: [],
  },
});

const MAX_RECENT_FILES = 10;

export function getRecentFiles(): string[] {
  return store.get('recentFiles');
}

export function addRecentFile(filePath: string): void {
  const files = store.get('recentFiles').filter((f) => f !== filePath);
  files.unshift(filePath);
  store.set('recentFiles', files.slice(0, MAX_RECENT_FILES));
}

export function clearRecentFiles(): void {
  store.set('recentFiles', []);
}

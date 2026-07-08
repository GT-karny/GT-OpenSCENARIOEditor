import { useCallback, useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import { useFileOperations } from './use-file-operations';
import { useDocumentRegistry } from '../stores/document-registry';
import { useProjectStore } from '../stores/project-store';
import {
  getWebRecentFiles,
  clearWebRecentFiles,
} from '../lib/recent-files/recent-files-db';
import {
  kindFromFileName,
  type RecentFileEntry,
  type RecentFileKind,
} from '../lib/recent-files/recent-list';

/** A recent-file entry normalized across the Electron (path) and web (handle) backends. */
export interface RecentFileItem {
  id: string;
  name: string;
  kind: RecentFileKind;
  /** Electron: absolute path. */
  path?: string;
  /** Web: File System Access handle (when persisted). */
  handle?: FileSystemFileHandle;
}

interface PermissionableHandle extends FileSystemFileHandle {
  queryPermission?: (descriptor: { mode: 'read' }) => Promise<PermissionState>;
  requestPermission?: (descriptor: { mode: 'read' }) => Promise<PermissionState>;
}

async function ensureReadPermission(handle: FileSystemFileHandle): Promise<boolean> {
  const h = handle as PermissionableHandle;
  if (!h.queryPermission || !h.requestPermission) return true;
  if ((await h.queryPermission({ mode: 'read' })) === 'granted') return true;
  return (await h.requestPermission({ mode: 'read' })) === 'granted';
}

/**
 * Unified recent-files access for the File menu.
 *
 * Electron lists absolute paths from the main-process store; web lists entries
 * persisted in IndexedDB (with FileSystemFileHandles where available).
 * `openRecent` routes through the same loaders as the menu / drag-and-drop.
 */
export function useRecentFiles() {
  const { t } = useTranslation('common');
  const { loadXoscFromRead, loadXodrFromRead } = useFileOperations();
  const [items, setItems] = useState<RecentFileItem[]>([]);

  const refresh = useCallback(async () => {
    const electron = window.electronAPI;
    if (electron?.isElectron) {
      const paths = await electron.getRecentFiles();
      const mapped: RecentFileItem[] = [];
      for (const path of paths) {
        const name = path.split(/[/\\]/).pop() ?? path;
        const kind = kindFromFileName(name);
        if (!kind) continue;
        mapped.push({ id: path, name, kind, path });
      }
      setItems(mapped);
      return;
    }

    const entries: RecentFileEntry[] = await getWebRecentFiles();
    setItems(
      entries.map((e) => ({
        id: `${e.kind}:${e.name}:${e.timestamp}`,
        name: e.name,
        kind: e.kind,
        handle: e.handle,
      })),
    );
  }, []);

  const showInEditor = useCallback((kind: RecentFileKind) => {
    // Bare focus switch (no lifecycle cascade); the cascade lives in
    // switchEditorMode (use-app-lifecycle).
    useDocumentRegistry.getState().setFocusedBase(kind === 'xodr' ? 'roadNetwork' : 'scenario');
    if (useProjectStore.getState().currentView !== 'editor') {
      useProjectStore.getState().setView('editor');
    }
  }, []);

  const openRecent = useCallback(
    async (item: RecentFileItem) => {
      try {
        // Electron: read by absolute path.
        if (item.path && window.electronAPI?.isElectron) {
          const text = await window.electronAPI.readFile(item.path);
          const read = { text, name: item.name, filePath: item.path };
          const ok =
            item.kind === 'xosc' ? await loadXoscFromRead(read) : await loadXodrFromRead(read);
          if (ok) showInEditor(item.kind);
          return;
        }

        // Web with a persisted handle: re-permission then read.
        if (item.handle) {
          const granted = await ensureReadPermission(item.handle);
          if (!granted) return;
          const file = await item.handle.getFile();
          const text = await file.text();
          const read = { text, name: item.name, handle: item.handle };
          const ok =
            item.kind === 'xosc' ? await loadXoscFromRead(read) : await loadXodrFromRead(read);
          if (ok) showInEditor(item.kind);
          return;
        }

        // No way to re-open (web entry without a handle).
        toast.warning(t('fileErrors.openXoscFailed', { message: item.name }));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (item.kind === 'xodr') {
          toast.error(t('fileErrors.openXodrFailed', { message }));
        } else {
          toast.error(t('fileErrors.openXoscFailed', { message }));
        }
      }
    },
    [loadXoscFromRead, loadXodrFromRead, showInEditor, t],
  );

  const clearRecent = useCallback(async () => {
    if (window.electronAPI?.isElectron) {
      window.electronAPI.clearRecentFiles();
    } else {
      await clearWebRecentFiles();
    }
    setItems([]);
  }, []);

  return { items, refresh, openRecent, clearRecent };
}

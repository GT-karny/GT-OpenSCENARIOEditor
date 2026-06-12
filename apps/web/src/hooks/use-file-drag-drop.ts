import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import { useFileOperations } from './use-file-operations';
import { useEditorStore } from '../stores/editor-store';
import { useProjectStore } from '../stores/project-store';
import { kindFromFileName, type RecentFileKind } from '../lib/recent-files/recent-list';

/** A DataTransferItem augmented with the Chromium handle accessor. */
interface FileSystemDataTransferItem extends DataTransferItem {
  getAsFileSystemHandle?: () => Promise<FileSystemHandle | null>;
}

/**
 * Window-level drag-and-drop to open a single .xosc or .xodr file.
 *
 * Routing mirrors the menu open flow:
 * - Electron: resolve the dropped file's absolute path (`getPathForFile`) and
 *   read it via fs, so re-save reuses the path.
 * - Chromium web: try `getAsFileSystemHandle()` so re-save reuses the handle;
 *   otherwise fall back to reading file contents (re-save falls into Save As).
 *
 * Returns `isDragging` so the app can render a drop overlay.
 */
export function useFileDragDrop(): { isDragging: boolean } {
  const { t } = useTranslation('common');
  const { loadXoscFromRead, loadXodrFromRead } = useFileOperations();
  const [isDragging, setIsDragging] = useState(false);
  // Depth counter so nested dragenter/dragleave events don't flicker the overlay.
  const dragDepth = useRef(0);

  /** After a successful load, ensure the editor view + matching mode are active. */
  const showInEditor = useCallback((kind: RecentFileKind) => {
    useEditorStore.getState().setEditorMode(kind === 'xodr' ? 'roadNetwork' : 'scenario');
    if (useProjectStore.getState().currentView !== 'editor') {
      useProjectStore.getState().setView('editor');
    }
  }, []);

  const openDroppedFile = useCallback(
    async (file: File, item: FileSystemDataTransferItem | undefined) => {
      const kind = kindFromFileName(file.name);
      if (!kind) {
        toast.warning(t('dnd.unsupportedFile'));
        return;
      }

      // Electron: resolve absolute path so re-save reuses it.
      const electron = window.electronAPI;
      if (electron?.isElectron && electron.getPathForFile) {
        try {
          const filePath = electron.getPathForFile(file);
          if (filePath) {
            const text = await electron.readFile(filePath);
            const read = { text, name: file.name, filePath };
            const ok =
              kind === 'xosc' ? await loadXoscFromRead(read) : await loadXodrFromRead(read);
            if (ok) showInEditor(kind);
            return;
          }
        } catch {
          // Fall through to content-based read below.
        }
      }

      // Chromium: prefer a FileSystemFileHandle so re-save works like a normal open.
      let handle: FileSystemFileHandle | undefined;
      if (item?.getAsFileSystemHandle) {
        try {
          const h = await item.getAsFileSystemHandle();
          if (h && h.kind === 'file') handle = h as FileSystemFileHandle;
        } catch {
          // No handle available — fall back to plain contents.
        }
      }

      const text = await file.text();
      const read = { text, name: file.name, handle };
      const ok = kind === 'xosc' ? await loadXoscFromRead(read) : await loadXodrFromRead(read);
      if (ok) showInEditor(kind);
    },
    [loadXoscFromRead, loadXodrFromRead, showInEditor, t],
  );

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      dragDepth.current += 1;
      setIsDragging(true);
    };

    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };

    const onDragLeave = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsDragging(false);
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);

      const item = e.dataTransfer?.items?.[0] as FileSystemDataTransferItem | undefined;
      const file = e.dataTransfer?.files?.[0];
      if (file) void openDroppedFile(file, item);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [openDroppedFile]);

  return { isDragging };
}

import { useCallback } from 'react';
import { serializeCatalog } from '@osce/openscenario';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import { useCatalogStore } from '../stores/catalog-store';
import { useProjectStore } from '../stores/project-store';
import * as api from '../lib/project-api';

interface FilePickerOptions {
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
  suggestedName?: string;
}

declare global {
  interface Window {
    showOpenFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemFileHandle>;
  }
}

/** True for a path that names a fixed disk location (drive letter or root slash). */
function isAbsolutePath(p: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(p) || p.startsWith('/') || p.startsWith('\\');
}

async function readFileFromDisk(): Promise<{ text: string; name: string }> {
  if (window.showOpenFilePicker) {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'OpenSCENARIO Catalog files',
          accept: { 'application/xml': ['.xosc'] },
        },
      ],
    });
    const file = await handle.getFile();
    const text = await file.text();
    return { text, name: file.name };
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xosc';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      const text = await file.text();
      resolve({ text, name: file.name });
    };
    input.click();
  });
}

/**
 * Write catalog XML to disk. With `existingFilePath` (desktop only) it overwrites
 * that path with no prompt; otherwise it opens the platform save affordance
 * (Electron dialog / File System Access picker / download fallback).
 *
 * Returns `true` when written and `false` when the user cancelled the picker, so
 * the caller can skip the saved-baseline update on a cancel.
 */
async function writeCatalogToDisk(
  content: string,
  options: { suggestedName?: string; existingFilePath?: string },
): Promise<boolean> {
  const suggestedName = options.suggestedName ?? 'catalog.xosc';

  // Electron: overwrite in place when the path is known, else native dialog.
  if (window.electronAPI?.isElectron) {
    if (options.existingFilePath) {
      await window.electronAPI.writeFile(options.existingFilePath, content);
      return true;
    }
    const result = await window.electronAPI.showSaveDialog({
      defaultPath: suggestedName,
      filters: [{ name: 'OpenSCENARIO Catalog file', extensions: ['xosc'] }],
    });
    if (result.canceled || !result.filePath) return false;
    await window.electronAPI.writeFile(result.filePath, content);
    return true;
  }

  // File System Access API (Chromium).
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'OpenSCENARIO Catalog file',
            accept: { 'application/xml': ['.xosc'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return false;
      throw err;
    }
  }

  // Fallback: download link.
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export function useCatalogOperations() {
  const { t } = useTranslation('common');
  const loadCatalogToStore = useCatalogStore((s) => s.loadCatalog);
  const selectCatalog = useCatalogStore((s) => s.selectCatalog);

  const loadCatalogFile = useCallback(async () => {
    try {
      const { text, name } = await readFileFromDisk();
      const doc = loadCatalogToStore(text, name);
      selectCatalog(doc.catalogName);
      return doc;
    } catch {
      // User cancelled the file picker
      return null;
    }
  }, [loadCatalogToStore, selectCatalog]);

  /**
   * Save one catalog to disk, preferring an in-place overwrite (project file API
   * in project mode, known absolute path on desktop) and falling back to the save
   * picker. On success it records the saved baseline so the catalog reads clean.
   * Returns `false` when the write failed or the user cancelled.
   */
  const saveCatalogFile = useCallback(
    async (catalogName: string): Promise<boolean> => {
      const doc = useCatalogStore.getState().catalogs.get(catalogName);
      if (!doc) return false;
      try {
        const xml = serializeCatalog(doc);
        const sourcePath = doc._sourcePath;
        const project = useProjectStore.getState().currentProject;

        let written: boolean;
        if (project && sourcePath && !isAbsolutePath(sourcePath)) {
          // Project mode: overwrite the project-relative file in place (no UI).
          await api.writeProjectFile(project.meta.id, sourcePath, xml);
          written = true;
        } else if (sourcePath && isAbsolutePath(sourcePath) && window.electronAPI?.isElectron) {
          // Desktop with a known path: overwrite in place.
          written = await writeCatalogToDisk(xml, { existingFilePath: sourcePath });
        } else {
          // Otherwise prompt for a location.
          written = await writeCatalogToDisk(xml, { suggestedName: sourcePath ?? `${catalogName}.xosc` });
        }

        if (!written) return false; // user cancelled the picker/dialog
        useCatalogStore.getState().markCatalogSaved(catalogName);
        toast.success(t('labels.fileSaved'));
        return true;
      } catch (err) {
        console.error('Save catalog failed:', err);
        toast.error(t('labels.serializeFailed'));
        return false;
      }
    },
    [t],
  );

  /**
   * Save every currently-dirty catalog through {@link saveCatalogFile}. Returns
   * `false` as soon as one save fails or is cancelled (the unsaved-changes guard
   * in Wave E treats that as "do not proceed").
   */
  const saveAllDirtyCatalogs = useCallback(async (): Promise<boolean> => {
    const names = useCatalogStore.getState().dirtyCatalogNames();
    for (const name of names) {
      if (!(await saveCatalogFile(name))) return false;
    }
    return true;
  }, [saveCatalogFile]);

  return { loadCatalogFile, saveCatalogFile, saveAllDirtyCatalogs };
}

import { useCallback } from 'react';
import { serializeCatalog } from '@osce/openscenario';
import { useCatalogStore } from '../stores/catalog-store';

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

async function writeFileToDisk(content: string, suggestedName?: string): Promise<void> {
  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: suggestedName ?? 'catalog.xosc',
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
    return;
  }

  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName ?? 'catalog.xosc';
  a.click();
  URL.revokeObjectURL(url);
}

export function useCatalogOperations() {
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

  const saveCatalogFile = useCallback(async (catalogName: string) => {
    try {
      const doc = useCatalogStore.getState().catalogs.get(catalogName);
      if (!doc) return;
      const xml = serializeCatalog(doc);
      await writeFileToDisk(xml, doc._sourcePath ?? `${catalogName}.xosc`);
    } catch {
      // User cancelled the save picker
    }
  }, []);

  return { loadCatalogFile, saveCatalogFile };
}

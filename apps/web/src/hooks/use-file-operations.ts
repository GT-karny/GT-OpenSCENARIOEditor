import { useCallback } from 'react';
import { XoscParser, XoscSerializer } from '@osce/openscenario';
import { XodrParser } from '@osce/opendrive';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';

// File picker type definitions for File System Access API
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

async function readFileFromDisk(
  accept: string,
  extensions: string[],
): Promise<{ text: string; name: string }> {
  // Try File System Access API first (Chromium)
  if (window.showOpenFilePicker) {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: `${accept} files`,
          accept: { 'application/xml': extensions },
        },
      ],
    });
    const file = await handle.getFile();
    const text = await file.text();
    return { text, name: file.name };
  }

  // Fallback: hidden file input
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = extensions.join(',');
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

async function writeFileToDisk(
  content: string,
  extension: string,
  suggestedName?: string | null,
): Promise<void> {
  // Try File System Access API first (Chromium)
  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: suggestedName ?? `scenario${extension}`,
      types: [
        {
          description: `${extension} file`,
          accept: { 'application/xml': [extension] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    return;
  }

  // Fallback: download link
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName ?? `scenario${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}

export function useFileOperations() {
  const storeApi = useScenarioStoreApi();
  const setCurrentFileName = useEditorStore((s) => s.setCurrentFileName);
  const setDirty = useEditorStore((s) => s.setDirty);
  const setValidationResult = useEditorStore((s) => s.setValidationResult);
  const setRoadNetwork = useEditorStore((s) => s.setRoadNetwork);

  const newScenario = useCallback(() => {
    storeApi.getState().createScenario();
    setCurrentFileName(null);
    setDirty(false);
    setValidationResult(null);
    setRoadNetwork(null);
  }, [storeApi, setCurrentFileName, setDirty, setValidationResult, setRoadNetwork]);

  const openXosc = useCallback(async () => {
    try {
      const { text, name } = await readFileFromDisk('OpenSCENARIO', ['.xosc']);
      const parser = new XoscParser();
      const doc = parser.parse(text);

      // Reset store and load parsed document
      storeApi.getState().createScenario();
      storeApi.setState({ document: doc });
      setCurrentFileName(name);
      setDirty(false);
      setValidationResult(null);
    } catch {
      // User cancelled the file picker
    }
  }, [storeApi, setCurrentFileName, setDirty, setValidationResult]);

  const saveXosc = useCallback(async () => {
    try {
      const doc = storeApi.getState().document;
      const serializer = new XoscSerializer();
      const xml = serializer.serializeFormatted(doc);
      const currentName = useEditorStore.getState().currentFileName;
      await writeFileToDisk(xml, '.xosc', currentName);
      setDirty(false);
    } catch {
      // User cancelled the save picker
    }
  }, [storeApi, setDirty]);

  const loadXodr = useCallback(async () => {
    try {
      const { text } = await readFileFromDisk('OpenDRIVE', ['.xodr']);
      const parser = new XodrParser();
      const doc = parser.parse(text);
      setRoadNetwork(doc);
    } catch {
      // User cancelled the file picker
    }
  }, [setRoadNetwork]);

  return { newScenario, openXosc, saveXosc, loadXodr };
}

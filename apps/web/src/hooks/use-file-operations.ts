import { useCallback } from 'react';
import { XoscParser, XoscSerializer } from '@osce/openscenario';
import { XodrParser, XodrSerializer } from '@osce/opendrive';
import type { CatalogLocations } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import { useProjectStore } from '../stores/project-store';
import { useCatalogStore } from '../stores/catalog-store';
import { buildCatalogLocationsFromProject } from '../lib/catalog-location-utils';
import * as api from '../lib/project-api';

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
): Promise<{ text: string; name: string; filePath?: string }> {
  // Electron: use native dialog + Node.js fs
  if (window.electronAPI?.isElectron) {
    const result = await window.electronAPI.showOpenDialog({
      filters: [
        { name: `${accept} files`, extensions: extensions.map((e) => e.replace('.', '')) },
      ],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) throw new Error('Cancelled');
    const filePath = result.filePaths[0];
    const text = await window.electronAPI.readFile(filePath);
    const name = filePath.split(/[/\\]/).pop() ?? 'file';
    window.electronAPI.addRecentFile(filePath);
    return { text, name, filePath };
  }

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
  // Electron: use native dialog + Node.js fs
  if (window.electronAPI?.isElectron) {
    const result = await window.electronAPI.showSaveDialog({
      defaultPath: suggestedName ?? `scenario${extension}`,
      filters: [
        { name: `${extension} file`, extensions: [extension.replace('.', '')] },
      ],
    });
    if (result.canceled || !result.filePath) throw new Error('Cancelled');
    await window.electronAPI.writeFile(result.filePath, content);
    window.electronAPI.addRecentFile(result.filePath);
    return;
  }

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

function resolvePath(base: string, relative: string): string {
  const parts = `${base}/${relative}`.split(/[/\\]/);
  const resolved: string[] = [];
  for (const p of parts) {
    if (p === '..') resolved.pop();
    else if (p !== '.' && p !== '') resolved.push(p);
  }
  return resolved.join('/');
}

async function autoLoadCatalogs(
  xoscFilePath: string,
  catalogLocations: CatalogLocations,
): Promise<void> {
  const electronApi = window.electronAPI;
  if (!electronApi) return;

  const xoscDir = xoscFilePath.replace(/[/\\][^/\\]+$/, '');

  for (const loc of Object.values(catalogLocations)) {
    if (!loc?.directory) continue;

    const catalogDir = resolvePath(xoscDir, loc.directory);

    try {
      const files = await electronApi.readDir(catalogDir);
      const xoscFiles = files.filter((f) => f.endsWith('.xosc'));

      for (const fileName of xoscFiles) {
        try {
          const xml = await electronApi.readFile(`${catalogDir}/${fileName}`);
          useCatalogStore.getState().loadCatalog(xml, `${catalogDir}/${fileName}`);
        } catch {
          console.warn(`[autoLoadCatalogs] Failed to read: ${catalogDir}/${fileName}`);
        }
      }
    } catch {
      console.warn(`[autoLoadCatalogs] Failed to read directory: ${catalogDir}`);
    }
  }
}

export function useFileOperations() {
  const storeApi = useScenarioStoreApi();
  const { t } = useTranslation('common');
  const setCurrentFileName = useEditorStore((s) => s.setCurrentFileName);
  const setDirty = useEditorStore((s) => s.setDirty);
  const setValidationResult = useEditorStore((s) => s.setValidationResult);
  const setRoadNetwork = useEditorStore((s) => s.setRoadNetwork);
  const setShowSaveAs = useEditorStore((s) => s.setShowSaveAs);

  const newScenario = useCallback(() => {
    storeApi.getState().createScenario();

    // Auto-populate CatalogLocations in project mode
    const project = useProjectStore.getState().currentProject;
    if (project) {
      const currentFilePath = useProjectStore.getState().currentFilePath;
      const catalogLocations = buildCatalogLocationsFromProject(
        project.files,
        currentFilePath ?? '',
      );
      if (Object.keys(catalogLocations).length > 0) {
        const doc = storeApi.getState().document;
        storeApi.setState({ document: { ...doc, catalogLocations } });
      }
    }

    setCurrentFileName(null);
    setDirty(false);
    setValidationResult(null);
    setRoadNetwork(null, null);
  }, [storeApi, setCurrentFileName, setDirty, setValidationResult, setRoadNetwork]);

  const openXosc = useCallback(async () => {
    try {
      const { text, name, filePath } = await readFileFromDisk('OpenSCENARIO', ['.xosc']);
      const parser = new XoscParser();
      const doc = parser.parse(text);

      // Reset store and load parsed document
      storeApi.getState().createScenario();
      storeApi.setState({ document: doc });
      setCurrentFileName(name);
      setDirty(false);
      setValidationResult(null);

      // Electron: auto-load catalogs from CatalogLocations
      if (filePath && window.electronAPI?.isElectron) {
        await autoLoadCatalogs(filePath, doc.catalogLocations);
      }
    } catch {
      // User cancelled the file picker
    }
  }, [storeApi, setCurrentFileName, setDirty, setValidationResult]);

  const saveXosc = useCallback(async () => {
    const currentProject = useProjectStore.getState().currentProject;
    const currentFilePath = useProjectStore.getState().currentFilePath;

    // Project mode with known file: save via API (overwrite)
    if (currentProject && currentFilePath) {
      try {
        const doc = storeApi.getState().document;
        const serializer = new XoscSerializer();
        const xml = serializer.serializeFormatted(doc);
        await useProjectStore.getState().saveCurrentFile(xml);
        setDirty(false);
        toast.success(t('labels.fileSaved'));
      } catch (err) {
        console.error('Save failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
      return;
    }

    // Project mode without file path: open SaveAs dialog
    if (currentProject) {
      setShowSaveAs(true);
      return;
    }

    // Standalone mode: save to disk via file picker
    try {
      const doc = storeApi.getState().document;
      const serializer = new XoscSerializer();
      const xml = serializer.serializeFormatted(doc);
      const currentName = useEditorStore.getState().currentFileName;
      await writeFileToDisk(xml, '.xosc', currentName);
      setDirty(false);
      toast.success(t('labels.fileSaved'));
    } catch (err) {
      // AbortError = user cancelled the file picker
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Save failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
    }
  }, [storeApi, setDirty, setShowSaveAs, t]);

  const handleSaveAs = useCallback(
    async (relativePath: string) => {
      const currentProject = useProjectStore.getState().currentProject;
      if (!currentProject) return;

      const doc = storeApi.getState().document;
      const serializer = new XoscSerializer();
      const xml = serializer.serializeFormatted(doc);

      await api.writeProjectFile(currentProject.meta.id, relativePath, xml);

      // Update state to track the saved file path
      useProjectStore.setState({ currentFilePath: relativePath });
      const fileName = relativePath.split('/').pop() ?? relativePath;
      setCurrentFileName(fileName);
      setDirty(false);

      // Refresh project file list
      await useProjectStore.getState().refreshProject();

      toast.success(t('labels.fileSaved'));
    },
    [storeApi, setCurrentFileName, setDirty, t],
  );

  const saveAsXosc = useCallback(() => {
    setShowSaveAs(true);
  }, [setShowSaveAs]);

  const loadXodr = useCallback(async () => {
    try {
      const { text } = await readFileFromDisk('OpenDRIVE', ['.xodr']);
      const parser = new XodrParser();
      const doc = parser.parse(text);
      setRoadNetwork(doc, text);
    } catch {
      // User cancelled the file picker
    }
  }, [setRoadNetwork]);

  const saveXodr = useCallback(async () => {
    const roadNetwork = useEditorStore.getState().roadNetwork;
    if (!roadNetwork) {
      toast.error('No road network to save');
      return;
    }

    try {
      const serializer = new XodrSerializer();
      const xml = serializer.serializeFormatted(roadNetwork);
      await writeFileToDisk(xml, '.xodr', null);
      toast.success(t('labels.fileSaved'));
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Save .xodr failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
    }
  }, [t]);

  return { newScenario, openXosc, saveXosc, saveAsXosc, loadXodr, saveXodr, handleSaveAs };
}

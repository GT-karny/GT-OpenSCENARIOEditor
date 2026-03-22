import { useCallback } from 'react';
import { XoscParser, XoscSerializer } from '@osce/openscenario';
import { XodrParser, XodrSerializer } from '@osce/opendrive';
import {
  createDefaultDocument,
  serializeOsceJson,
  parseOsceJson,
  isOsceJsonFormat,
} from '@osce/opendrive-engine';
import type { CatalogLocations } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import { useProjectStore } from '../stores/project-store';
import { useCatalogStore } from '../stores/catalog-store';
import {
  buildCatalogLocationsFromProject,
  computeRelativeFilePath,
} from '../lib/catalog-location-utils';
import { editorMetadataStoreApi } from '../stores/editor-metadata-store-instance';
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

/** Result from reading a file */
interface ReadResult {
  text: string;
  name: string;
  filePath?: string;
  handle?: FileSystemFileHandle;
}

/** Result from writing a file */
interface WriteResult {
  handle?: FileSystemFileHandle;
  filePath?: string;
  fileName: string;
}

async function readFileFromDisk(accept: string, extensions: string[]): Promise<ReadResult> {
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
    return { text, name: file.name, handle };
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
  options?: {
    suggestedName?: string | null;
    existingHandle?: FileSystemFileHandle | null;
    existingFilePath?: string | null;
  },
): Promise<WriteResult> {
  const suggestedName = options?.suggestedName;
  const existingHandle = options?.existingHandle;
  const existingFilePath = options?.existingFilePath;
  const defaultName = suggestedName ?? `file${extension}`;

  // Electron: use native dialog + Node.js fs
  if (window.electronAPI?.isElectron) {
    // Overwrite-save: reuse existing file path
    if (existingFilePath) {
      await window.electronAPI.writeFile(existingFilePath, content);
      const fileName = existingFilePath.split(/[/\\]/).pop() ?? defaultName;
      return { filePath: existingFilePath, fileName };
    }
    const result = await window.electronAPI.showSaveDialog({
      defaultPath: defaultName,
      filters: [{ name: `${extension} file`, extensions: [extension.replace('.', '')] }],
    });
    if (result.canceled || !result.filePath) throw new Error('Cancelled');
    await window.electronAPI.writeFile(result.filePath, content);
    window.electronAPI.addRecentFile(result.filePath);
    const fileName = result.filePath.split(/[/\\]/).pop() ?? defaultName;
    return { filePath: result.filePath, fileName };
  }

  // File System Access API (Chromium)
  if (window.showSaveFilePicker) {
    // Overwrite-save: reuse existing handle
    if (existingHandle) {
      const writable = await existingHandle.createWritable();
      await writable.write(content);
      await writable.close();
      const file = await existingHandle.getFile();
      return { handle: existingHandle, fileName: file.name };
    }
    const handle = await window.showSaveFilePicker({
      suggestedName: defaultName,
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
    const file = await handle.getFile();
    return { handle, fileName: file.name };
  }

  // Fallback: download link
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultName;
  a.click();
  URL.revokeObjectURL(url);
  return { fileName: defaultName };
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

/**
 * Convert project-root-relative file references in the document to be relative
 * to the xosc file location, matching the OpenSCENARIO spec convention.
 *
 * Internal state stores paths relative to project root (e.g. "xodr/highway.xodr"),
 * but the spec expects paths relative to the .xosc file (e.g. "../xodr/highway.xodr").
 */
function convertPathsForSerialization(
  doc: import('@osce/shared').ScenarioDocument,
  xoscRelativePath: string,
): import('@osce/shared').ScenarioDocument {
  const xodrPath = useProjectStore.getState().currentXodrPath;
  if (!xodrPath || !doc.roadNetwork?.logicFile) return doc;

  const relativeXodrPath = computeRelativeFilePath(xoscRelativePath, xodrPath);

  // Only update if the path actually differs (avoid unnecessary cloning)
  if (doc.roadNetwork.logicFile.filepath === relativeXodrPath) return doc;

  return {
    ...doc,
    roadNetwork: {
      ...doc.roadNetwork,
      logicFile: { filepath: relativeXodrPath },
    },
  };
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
    useEditorStore.getState().setXoscFileHandle(null);
    useEditorStore.getState().setXoscFilePath(null);
  }, [storeApi, setCurrentFileName, setDirty, setValidationResult, setRoadNetwork]);

  const openXosc = useCallback(async () => {
    try {
      const { text, name, filePath, handle } = await readFileFromDisk('OpenSCENARIO', ['.xosc']);
      const parser = new XoscParser();
      const doc = parser.parse(text);

      // Reset store and load parsed document
      storeApi.getState().createScenario();
      storeApi.setState({ document: doc });
      setCurrentFileName(name);
      setDirty(false);
      setValidationResult(null);

      // Store handle/path for overwrite-save
      useEditorStore.getState().setXoscFileHandle(handle ?? null);
      useEditorStore.getState().setXoscFilePath(filePath ?? null);

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
        const doc = convertPathsForSerialization(
          storeApi.getState().document,
          currentFilePath,
        );
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
      useEditorStore.getState().setSaveAsFileType('xosc');
      setShowSaveAs(true);
      return;
    }

    // Standalone mode: save to disk (overwrite if handle/path exists)
    try {
      const doc = storeApi.getState().document;
      const serializer = new XoscSerializer();
      const xml = serializer.serializeFormatted(doc);
      const state = useEditorStore.getState();
      const result = await writeFileToDisk(xml, '.xosc', {
        suggestedName: state.currentFileName,
        existingHandle: state.xoscFileHandle,
        existingFilePath: state.xoscFilePath,
      });
      setCurrentFileName(result.fileName);
      if (result.handle) useEditorStore.getState().setXoscFileHandle(result.handle);
      if (result.filePath) useEditorStore.getState().setXoscFilePath(result.filePath);
      setDirty(false);
      toast.success(t('labels.fileSaved'));
    } catch (err) {
      // AbortError = user cancelled the file picker
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Save failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
    }
  }, [storeApi, setCurrentFileName, setDirty, setShowSaveAs, t]);

  const saveAsXosc = useCallback(async () => {
    const currentProject = useProjectStore.getState().currentProject;

    // Project mode: open SaveAs dialog
    if (currentProject) {
      useEditorStore.getState().setSaveAsFileType('xosc');
      setShowSaveAs(true);
      return;
    }

    // Standalone mode: always show file picker (no handle reuse)
    try {
      const doc = storeApi.getState().document;
      const serializer = new XoscSerializer();
      const xml = serializer.serializeFormatted(doc);
      const state = useEditorStore.getState();
      const result = await writeFileToDisk(xml, '.xosc', {
        suggestedName: state.currentFileName,
      });
      setCurrentFileName(result.fileName);
      if (result.handle) useEditorStore.getState().setXoscFileHandle(result.handle);
      if (result.filePath) useEditorStore.getState().setXoscFilePath(result.filePath);
      setDirty(false);
      toast.success(t('labels.fileSaved'));
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Save As failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
    }
  }, [storeApi, setCurrentFileName, setDirty, setShowSaveAs, t]);

  const handleSaveAs = useCallback(
    async (relativePath: string) => {
      const currentProject = useProjectStore.getState().currentProject;
      if (!currentProject) return;

      const doc = convertPathsForSerialization(
        storeApi.getState().document,
        relativePath,
      );
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

  // ---- OpenDRIVE (.xodr) operations ----

  const newOpenDrive = useCallback(() => {
    const doc = createDefaultDocument();
    setRoadNetwork(doc, null);
    useEditorStore.getState().setRoadNetworkFileName(null);
    useEditorStore.getState().setRoadNetworkDirty(false);
    useEditorStore.getState().setXodrFileHandle(null);
    useEditorStore.getState().setXodrFilePath(null);
  }, [setRoadNetwork]);

  const loadXodr = useCallback(async () => {
    try {
      const { text, name, filePath, handle } = await readFileFromDisk('OpenDRIVE', ['.xodr']);
      const parser = new XodrParser();
      const doc = parser.parse(text);
      setRoadNetwork(doc, text);
      useEditorStore.getState().setRoadNetworkFileName(name);
      useEditorStore.getState().setRoadNetworkDirty(false);
      useEditorStore.getState().setXodrFileHandle(handle ?? null);
      useEditorStore.getState().setXodrFilePath(filePath ?? null);
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

    const currentProject = useProjectStore.getState().currentProject;
    const currentXodrPath = useProjectStore.getState().currentXodrPath;

    // Project mode with known file: save via API (overwrite)
    if (currentProject && currentXodrPath) {
      try {
        const serializer = new XodrSerializer();
        const xml = serializer.serializeFormatted(roadNetwork);
        await api.writeProjectFile(currentProject.meta.id, currentXodrPath, xml);
        useEditorStore.getState().setRoadNetworkDirty(false);
        toast.success(t('labels.fileSaved'));
      } catch (err) {
        console.error('Save .xodr failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
      return;
    }

    // Project mode without file path: open SaveAs dialog
    if (currentProject) {
      useEditorStore.getState().setSaveAsFileType('xodr');
      setShowSaveAs(true);
      return;
    }

    // Standalone mode: save to disk (overwrite if handle/path exists)
    try {
      const serializer = new XodrSerializer();
      const xml = serializer.serializeFormatted(roadNetwork);
      const state = useEditorStore.getState();
      const result = await writeFileToDisk(xml, '.xodr', {
        suggestedName: state.roadNetworkFileName,
        existingHandle: state.xodrFileHandle,
        existingFilePath: state.xodrFilePath,
      });
      useEditorStore.getState().setRoadNetworkFileName(result.fileName);
      if (result.handle) useEditorStore.getState().setXodrFileHandle(result.handle);
      if (result.filePath) useEditorStore.getState().setXodrFilePath(result.filePath);
      useEditorStore.getState().setRoadNetworkDirty(false);
      toast.success(t('labels.fileSaved'));
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Save .xodr failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
    }
  }, [setShowSaveAs, t]);

  const saveAsXodr = useCallback(async () => {
    const roadNetwork = useEditorStore.getState().roadNetwork;
    if (!roadNetwork) {
      toast.error('No road network to save');
      return;
    }

    const currentProject = useProjectStore.getState().currentProject;

    // Project mode: open SaveAs dialog
    if (currentProject) {
      useEditorStore.getState().setSaveAsFileType('xodr');
      setShowSaveAs(true);
      return;
    }

    // Standalone mode: always show file picker (no handle reuse)
    try {
      const serializer = new XodrSerializer();
      const xml = serializer.serializeFormatted(roadNetwork);
      const state = useEditorStore.getState();
      const result = await writeFileToDisk(xml, '.xodr', {
        suggestedName: state.roadNetworkFileName,
      });
      useEditorStore.getState().setRoadNetworkFileName(result.fileName);
      if (result.handle) useEditorStore.getState().setXodrFileHandle(result.handle);
      if (result.filePath) useEditorStore.getState().setXodrFilePath(result.filePath);
      useEditorStore.getState().setRoadNetworkDirty(false);
      toast.success(t('labels.fileSaved'));
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Save As .xodr failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
    }
  }, [setShowSaveAs, t]);

  const handleSaveAsXodr = useCallback(
    async (relativePath: string) => {
      const currentProject = useProjectStore.getState().currentProject;
      if (!currentProject) return;

      const roadNetwork = useEditorStore.getState().roadNetwork;
      if (!roadNetwork) return;

      const serializer = new XodrSerializer();
      const xml = serializer.serializeFormatted(roadNetwork);

      await api.writeProjectFile(currentProject.meta.id, relativePath, xml);

      // Update state to track the saved file path
      useProjectStore.setState({ currentXodrPath: relativePath });
      const fileName = relativePath.split('/').pop() ?? relativePath;
      useEditorStore.getState().setRoadNetworkFileName(fileName);
      useEditorStore.getState().setRoadNetworkDirty(false);

      // Refresh project file list
      await useProjectStore.getState().refreshProject();

      toast.success(t('labels.fileSaved'));
    },
    [t],
  );

  // ---- .osce.json (editor format) operations ----

  /** Load .osce.json or .xodr (auto-detect format) */
  const loadOpenDrive = useCallback(async () => {
    try {
      const { text, name, filePath, handle } = await readFileFromDisk(
        'OpenDRIVE / OSCE Editor',
        ['.xodr', '.osce.json'],
      );

      if (name.endsWith('.osce.json') || isOsceJsonFormat(text)) {
        // .osce.json format
        const result = parseOsceJson(text);
        setRoadNetwork(result.document, null);
        useEditorStore.getState().setRoadNetworkFileName(name);
        useEditorStore.getState().setRoadNetworkDirty(false);
        useEditorStore.getState().setOsceFileHandle(handle ?? null);
        useEditorStore.getState().setOsceFilePath(filePath ?? null);
        // Clear xodr handles since we loaded osce
        useEditorStore.getState().setXodrFileHandle(null);
        useEditorStore.getState().setXodrFilePath(null);
        editorMetadataStoreApi.getState().loadMetadata(result.metadata);
      } else {
        // .xodr format
        const parser = new XodrParser();
        const doc = parser.parse(text);
        setRoadNetwork(doc, text);
        useEditorStore.getState().setRoadNetworkFileName(name);
        useEditorStore.getState().setRoadNetworkDirty(false);
        useEditorStore.getState().setXodrFileHandle(handle ?? null);
        useEditorStore.getState().setXodrFilePath(filePath ?? null);
        // Clear osce handles since we loaded xodr
        useEditorStore.getState().setOsceFileHandle(null);
        useEditorStore.getState().setOsceFilePath(null);
      }
    } catch {
      // User cancelled the file picker
    }
  }, [setRoadNetwork]);

  /** Save as .osce.json (editor format, preserves metadata) */
  const saveOsce = useCallback(async () => {
    const roadNetwork = useEditorStore.getState().roadNetwork;
    if (!roadNetwork) {
      toast.error('No road network to save');
      return;
    }

    try {
      const metadata = editorMetadataStoreApi.getState().getMetadata();
      const json = serializeOsceJson(roadNetwork, metadata);
      const state = useEditorStore.getState();
      const result = await writeFileToDisk(json, '.osce.json', {
        suggestedName: state.roadNetworkFileName?.replace(/\.xodr$/, '') ?? 'road-network',
        existingHandle: state.osceFileHandle,
        existingFilePath: state.osceFilePath,
      });
      useEditorStore.getState().setRoadNetworkFileName(result.fileName);
      if (result.handle) useEditorStore.getState().setOsceFileHandle(result.handle);
      if (result.filePath) useEditorStore.getState().setOsceFilePath(result.filePath);
      useEditorStore.getState().setRoadNetworkDirty(false);
      toast.success(t('labels.fileSaved'));
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Save .osce.json failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
    }
  }, [t]);

  /** Export as .xodr (OpenDRIVE standard, for external tools) */
  const exportXodr = useCallback(async () => {
    const roadNetwork = useEditorStore.getState().roadNetwork;
    if (!roadNetwork) {
      toast.error('No road network to export');
      return;
    }

    try {
      const serializer = new XodrSerializer();
      const xml = serializer.serializeFormatted(roadNetwork);
      const state = useEditorStore.getState();
      const baseName = state.roadNetworkFileName?.replace(/\.(osce\.json|xodr)$/, '') ?? 'export';
      await writeFileToDisk(xml, '.xodr', {
        suggestedName: `${baseName}.xodr`,
      });
      toast.success('Exported as .xodr');
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Export .xodr failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
    }
  }, [t]);

  return {
    newScenario,
    openXosc,
    saveXosc,
    saveAsXosc,
    loadXodr,
    saveXodr,
    saveAsXodr,
    handleSaveAs,
    handleSaveAsXodr,
    newOpenDrive,
    loadOpenDrive,
    saveOsce,
    exportXodr,
  };
}

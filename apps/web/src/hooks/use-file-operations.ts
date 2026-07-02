import { useCallback } from 'react';
import { XoscParser, XoscSerializer } from '@osce/openscenario';
import { XodrParser, XodrSerializer } from '@osce/opendrive';
import {
  createDefaultDocument,
  buildAssembliesFromDocument,
} from '@osce/opendrive-engine';
import type { CatalogLocations, ScenarioDocument } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import { runValidationOnDocument } from './use-validation';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import { useProjectStore } from '../stores/project-store';
import { useCatalogStore } from '../stores/catalog-store';
import {
  buildCatalogLocationsFromProject,
  computeRelativeFilePath,
} from '../lib/catalog-location-utils';
import { editorMetadataStoreApi } from '../stores/editor-metadata-store-instance';
import { useAppLifecycle } from './use-app-lifecycle';
import * as api from '../lib/project-api';
import { resolveCatalogEntityTypes } from '../lib/resolve-catalog-entity-types';
import { addWebRecentFile } from '../lib/recent-files/recent-files-db';
import type { RecentFileKind } from '../lib/recent-files/recent-list';

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

/**
 * Error thrown when the user cancels a file picker / dialog.
 * Callers treat this as a silent no-op (no toast), matching the native
 * `AbortError` raised by the File System Access API.
 */
class FilePickerCancelledError extends Error {
  constructor() {
    super('Cancelled');
    this.name = 'AbortError';
  }
}

/** True when an error represents a user-cancelled picker (must stay silent). */
function isCancelError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

/** Extract a concise, displayable message from an unknown error. */
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Register a successfully-opened file into the recents list.
 * Electron tracks absolute paths via IPC; web persists FileSystemFileHandles
 * (when available) in IndexedDB so re-save can reuse the handle.
 */
function registerRecentFile(
  read: Pick<ReadResult, 'name' | 'filePath' | 'handle'>,
  kind: RecentFileKind,
): void {
  if (window.electronAPI?.isElectron) {
    if (read.filePath) window.electronAPI.addRecentFile(read.filePath);
    return;
  }
  void addWebRecentFile({
    name: read.name,
    kind,
    timestamp: Date.now(),
    handle: read.handle,
  });
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
    if (result.canceled || !result.filePaths[0]) throw new FilePickerCancelledError();
    const filePath = result.filePaths[0];
    const text = await window.electronAPI.readFile(filePath);
    const name = filePath.split(/[/\\]/).pop() ?? 'file';
    // Recent-file registration happens centrally after a successful parse
    // (covers menu open, drag-and-drop, and recent reopen uniformly).
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
        reject(new FilePickerCancelledError());
        return;
      }
      const text = await file.text();
      resolve({ text, name: file.name });
    };
    input.oncancel = () => reject(new FilePickerCancelledError());
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
    if (result.canceled || !result.filePath) throw new FilePickerCancelledError();
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

/**
 * Auto-load catalog .xosc files referenced by CatalogLocations (Electron only).
 * Returns the list of catalog files that failed to read/parse so the caller can
 * surface a non-blocking warning toast.
 */
async function autoLoadCatalogs(
  xoscFilePath: string,
  catalogLocations: CatalogLocations,
): Promise<{ failed: string[] }> {
  const electronApi = window.electronAPI;
  if (!electronApi) return { failed: [] };

  const xoscDir = xoscFilePath.replace(/[/\\][^/\\]+$/, '');
  const failed: string[] = [];

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
          failed.push(fileName);
        }
      }
    } catch {
      console.warn(`[autoLoadCatalogs] Failed to read directory: ${catalogDir}`);
    }
  }

  return { failed };
}

export function useFileOperations() {
  const storeApi = useScenarioStoreApi();
  const { t } = useTranslation('common');
  const { resetForNewFile, resetForNewRoadNetwork } = useAppLifecycle();
  const setCurrentFileName = useEditorStore((s) => s.setCurrentFileName);
  const setDirty = useEditorStore((s) => s.setDirty);
  const setValidationResult = useEditorStore((s) => s.setValidationResult);
  const setRoadNetwork = useEditorStore((s) => s.setRoadNetwork);
  const setShowSaveAs = useEditorStore((s) => s.setShowSaveAs);

  /**
   * Auto-validate a scenario before it is serialized/written.
   *
   * When the autoValidate preference is off this is a no-op that always allows
   * the save. Otherwise it validates `doc`, publishes the result so the panel and
   * status bar update, and gates the save:
   * - errors: park a confirmation request in the store and await the user's
   *   choice (Save Anyway / Cancel). Returns the decision.
   * - warnings only: surface a single non-blocking toast and allow the save.
   * - clean: allow silently.
   *
   * Returns `true` when the caller should proceed with the write.
   */
  const gateSaveWithValidation = useCallback(
    (doc: ScenarioDocument): Promise<boolean> => {
      const { preferences } = useEditorStore.getState();
      if (!preferences.autoValidate) return Promise.resolve(true);

      const result = runValidationOnDocument(doc);
      setValidationResult(result);

      if (result.errors.length > 0) {
        return new Promise<boolean>((resolve) => {
          useEditorStore.getState().setValidationConfirm({
            errors: result.errors,
            resolve,
          });
        });
      }

      if (result.warnings.length > 0) {
        toast.warning(t('validationToast.warnings', { count: result.warnings.length }));
      }
      return Promise.resolve(true);
    },
    [setValidationResult, t],
  );

  const newScenario = useCallback(() => {
    resetForNewFile();
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
  }, [storeApi, resetForNewFile, setCurrentFileName, setDirty, setValidationResult, setRoadNetwork]);

  /**
   * Load an already-read .xosc source into the editor. Shared by the menu
   * picker (openXosc) and drag-and-drop. Parse/IO failures surface a toast;
   * the caller handles picker-cancellation separately.
   * Returns true on success so callers can switch to the editor view.
   */
  const loadXoscFromRead = useCallback(
    async ({ text, name, filePath, handle }: ReadResult): Promise<boolean> => {
      try {
        const parser = new XoscParser();
        const doc = parser.parse(text);

        // Reset all transient state and load parsed document
        resetForNewFile();
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
          const { failed } = await autoLoadCatalogs(filePath, doc.catalogLocations);
          resolveCatalogEntityTypes(storeApi);
          if (failed.length > 0) {
            toast.warning(t('fileErrors.catalogAutoLoadFailed', { files: failed.join(', ') }));
          }
        }

        registerRecentFile({ name, filePath, handle }, 'xosc');
        return true;
      } catch (err) {
        console.error('Open .xosc failed:', err);
        toast.error(t('fileErrors.openXoscFailed', { message: errorMessage(err) }));
        return false;
      }
    },
    [storeApi, resetForNewFile, setCurrentFileName, setDirty, setValidationResult, t],
  );

  const openXosc = useCallback(async () => {
    let read: ReadResult;
    try {
      read = await readFileFromDisk('OpenSCENARIO', ['.xosc']);
    } catch (err) {
      // Picker cancellation stays silent; real failures are surfaced below.
      if (!isCancelError(err)) {
        console.error('Open .xosc failed:', err);
        toast.error(t('fileErrors.openXoscFailed', { message: errorMessage(err) }));
      }
      return;
    }
    await loadXoscFromRead(read);
  }, [loadXoscFromRead, t]);

  const saveXosc = useCallback(async () => {
    const currentProject = useProjectStore.getState().currentProject;
    const currentFilePath = useProjectStore.getState().currentFilePath;

    // Project mode with known file: save via API (overwrite)
    if (currentProject && currentFilePath) {
      try {
        if (!(await gateSaveWithValidation(storeApi.getState().document))) return;
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
      if (!(await gateSaveWithValidation(doc))) return;
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
  }, [storeApi, setCurrentFileName, setDirty, setShowSaveAs, gateSaveWithValidation, t]);

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
      if (!(await gateSaveWithValidation(doc))) return;
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
  }, [storeApi, setCurrentFileName, setDirty, setShowSaveAs, gateSaveWithValidation, t]);

  const handleSaveAs = useCallback(
    async (relativePath: string) => {
      const currentProject = useProjectStore.getState().currentProject;
      if (!currentProject) return;

      if (!(await gateSaveWithValidation(storeApi.getState().document))) return;
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
    [storeApi, setCurrentFileName, setDirty, gateSaveWithValidation, t],
  );

  // ---- OpenDRIVE (.xodr) operations ----

  const newOpenDrive = useCallback(() => {
    resetForNewRoadNetwork();
    const doc = createDefaultDocument();
    setRoadNetwork(doc, null);
    useEditorStore.getState().setRoadNetworkFileName(null);
    useEditorStore.getState().setRoadNetworkDirty(false);
    useEditorStore.getState().setXodrFileHandle(null);
    useEditorStore.getState().setXodrFilePath(null);
  }, [resetForNewRoadNetwork, setRoadNetwork]);

  /**
   * Load an already-read .xodr source into the editor. Shared by the menu
   * picker (loadXodr) and drag-and-drop. Parse/IO failures surface a toast.
   * Returns true on success so callers can switch to the editor view.
   */
  const loadXodrFromRead = useCallback(
    async ({ text, name, filePath, handle }: ReadResult): Promise<boolean> => {
      try {
        const parser = new XodrParser();
        const doc = parser.parse(text);
        resetForNewRoadNetwork();
        setRoadNetwork(doc, text);
        useEditorStore.getState().setRoadNetworkFileName(name);
        useEditorStore.getState().setRoadNetworkDirty(false);
        useEditorStore.getState().setXodrFileHandle(handle ?? null);
        useEditorStore.getState().setXodrFilePath(filePath ?? null);
        // Reconstruct signal assemblies from signal→object references
        const assemblies = buildAssembliesFromDocument(doc);
        if (assemblies.length > 0) {
          const meta = editorMetadataStoreApi.getState().getMetadata();
          editorMetadataStoreApi.getState().loadMetadata({
            ...meta,
            signalAssemblies: assemblies,
          });
        }

        registerRecentFile({ name, filePath, handle }, 'xodr');
        return true;
      } catch (err) {
        console.error('Open .xodr failed:', err);
        toast.error(t('fileErrors.openXodrFailed', { message: errorMessage(err) }));
        return false;
      }
    },
    [resetForNewRoadNetwork, setRoadNetwork, t],
  );

  const loadXodr = useCallback(async () => {
    let read: ReadResult;
    try {
      read = await readFileFromDisk('OpenDRIVE', ['.xodr']);
    } catch (err) {
      if (!isCancelError(err)) {
        console.error('Open .xodr failed:', err);
        toast.error(t('fileErrors.openXodrFailed', { message: errorMessage(err) }));
      }
      return;
    }
    await loadXodrFromRead(read);
  }, [loadXodrFromRead, t]);

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
    // Lower-level loaders shared with drag-and-drop and recent-files reopen.
    loadXoscFromRead,
    loadXodrFromRead,
  };
}

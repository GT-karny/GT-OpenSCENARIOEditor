import { useCallback, useRef } from 'react';
import {
  XoscParser,
  XoscSerializer,
  XoscRootMismatchError,
  parseParameterValueDistributionXml,
  serializeParameterValueDistributionFormatted,
} from '@osce/openscenario';
import { XodrParser, XodrSerializer } from '@osce/opendrive';
import { createDefaultDocument, buildAssembliesFromDocument } from '@osce/opendrive-engine';
import type { CatalogLocations, ScenarioDocument } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import { runValidationOnDocument } from './use-validation';
import { getOpenDriveStoreApi } from './use-opendrive-store';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import { useDocumentRegistry } from '../stores/document-registry';
import { useProjectStore } from '../stores/project-store';
import { useCatalogStore } from '../stores/catalog-store';
import { useDistributionStore } from '../stores/distribution-store';
import { buildCatalogLocationsFromProject } from '../lib/catalog-location-utils';
import {
  reconcileLogicFileForSave,
  syncLogicFileAfterRoadSaveAs,
} from '../lib/document-references';
import { editorMetadataStoreApi } from '../stores/editor-metadata-store-instance';
import { useAppLifecycle } from './use-app-lifecycle';
import { useCatalogOperations } from './use-catalog-operations';
import * as api from '../lib/project-api';
import { resolveCatalogEntityTypes } from '../lib/resolve-catalog-entity-types';
import { addWebRecentFile } from '../lib/recent-files/recent-files-db';
import type { RecentFileKind } from '../lib/recent-files/recent-list';
import { documentHasInclude } from '../lib/wasm';
import { runUnsavedGuard as runUnsavedGuardGate } from './use-discard-guard';

/**
 * Warn (non-blocking) when saving an OpenDRIVE document that uses <include>
 * references: the GT_Sim simulator treats <include> as a hard load error, so the
 * saved file will not simulate. Authoring/exporting is still allowed.
 */
function warnIfXodrHasInclude(roadNetwork: unknown): void {
  if (documentHasInclude(roadNetwork as Parameters<typeof documentHasInclude>[0])) {
    toast.warning(
      'Saved OpenDRIVE uses <include> references — it will NOT load in the simulator. ' +
        'Resolve/inline the includes to simulate this map.',
    );
  }
}

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
      filters: [{ name: `${accept} files`, extensions: extensions.map((e) => e.replace('.', '')) }],
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
  const { saveAllDirtyCatalogs } = useCatalogOperations();
  const setCurrentFileName = useEditorStore((s) => s.setCurrentFileName);
  const setValidationResult = useEditorStore((s) => s.setValidationResult);
  const setRoadNetwork = useEditorStore((s) => s.setRoadNetwork);
  const setShowSaveAs = useEditorStore((s) => s.setShowSaveAs);

  // Holds the current save flows so the unsaved-changes guard can invoke them
  // without depending on their declaration order (they are defined below).
  const saveFnsRef = useRef<{
    saveXosc: () => Promise<void>;
    saveXodr: () => Promise<void>;
    saveCatalogs: () => Promise<boolean>;
    saveDistribution: () => Promise<boolean>;
  }>({
    saveXosc: async () => {},
    saveXodr: async () => {},
    saveCatalogs: async () => true,
    saveDistribution: async () => true,
  });

  // Gate a document-replacing action (new / open / drop / reopen) behind the
  // shared unsaved-changes guard, saving via the current save flows on "Save".
  const runUnsavedGuard = useCallback(
    () =>
      runUnsavedGuardGate({
        saveXosc: () => saveFnsRef.current.saveXosc(),
        saveXodr: () => saveFnsRef.current.saveXodr(),
        saveCatalogs: () => saveFnsRef.current.saveCatalogs(),
        saveDistribution: () => saveFnsRef.current.saveDistribution(),
      }),
    [],
  );

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

  const newScenario = useCallback(async () => {
    if (!(await runUnsavedGuard())) return;
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
    // Fresh document: capture the post-create revision as the clean baseline.
    useDocumentRegistry.getState().markLoaded('scenario');
    setValidationResult(null);
    setRoadNetwork(null);
    useEditorStore.getState().setRoadNetworkRawXml(null);
    useEditorStore.getState().setXoscFileHandle(null);
    useEditorStore.getState().setXoscFilePath(null);
  }, [
    storeApi,
    resetForNewFile,
    setCurrentFileName,
    setValidationResult,
    setRoadNetwork,
    runUnsavedGuard,
  ]);

  /**
   * Load an already-read .xosc source into the editor. Shared by the menu
   * picker (openXosc) and drag-and-drop. Parse/IO failures surface a toast;
   * the caller handles picker-cancellation separately.
   * Returns true on success so callers can switch to the editor view.
   */
  const loadXoscFromRead = useCallback(
    async (
      { text, name, filePath, handle }: ReadResult,
      options?: { skipGuard?: boolean },
    ): Promise<boolean> => {
      // Guard against replacing unsaved changes (drag-drop / recent reopen call
      // this directly; the menu picker guards earlier and passes skipGuard).
      if (!options?.skipGuard && !(await runUnsavedGuard())) return false;
      try {
        const parser = new XoscParser();
        const doc = parser.parse(text);

        // Reset all transient state and load parsed document
        resetForNewFile();
        storeApi.getState().createScenario();
        storeApi.setState({ document: doc });
        setCurrentFileName(name);
        // Loaded document = clean baseline (history was cleared by createScenario).
        useDocumentRegistry.getState().markLoaded('scenario');
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
        // The <OpenSCENARIO> root is a catalog or parameter-distribution
        // document, not a scenario. Route to the correct handler instead of
        // silently loading an empty scenario.
        if (err instanceof XoscRootMismatchError) {
          if (err.rootKind === 'parameterValueDistribution') {
            try {
              const doc = parseParameterValueDistributionXml(text);
              if (filePath) doc._sourcePath = filePath;
              useDistributionStore.getState().loadDocument(doc);
              const entryCount =
                doc.distribution.kind === 'deterministic'
                  ? doc.distribution.entries.length
                  : doc.distribution.distributions.length;
              toast.success(
                t('distributions.loaded', {
                  count: entryCount,
                  filepath: doc.scenarioFilepath || '—',
                }),
              );
              registerRecentFile({ name, filePath, handle }, 'xosc');
              return true;
            } catch (parseErr) {
              console.error('Parse parameter distribution failed:', parseErr);
              toast.error(t('fileErrors.openXoscFailed', { message: errorMessage(parseErr) }));
              return false;
            }
          }
          // Catalog documents must be opened through the catalog manager.
          toast.error(t('fileErrors.catalogRootMismatch'));
          return false;
        }
        console.error('Open .xosc failed:', err);
        toast.error(t('fileErrors.openXoscFailed', { message: errorMessage(err) }));
        return false;
      }
    },
    [storeApi, resetForNewFile, setCurrentFileName, setValidationResult, t, runUnsavedGuard],
  );

  const openXosc = useCallback(async () => {
    // Prompt before opening the picker so the user isn't asked to pick a file
    // they may then abandon at the unsaved-changes prompt.
    if (!(await runUnsavedGuard())) return;
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
    await loadXoscFromRead(read, { skipGuard: true });
  }, [loadXoscFromRead, t, runUnsavedGuard]);

  const saveXosc = useCallback(async () => {
    const currentProject = useProjectStore.getState().currentProject;
    const currentFilePath = useProjectStore.getState().currentFilePath;

    // Project mode with known file: save via API (overwrite)
    if (currentProject && currentFilePath) {
      try {
        if (!(await gateSaveWithValidation(storeApi.getState().document))) return;
        // In-place save: pass no previousXoscRelativePath, so any divergence
        // beyond the recognized internal form warns (the path did not move).
        const reconciled = reconcileLogicFileForSave(
          storeApi.getState().document,
          currentFilePath,
          useProjectStore.getState().currentXodrPath,
        );
        if (reconciled.inconsistent) {
          toast.warning(t('warnings.logicFileCorrected', { path: reconciled.correctedPath }));
        }
        const serializer = new XoscSerializer();
        const xml = serializer.serializeFormatted(reconciled.doc);
        await useProjectStore.getState().saveCurrentFile(xml);
        useDocumentRegistry.getState().markSaved('scenario');
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
      useDocumentRegistry.getState().markSaved('scenario');
      toast.success(t('labels.fileSaved'));
    } catch (err) {
      // AbortError = user cancelled the file picker
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Save failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
    }
  }, [storeApi, setCurrentFileName, setShowSaveAs, gateSaveWithValidation, t]);

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
      useDocumentRegistry.getState().markSaved('scenario');
      toast.success(t('labels.fileSaved'));
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Save As failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
    }
  }, [storeApi, setCurrentFileName, setShowSaveAs, gateSaveWithValidation, t]);

  const handleSaveAs = useCallback(
    async (relativePath: string) => {
      const currentProject = useProjectStore.getState().currentProject;
      if (!currentProject) return;

      if (!(await gateSaveWithValidation(storeApi.getState().document))) return;
      // Scenario Save-As moves the file: pass the pre-move path (read before the
      // currentFilePath update below) so a reference that was correct for the old
      // location is recomputed silently rather than warned.
      const reconciled = reconcileLogicFileForSave(
        storeApi.getState().document,
        relativePath,
        useProjectStore.getState().currentXodrPath,
        { previousXoscRelativePath: useProjectStore.getState().currentFilePath },
      );
      if (reconciled.inconsistent) {
        toast.warning(t('warnings.logicFileCorrected', { path: reconciled.correctedPath }));
      }
      const serializer = new XoscSerializer();
      const xml = serializer.serializeFormatted(reconciled.doc);

      await api.writeProjectFile(currentProject.meta.id, relativePath, xml);

      // Update state to track the saved file path
      useProjectStore.setState({ currentFilePath: relativePath });
      const fileName = relativePath.split('/').pop() ?? relativePath;
      setCurrentFileName(fileName);
      useDocumentRegistry.getState().markSaved('scenario');

      // Refresh project file list
      await useProjectStore.getState().refreshProject();

      toast.success(t('labels.fileSaved'));
    },
    [storeApi, setCurrentFileName, gateSaveWithValidation, t],
  );

  /**
   * Serialize the current parameter value distribution side-document and save it
   * as a standalone `.xosc`. Reuses the same disk-writer plumbing as the
   * scenario. When the document has no `scenarioFilepath`, it is defaulted to
   * the current scenario file name so the exported file references its base.
   *
   * Returns true when written and false when there is nothing to export or the
   * user cancelled/failed the picker, so the unsaved-changes guard can detect it.
   */
  const saveDistribution = useCallback(async (): Promise<boolean> => {
    const doc = useDistributionStore.getState().document;
    if (!doc) {
      toast.error(t('distributions.nothingToExport'));
      return false;
    }

    // Default the referenced scenario path from the open scenario when unset.
    const scenarioFilepath =
      doc.scenarioFilepath || useEditorStore.getState().currentFileName || '';
    const docToSave =
      scenarioFilepath === doc.scenarioFilepath ? doc : { ...doc, scenarioFilepath };
    if (scenarioFilepath !== doc.scenarioFilepath) {
      useDistributionStore.getState().setScenarioFilepath(scenarioFilepath);
    }

    try {
      const xml = serializeParameterValueDistributionFormatted(docToSave);
      const suggestedName = useEditorStore.getState().currentFileName
        ? `${useEditorStore.getState().currentFileName?.replace(/\.xosc$/i, '')}.pvd.xosc`
        : 'distribution.xosc';
      await writeFileToDisk(xml, '.xosc', { suggestedName });
      // Capture the post-write revision (including the scenarioFilepath default
      // command above) as the clean baseline.
      useDocumentRegistry.getState().markSaved('distribution');
      toast.success(t('labels.fileSaved'));
      return true;
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Export distribution failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
      return false;
    }
  }, [t]);

  // ---- OpenDRIVE (.xodr) operations ----

  const newOpenDrive = useCallback(async () => {
    if (!(await runUnsavedGuard())) return;
    resetForNewRoadNetwork();
    const doc = createDefaultDocument();
    setRoadNetwork(doc);
    useEditorStore.getState().setRoadNetworkRawXml(null);
    useEditorStore.getState().setRoadNetworkFileName(null);
    // markLoaded('roadNetwork') is handled by resetForNewRoadNetwork (registry
    // reset) and re-affirmed by the RoadNetworkEditorLayout load effect.
    useEditorStore.getState().setXodrFileHandle(null);
    useEditorStore.getState().setXodrFilePath(null);
  }, [resetForNewRoadNetwork, setRoadNetwork, runUnsavedGuard]);

  /**
   * Load an already-read .xodr source into the editor. Shared by the menu
   * picker (loadXodr) and drag-and-drop. Parse/IO failures surface a toast.
   * Returns true on success so callers can switch to the editor view.
   */
  const loadXodrFromRead = useCallback(
    async (
      { text, name, filePath, handle }: ReadResult,
      options?: { skipGuard?: boolean },
    ): Promise<boolean> => {
      // Guard against replacing unsaved changes (drag-drop / recent reopen call
      // this directly; the menu picker guards earlier and passes skipGuard).
      if (!options?.skipGuard && !(await runUnsavedGuard())) return false;
      try {
        const parser = new XodrParser();
        const doc = parser.parse(text);
        resetForNewRoadNetwork();
        setRoadNetwork(doc);
        // Provisional stamp: until road-mode entry runs auto-correction and
        // re-stamps, the odr history does not move, so tagging with the current
        // revision keeps the verbatim text on the lossless simulation path.
        useEditorStore.getState().setRoadNetworkRawXml({
          text,
          validForRevision: getOpenDriveStoreApi().getState().getCommandHistory().getRevision(),
        });
        useEditorStore.getState().setRoadNetworkFileName(name);
        // The RoadNetworkEditorLayout load effect re-stamps the cache at the
        // post-load, post-auto-correction revision and captures that clean
        // baseline in the registry (markLoaded).
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
    [resetForNewRoadNetwork, setRoadNetwork, t, runUnsavedGuard],
  );

  const loadXodr = useCallback(async () => {
    // Prompt before opening the picker (see openXosc).
    if (!(await runUnsavedGuard())) return;
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
    await loadXodrFromRead(read, { skipGuard: true });
  }, [loadXodrFromRead, t, runUnsavedGuard]);

  const saveXodr = useCallback(async () => {
    const roadNetwork = useEditorStore.getState().roadNetwork;
    if (!roadNetwork) {
      toast.error('No road network to save');
      return;
    }
    warnIfXodrHasInclude(roadNetwork);

    const currentProject = useProjectStore.getState().currentProject;
    const currentXodrPath = useProjectStore.getState().currentXodrPath;

    // Project mode with known file: save via API (overwrite)
    if (currentProject && currentXodrPath) {
      try {
        const serializer = new XodrSerializer();
        const xml = serializer.serializeFormatted(roadNetwork);
        await api.writeProjectFile(currentProject.meta.id, currentXodrPath, xml);
        // The just-written text is now the authoritative verbatim source: stamp
        // it at the current revision so simulation returns to the lossless path.
        useEditorStore.getState().setRoadNetworkRawXml({
          text: xml,
          validForRevision: getOpenDriveStoreApi().getState().getCommandHistory().getRevision(),
        });
        useDocumentRegistry.getState().markSaved('roadNetwork');
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
      // The just-written text is now the authoritative verbatim source: stamp it
      // at the current revision so simulation returns to the lossless path.
      useEditorStore.getState().setRoadNetworkRawXml({
        text: xml,
        validForRevision: getOpenDriveStoreApi().getState().getCommandHistory().getRevision(),
      });
      useDocumentRegistry.getState().markSaved('roadNetwork');
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
    warnIfXodrHasInclude(roadNetwork);

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
      // The just-written text is now the authoritative verbatim source: stamp it
      // at the current revision so simulation returns to the lossless path.
      useEditorStore.getState().setRoadNetworkRawXml({
        text: xml,
        validForRevision: getOpenDriveStoreApi().getState().getCommandHistory().getRevision(),
      });
      useDocumentRegistry.getState().markSaved('roadNetwork');
      toast.success(t('labels.fileSaved'));
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Save As .xodr failed:', err);
        toast.error(t('labels.serializeFailed'));
      }
    }
  }, [setShowSaveAs, t]);

  /**
   * Save the current road network to a new project path. Besides tracking the
   * new path and re-stamping the verbatim cache, this re-points the open
   * scenario's logicFile at the new road through the undoable UpdateRoadNetwork
   * command, keeping the scenario/road pair consistent on disk (see
   * document-references).
   */
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
      // The just-written text is now the authoritative verbatim source: stamp it
      // at the current revision so simulation returns to the lossless path.
      useEditorStore.getState().setRoadNetworkRawXml({
        text: xml,
        validForRevision: getOpenDriveStoreApi().getState().getCommandHistory().getRevision(),
      });
      useDocumentRegistry.getState().markSaved('roadNetwork');

      // Re-point the open scenario at the new road path via the undoable command.
      if (syncLogicFileAfterRoadSaveAs(storeApi, relativePath)) {
        toast.info(t('labels.logicFileSynced', { path: relativePath }));
      }

      // Refresh project file list
      await useProjectStore.getState().refreshProject();

      toast.success(t('labels.fileSaved'));
    },
    [storeApi, t],
  );

  // Keep the guard's save-flow reference current so it can persist on "Save"
  // without creating a declaration-order dependency on these callbacks.
  saveFnsRef.current = {
    saveXosc,
    saveXodr,
    saveCatalogs: saveAllDirtyCatalogs,
    saveDistribution,
  };

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
    saveDistribution,
    // Lower-level loaders shared with drag-and-drop and recent-files reopen.
    loadXoscFromRead,
    loadXodrFromRead,
  };
}

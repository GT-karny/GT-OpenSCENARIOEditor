import { useCallback } from 'react';
import {
  XoscParser,
  XoscSerializer,
  XoscRootMismatchError,
  parseParameterValueDistributionXml,
  serializeParameterValueDistributionFormatted,
} from '@osce/openscenario';
import type { CatalogLocations } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { useDocumentRegistry } from '../../stores/document-registry';
import { useProjectStore } from '../../stores/project-store';
import { useCatalogStore } from '../../stores/catalog-store';
import { useDistributionStore } from '../../stores/distribution-store';
import { buildCatalogLocationsFromProject } from '../../lib/catalog-location-utils';
import { reconcileLogicFileForSave } from '../../lib/document-references';
import { useAppLifecycle } from '../use-app-lifecycle';
import * as api from '../../lib/project-api';
import { resolveCatalogEntityTypes } from '../../lib/resolve-catalog-entity-types';
import {
  errorMessage,
  isCancelError,
  readFileFromDisk,
  registerRecentFile,
  useGateSaveWithValidation,
  useRunUnsavedGuard,
  writeFileToDisk,
  type ReadResult,
  type SaveFns,
} from './core';

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

/**
 * Scenario + parameter-distribution side of the file-operations surface
 * (design doc S6 §D3). See `../use-file-operations.ts` for the composition
 * point that merges this with `useXodrOperations`.
 */
export function useXoscOperations({ saveFnsRef }: { saveFnsRef: { current: SaveFns } }) {
  const storeApi = useScenarioStoreApi();
  const { t } = useTranslation('common');
  const { resetForNewFile } = useAppLifecycle();
  const setCurrentFileName = useEditorStore((s) => s.setCurrentFileName);
  const setValidationResult = useEditorStore((s) => s.setValidationResult);
  const setRoadNetwork = useEditorStore((s) => s.setRoadNetwork);
  const setShowSaveAs = useEditorStore((s) => s.setShowSaveAs);

  const runUnsavedGuard = useRunUnsavedGuard(saveFnsRef);
  const gateSaveWithValidation = useGateSaveWithValidation();

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
    // Serialize a TRANSIENT clone carrying the defaulted path; the store is left
    // untouched until the write actually succeeds, so a cancelled picker never
    // dirties a previously-clean distribution (the S2 save pattern).
    const docToSave =
      scenarioFilepath === doc.scenarioFilepath ? doc : { ...doc, scenarioFilepath };

    try {
      const xml = serializeParameterValueDistributionFormatted(docToSave);
      const suggestedName = useEditorStore.getState().currentFileName
        ? `${useEditorStore.getState().currentFileName?.replace(/\.xosc$/i, '')}.pvd.xosc`
        : 'distribution.xosc';
      await writeFileToDisk(xml, '.xosc', { suggestedName });
      // Write succeeded: commit the scenarioFilepath default (if any) through the
      // undoable command, then re-baseline so the distribution reads clean. A
      // cancel would have thrown above with the store still untouched.
      if (scenarioFilepath !== doc.scenarioFilepath) {
        useDistributionStore.getState().setScenarioFilepath(scenarioFilepath);
      }
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

  return {
    newScenario,
    loadXoscFromRead,
    openXosc,
    saveXosc,
    saveAsXosc,
    handleSaveAs,
    saveDistribution,
  };
}

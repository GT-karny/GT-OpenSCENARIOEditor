import { useCallback } from 'react';
import { XodrParser, XodrSerializer, willResolveToOdr19 } from '@osce/opendrive';
import { createDefaultDocument, buildAssembliesFromDocument } from '@osce/opendrive-engine';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import { getOpenDriveStoreApi } from '../use-opendrive-store';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { useDocumentRegistry } from '../../stores/document-registry';
import { useProjectStore } from '../../stores/project-store';
import { syncLogicFileAfterRoadSaveAs } from '../../lib/document-references';
import { editorMetadataStoreApi } from '../../stores/editor-metadata-store-instance';
import { useAppLifecycle } from '../use-app-lifecycle';
import * as api from '../../lib/project-api';
import { documentHasInclude } from '../../features/simulation/lib/wasm';
import {
  errorMessage,
  isCancelError,
  readFileFromDisk,
  registerRecentFile,
  useRunUnsavedGuard,
  writeFileToDisk,
  type ReadResult,
  type SaveFns,
} from './core';

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

/**
 * Notify (info) when a save auto-bumped the document to OpenDRIVE 1.9. The bump
 * happens at serialization time (`resolveVersion`), leaving the store document
 * untouched; this tells the user the on-disk header now reads 1.9. `message` is
 * passed in already localized so this stays a plain (non-hook) helper.
 */
function notifyIfVersionBumped(
  roadNetwork: Parameters<typeof willResolveToOdr19>[0],
  message: string,
): void {
  if (willResolveToOdr19(roadNetwork)) {
    toast.info(message);
  }
}

/**
 * OpenDRIVE (.xodr) side of the file-operations surface (design doc S6 §D3).
 * See `../use-file-operations.ts` for the composition point that merges this
 * with `useXoscOperations`.
 */
export function useXodrOperations({ saveFnsRef }: { saveFnsRef: { current: SaveFns } }) {
  const storeApi = useScenarioStoreApi();
  const { t } = useTranslation('common');
  const { resetForNewRoadNetwork } = useAppLifecycle();
  const setRoadNetwork = useEditorStore((s) => s.setRoadNetwork);
  const setShowSaveAs = useEditorStore((s) => s.setShowSaveAs);

  const runUnsavedGuard = useRunUnsavedGuard(saveFnsRef);

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
        const xml = serializer.serializeFormatted(roadNetwork, { resolveVersion: true });
        await api.writeProjectFile(currentProject.meta.id, currentXodrPath, xml);
        // The just-written text is now the authoritative verbatim source: stamp
        // it at the current revision so simulation returns to the lossless path.
        useEditorStore.getState().setRoadNetworkRawXml({
          text: xml,
          validForRevision: getOpenDriveStoreApi().getState().getCommandHistory().getRevision(),
        });
        useDocumentRegistry.getState().markSaved('roadNetwork');
        toast.success(t('labels.fileSaved'));
        notifyIfVersionBumped(roadNetwork, t('labels.savedAsOdr19'));
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
      const xml = serializer.serializeFormatted(roadNetwork, { resolveVersion: true });
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
      notifyIfVersionBumped(roadNetwork, t('labels.savedAsOdr19'));
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
      const xml = serializer.serializeFormatted(roadNetwork, { resolveVersion: true });
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
      notifyIfVersionBumped(roadNetwork, t('labels.savedAsOdr19'));
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
      warnIfXodrHasInclude(roadNetwork);

      const serializer = new XodrSerializer();
      const xml = serializer.serializeFormatted(roadNetwork, { resolveVersion: true });

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
      notifyIfVersionBumped(roadNetwork, t('labels.savedAsOdr19'));
    },
    [storeApi, t],
  );

  return {
    newOpenDrive,
    loadXodrFromRead,
    loadXodr,
    saveXodr,
    saveAsXodr,
    handleSaveAsXodr,
  };
}

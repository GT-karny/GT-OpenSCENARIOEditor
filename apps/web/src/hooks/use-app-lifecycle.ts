import { useCallback } from 'react';
import type { EditorMode } from '../stores/document-registry';
import { useEditorStore } from '../stores/editor-store';
import { useSimulationStore } from '../stores/simulation-store';
import { useRouteEditStore } from '../stores/route-edit-store';
import { useCatalogStore } from '../stores/catalog-store';
import { useDistributionStore } from '../stores/distribution-store';
import { resetOpenDriveStore, useOdrSidebarStore } from './use-opendrive-store';
import { editorMetadataStoreApi } from '../stores/editor-metadata-store-instance';
import { useDocumentRegistry } from '../stores/document-registry';

/**
 * Centralized lifecycle management for app-wide state transitions.
 *
 * Coordinates reset across multiple independent Zustand stores when
 * switching editor modes or loading new files — preventing stale state.
 *
 * Note: viewer-store (in @osce/3d-viewer) is not accessible here because
 * it lives inside the ScenarioViewer component. The caller should reset
 * the local viewerMode state separately (e.g. setViewerMode('edit')).
 */
export function useAppLifecycle() {
  const switchEditorMode = useCallback((mode: EditorMode) => {
    // 1. Stop any active simulation
    useSimulationStore.getState().reset();

    // 2. Exit route editing if active
    if (useRouteEditStore.getState().active) {
      useRouteEditStore.getState().exitRouteEditMode();
    }

    // 3. Clear transient editor state (selection, validation, picks, etc.)
    useEditorStore.getState().resetTransientState();

    // 4. Reset OpenDRIVE sidebar tool state
    useOdrSidebarStore.getState().resetAll();

    // 5. Actually switch mode
    useDocumentRegistry.getState().setFocusedBase(mode);
  }, []);

  const resetForNewFile = useCallback(() => {
    // 1. Stop any active simulation
    useSimulationStore.getState().reset();

    // 2. Exit route editing if active
    if (useRouteEditStore.getState().active) {
      useRouteEditStore.getState().exitRouteEditMode();
    }

    // 3. Clear transient editor state
    useEditorStore.getState().resetTransientState();

    // 4. Clear loaded catalogs (will be re-populated by file loading)
    useCatalogStore.getState().resetAll();

    // 4b. Clear the distribution side-document — it must not survive File>New
    // (clear() re-baselines the registry so the kind ends clean).
    useDistributionStore.getState().clear();

    // 5. Reset OpenDRIVE sidebar tool state
    useOdrSidebarStore.getState().resetAll();

    // 6. Clear file handles, paths, names, dirty flags
    useEditorStore.getState().resetFileState();

    // 7. Reset editor metadata (virtual roads, junction metadata)
    editorMetadataStoreApi.getState().resetMetadata();

    // 8. Reset opendrive-engine store (empty document + undo history)
    // so a previously-edited road never leaks into the new scenario.
    resetOpenDriveStore();

    // 9. Registry: the freshly-reset road network is clean at revision 0.
    useDocumentRegistry.getState().markLoaded('roadNetwork');
  }, []);

  const resetForNewRoadNetwork = useCallback(() => {
    // 1. Reset opendrive-engine store (creates empty document, clears undo history)
    resetOpenDriveStore();

    // 2. Reset sidebar state (tool selection, creation states)
    useOdrSidebarStore.getState().resetAll();

    // 3. Reset editor metadata (virtual roads, junction metadata)
    editorMetadataStoreApi.getState().resetMetadata();

    // 4. Registry: the freshly-reset road network is clean at revision 0.
    useDocumentRegistry.getState().markLoaded('roadNetwork');
  }, []);

  return { switchEditorMode, resetForNewFile, resetForNewRoadNetwork };
}

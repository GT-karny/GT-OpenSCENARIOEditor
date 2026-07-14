import { Suspense, lazy, useEffect } from 'react';
import { useTranslation } from '@osce/i18n';
import { HeaderToolbar } from './HeaderToolbar';
import { StatusBar } from './StatusBar';
import { AutosaveRecoveryDialog } from '../editor/AutosaveRecoveryDialog';
import { SaveAsDialog } from '../editor/SaveAsDialog';
import { useAutosave } from '../../hooks/use-autosave';
import { useValidationAutorun } from '../../hooks/use-validation-autorun';
import { ValidationConfirmHost } from '../../features/scenario/components/validation/ValidationConfirmHost';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { useDocumentRegistry } from '../../stores/document-registry';
import { useProjectStore } from '../../stores/project-store';
import { useFileOperations } from '../../hooks/use-file-operations';
import { useProjectFileOperations } from '../../hooks/use-project-file-operations';
import { buildCatalogLocationsFromProject } from '../../lib/catalog-location-utils';
import { RoadNetworkEditorLayout } from '../../features/road/components/RoadNetworkEditorLayout';
import { ScenarioEditorLayout } from '../../features/scenario/components/ScenarioEditorLayout';

// Lazy so react-query and the GT_Sim execution stack stay out of the
// scenario/road-network bundles (loaded only when the execution mode opens).
const ExecutionLayout = lazy(() => import('../../features/gt-sim/ExecutionLayout'));

export function EditorLayout() {
  const { t } = useTranslation('common');
  const scenarioStoreApi = useScenarioStoreApi();
  const currentProject = useProjectStore((s) => s.currentProject);
  const focusedBase = useDocumentRegistry((s) => s.focusedBase);

  // --- Autosave with crash recovery (mounted once) ---
  const autosave = useAutosave();
  // --- Debounced auto-validation (mounted once) ---
  useValidationAutorun();

  // --- SaveAs dialog ---
  const showSaveAs = useEditorStore((s) => s.showSaveAs);
  const setShowSaveAs = useEditorStore((s) => s.setShowSaveAs);
  const saveAsFileType = useEditorStore((s) => s.saveAsFileType);
  const { handleSaveAs, handleSaveAsXodr } = useFileOperations();

  // --- Auto-load project catalogs ---
  const { autoLoadProjectCatalogs } = useProjectFileOperations();
  useEffect(() => {
    if (currentProject) {
      autoLoadProjectCatalogs();

      // Auto-populate CatalogLocations on the default document
      const doc = scenarioStoreApi.getState().document;
      if (Object.keys(doc.catalogLocations).length === 0) {
        const currentFilePath = useProjectStore.getState().currentFilePath;
        const catalogLocations = buildCatalogLocationsFromProject(
          currentProject.files,
          currentFilePath ?? '',
        );
        if (Object.keys(catalogLocations).length > 0) {
          scenarioStoreApi.setState({
            document: { ...doc, catalogLocations },
          });
        }
      }
    }
  }, [currentProject, autoLoadProjectCatalogs, scenarioStoreApi]);

  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      <HeaderToolbar />

      {/* Autosave crash-recovery prompt (mode-independent) */}
      <AutosaveRecoveryDialog
        snapshot={autosave.recoverySnapshot}
        onRestore={autosave.restore}
        onDiscard={autosave.discard}
      />

      {/* Save-time validation confirmation host (mode-independent) */}
      <ValidationConfirmHost />

      {focusedBase === 'execution' ? (
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-secondary)]">
              {t('gtSim.loading')}
            </div>
          }
        >
          <ExecutionLayout />
        </Suspense>
      ) : focusedBase === 'roadNetwork' ? (
        <>
          <RoadNetworkEditorLayout />

          <StatusBar />

          {/* SaveAs Dialog */}
          <SaveAsDialog
            open={showSaveAs}
            onOpenChange={setShowSaveAs}
            onSave={saveAsFileType === 'xodr' ? handleSaveAsXodr : handleSaveAs}
            fileType={saveAsFileType}
          />
        </>
      ) : (
        <ScenarioEditorLayout />
      )}
    </div>
  );
}

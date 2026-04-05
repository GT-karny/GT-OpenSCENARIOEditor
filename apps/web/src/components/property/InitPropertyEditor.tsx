import { useState, useCallback } from 'react';
import type { EntityInitActions, PrivateAction } from '@osce/shared';
import { defaultActionByType } from '@osce/scenario-engine';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { InitActionList } from './InitActionList';
import { InitActionEditor } from './InitActionEditor';

interface InitPropertyEditorContentProps {
  entityInit: EntityInitActions;
}

/** Entity initial-state editor with action list (top) and editor (bottom). */
export function InitPropertyEditorContent({ entityInit }: InitPropertyEditorContentProps) {
  const storeApi = useScenarioStoreApi();
  const { entityRef, privateActions } = entityInit;

  const [selectedActionId, setSelectedActionId] = useState<string | null>(
    privateActions.length > 0 ? privateActions[0].id : null,
  );

  // Ensure selected ID still exists in the list
  const selectedAction = privateActions.find((pa) => pa.id === selectedActionId) ?? null;

  const handleAddAction = useCallback(() => {
    const newAction = defaultActionByType('speedAction') as PrivateAction;
    storeApi.getState().addInitAction(entityRef, newAction);
  }, [storeApi, entityRef]);

  const handleRemoveAction = useCallback(
    (actionId: string) => {
      storeApi.getState().removeInitAction(actionId);
      if (selectedActionId === actionId) {
        // Select the first remaining action, or null
        const remaining = privateActions.filter((pa) => pa.id !== actionId);
        setSelectedActionId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [storeApi, selectedActionId, privateActions],
  );

  const handleUpdateAction = useCallback(
    (actionId: string, newAction: PrivateAction) => {
      storeApi.getState().updateInitAction(actionId, newAction);
    },
    [storeApi],
  );

  // Auto-select newly added action (detect when list grows)
  const lastActionId = privateActions.length > 0 ? privateActions[privateActions.length - 1].id : null;
  if (lastActionId && !selectedAction && privateActions.length > 0) {
    // If nothing is selected but actions exist, select the last one
    setSelectedActionId(lastActionId);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Upper: action list */}
      <InitActionList
        entityInit={entityInit}
        selectedActionId={selectedAction?.id ?? null}
        onSelectAction={setSelectedActionId}
        onRemoveAction={handleRemoveAction}
        onAddAction={handleAddAction}
      />

      {/* Divider */}
      {selectedAction && <div className="divider-glow" />}

      {/* Lower: action editor */}
      {selectedAction && (
        <InitActionEditor
          key={selectedAction.id}
          initAction={selectedAction}
          onUpdateAction={handleUpdateAction}
        />
      )}
    </div>
  );
}

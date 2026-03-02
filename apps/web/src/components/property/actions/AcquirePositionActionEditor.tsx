import type { ScenarioAction, AcquirePositionAction, Position } from '@osce/shared';
import { PositionEditor } from '../PositionEditor';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';

interface AcquirePositionActionEditorProps {
  action: ScenarioAction;
}

export function AcquirePositionActionEditor({ action }: AcquirePositionActionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = action.action as AcquirePositionAction;

  const updateInner = (updates: Partial<AcquirePositionAction>) => {
    storeApi.getState().updateAction(action.id, {
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  return (
    <div className="space-y-3">
      <PositionEditor
        position={inner.position}
        onChange={(pos: Position) => updateInner({ position: pos })}
      />
    </div>
  );
}

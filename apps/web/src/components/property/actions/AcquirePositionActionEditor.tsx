import type { ScenarioAction, AcquirePositionAction, Position } from '@osce/shared';
import { PositionEditor } from '../PositionEditor';
import { actionUpdate } from '../lib/typed-updates';

interface AcquirePositionActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function AcquirePositionActionEditor({ action, onUpdate }: AcquirePositionActionEditorProps) {
  const inner = action.action as AcquirePositionAction;

  const updateInner = (updates: Partial<AcquirePositionAction>) => {
    onUpdate(actionUpdate(inner, updates));
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

import type { ScenarioAction, ConnectTrailerAction } from '@osce/shared';
import { Label } from '../../ui/label';
import { EntityRefSelect } from '../EntityRefSelect';

interface ConnectTrailerActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function ConnectTrailerActionEditor({ action, onUpdate }: ConnectTrailerActionEditorProps) {
  const inner = action.action as ConnectTrailerAction;

  const updateInner = (updates: Partial<ConnectTrailerAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-1">
        <Label className="text-xs">Trailer Entity Ref</Label>
        <EntityRefSelect
          value={inner.trailerRef}
          onValueChange={(v) => updateInner({ trailerRef: v })}
        />
      </div>
    </div>
  );
}

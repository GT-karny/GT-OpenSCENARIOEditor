import type { ScenarioAction, ConnectTrailerAction } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';

interface ConnectTrailerActionEditorProps {
  action: ScenarioAction;
}

export function ConnectTrailerActionEditor({ action }: ConnectTrailerActionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = action.action as ConnectTrailerAction;

  const updateInner = (updates: Partial<ConnectTrailerAction>) => {
    storeApi.getState().updateAction(action.id, {
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-1">
        <Label className="text-xs">Trailer Entity Ref</Label>
        <Input
          value={inner.trailerRef}
          placeholder="trailer entity name"
          onChange={(e) => updateInner({ trailerRef: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}

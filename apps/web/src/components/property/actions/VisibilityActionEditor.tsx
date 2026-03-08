import type { ScenarioAction, VisibilityAction } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';

interface VisibilityActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function VisibilityActionEditor({ action, onUpdate }: VisibilityActionEditorProps) {
  const inner = action.action as VisibilityAction;

  const updateInner = (updates: Partial<VisibilityAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Visibility Flags</p>
        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={inner.graphics}
              onChange={(e) => updateInner({ graphics: e.target.checked })}
            />
            Graphics
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={inner.traffic}
              onChange={(e) => updateInner({ traffic: e.target.checked })}
            />
            Traffic
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={inner.sensors}
              onChange={(e) => updateInner({ sensors: e.target.checked })}
            />
            Sensors
          </label>
        </div>
      </div>

      <div className="grid gap-1">
        <Label className="text-xs">Entity Ref (optional)</Label>
        <Input
          value={inner.entityRef ?? ''}
          placeholder="--"
          onChange={(e) => {
            if (e.target.value === '') {
              const { entityRef: _, ...rest } = inner;
              onUpdate({
                action: { ...rest },
              } as Partial<ScenarioAction>);
            } else {
              updateInner({ entityRef: e.target.value });
            }
          }}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}

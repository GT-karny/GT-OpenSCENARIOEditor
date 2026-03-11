import type { ScenarioAction, ActivateControllerAction } from '@osce/shared';
import { Input } from '../../ui/input';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';

interface ActivateControllerActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function ActivateControllerActionEditor({ action, onUpdate }: ActivateControllerActionEditorProps) {
  const inner = action.action as ActivateControllerAction;

  const updateInner = (updates: Partial<ActivateControllerAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Activate Flags</p>
        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={inner.lateral ?? false}
              onChange={(e) => updateInner({ lateral: e.target.checked })}
            />
            Lateral
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={inner.longitudinal ?? false}
              onChange={(e) => updateInner({ longitudinal: e.target.checked })}
            />
            Longitudinal
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={inner.animation ?? false}
              onChange={(e) => updateInner({ animation: e.target.checked })}
            />
            Animation
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={inner.lighting ?? false}
              onChange={(e) => updateInner({ lighting: e.target.checked })}
            />
            Lighting
          </label>
        </div>
      </div>

      <OptionalFieldWrapper
        label="Controller Ref"
        hasValue={inner.controllerRef !== undefined}
        onClear={() => {
          const { controllerRef: _, ...rest } = inner;
          onUpdate({ action: { ...rest } } as Partial<ScenarioAction>);
        }}
      >
        <Input
          value={inner.controllerRef ?? ''}
          placeholder="--"
          onChange={(e) => {
            if (e.target.value === '') {
              const { controllerRef: _, ...rest } = inner;
              onUpdate({
                action: { ...rest },
              } as Partial<ScenarioAction>);
            } else {
              updateInner({ controllerRef: e.target.value });
            }
          }}
          className="h-8 text-sm"
        />
      </OptionalFieldWrapper>
    </div>
  );
}

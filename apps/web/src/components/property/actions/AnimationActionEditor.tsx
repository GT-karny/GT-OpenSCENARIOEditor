import type { ScenarioAction, AnimationAction } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EnumSelect } from '../EnumSelect';

interface AnimationActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

const ANIMATION_TYPES = ['componentAnimation', 'pedestrianAnimation', 'animationFile', 'userDefinedAnimation'] as const;

export function AnimationActionEditor({ action, onUpdate }: AnimationActionEditorProps) {
  const inner = action.action as AnimationAction;

  const updateInner = (updates: Partial<AnimationAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-1">
        <Label className="text-xs">Animation Type</Label>
        <EnumSelect
          value={inner.animationType}
          options={[...ANIMATION_TYPES]}
          onValueChange={(v) => updateInner({ animationType: v })}
          className="h-8 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={inner.loop ?? false}
          onChange={(e) => updateInner({ loop: e.target.checked })}
        />
        Loop
      </label>

      <div className="grid gap-1">
        <Label className="text-xs">Animation Duration (s)</Label>
        <ParameterAwareInput
          elementId={action.id}
          fieldName="duration"
          value={inner.duration ?? ''}
          placeholder="--"
          onValueChange={(v) => {
            const n = parseFloat(v);
            if (isNaN(n) || v === '') {
              const { duration: _, ...rest } = inner;
              onUpdate({ action: { ...rest } } as Partial<ScenarioAction>);
            } else {
              updateInner({ duration: n });
            }
          }}
          acceptedTypes={['double']}
          className="h-8 text-sm"
        />
      </div>

      {inner.animationType === 'componentAnimation' && (
        <div className="grid gap-1">
          <Label className="text-xs">Component Name</Label>
          <ParameterAwareInput
            value={inner.state ?? ''}
            placeholder="component name"
            onValueChange={(v) => updateInner({ state: v })}
            acceptedTypes={['string']}
            className="h-8 text-sm"
          />
        </div>
      )}

      {inner.animationType === 'pedestrianAnimation' && (
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-xs">Motion</Label>
            <ParameterAwareInput
              value={inner.state ?? ''}
              placeholder="motion type"
              onValueChange={(v) => updateInner({ state: v })}
              acceptedTypes={['string']}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {inner.animationType === 'animationFile' && (
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-xs">File Path</Label>
            <ParameterAwareInput
              value={inner.state ?? ''}
              placeholder="path/to/animation.fbx"
              onValueChange={(v) => updateInner({ state: v })}
              acceptedTypes={['string']}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {inner.animationType === 'userDefinedAnimation' && (
        <div className="grid gap-1">
          <Label className="text-xs">User Defined Type</Label>
          <ParameterAwareInput
            value={inner.state ?? ''}
            placeholder="custom animation type"
            onValueChange={(v) => updateInner({ state: v })}
            acceptedTypes={['string']}
            className="h-8 text-sm"
          />
        </div>
      )}
    </div>
  );
}

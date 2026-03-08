import type { ScenarioAction, AnimationAction } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
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
        <Input
          type="number"
          value={inner.duration ?? ''}
          placeholder="--"
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (isNaN(v)) {
              const { duration: _, ...rest } = inner;
              onUpdate({ action: { ...rest } } as Partial<ScenarioAction>);
            } else {
              updateInner({ duration: v });
            }
          }}
          className="h-8 text-sm"
        />
      </div>

      {inner.animationType === 'componentAnimation' && (
        <div className="grid gap-1">
          <Label className="text-xs">Component Name</Label>
          <Input
            value={inner.state ?? ''}
            placeholder="component name"
            onChange={(e) => updateInner({ state: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      )}

      {inner.animationType === 'pedestrianAnimation' && (
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-xs">Motion</Label>
            <Input
              value={inner.state ?? ''}
              placeholder="motion type"
              onChange={(e) => updateInner({ state: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {inner.animationType === 'animationFile' && (
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-xs">File Path</Label>
            <Input
              value={inner.state ?? ''}
              placeholder="path/to/animation.fbx"
              onChange={(e) => updateInner({ state: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {inner.animationType === 'userDefinedAnimation' && (
        <div className="grid gap-1">
          <Label className="text-xs">User Defined Type</Label>
          <Input
            value={inner.state ?? ''}
            placeholder="custom animation type"
            onChange={(e) => updateInner({ state: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      )}
    </div>
  );
}

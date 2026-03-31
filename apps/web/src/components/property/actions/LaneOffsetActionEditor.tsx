import type {
  ScenarioAction,
  LaneOffsetAction,
  LaneOffsetTarget,
  LaneOffsetDynamics,
  DynamicsShape,
} from '@osce/shared';
import { useState } from 'react';
import { Label } from '../../ui/label';
import { EntityRefSelect } from '../EntityRefSelect';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { SegmentedControl } from '../SegmentedControl';
import { SHAPE_PATHS, SHAPE_LABELS } from '../TransitionDynamicsEditor';
import { DYNAMICS_SHAPES } from '../../../constants/osc-enum-values';
import { useSpeedUnit } from '../../../hooks/use-speed-unit';

const SHAPE_OPTIONS = DYNAMICS_SHAPES;

function shapeIcon(shape: DynamicsShape) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path
        d={SHAPE_PATHS[shape]}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface LaneOffsetActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function LaneOffsetActionEditor({ action, onUpdate }: LaneOffsetActionEditorProps) {
  const inner = action.action as LaneOffsetAction;
  const { label: speedLabel, toDisplay: toDisplaySpeed, toInternal: toInternalSpeed } = useSpeedUnit();

  const updateInner = (updates: Partial<LaneOffsetAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  const isRight = inner.target.value < 0 || Object.is(inner.target.value, -0);
  const [dir, setDir] = useState<'left' | 'right'>(isRight ? 'right' : 'left');

  const currentDir = isRight ? 'right' : inner.target.value > 0 ? 'left' : dir;

  const dynamics = inner.dynamics;

  const updateDynamicsNum = (field: 'maxSpeed' | 'maxLateralAcc', v: string) => {
    if (v === '') {
      const { [field]: _removed, ...rest } = dynamics;
      updateInner({ dynamics: rest as LaneOffsetDynamics });
    } else {
      const n = parseFloat(v);
      if (!Number.isFinite(n)) return;
      updateInner({ dynamics: { ...dynamics, [field]: n } });
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Target</p>
        <div className="grid gap-1">
          <Label className="text-xs">
            {inner.target.kind === 'absolute' ? 'Offset (m)' : 'Offset Delta (m)'}
          </Label>
          <div className="flex gap-1">
            <SegmentedControl
              value={currentDir}
              options={['left', 'right'] as const}
              onValueChange={(d) => {
                setDir(d);
                const mag = Math.abs(inner.target.value);
                const signed = d === 'left' ? mag : -mag;
                updateInner({
                  target: { ...inner.target, value: signed } as LaneOffsetTarget,
                });
              }}
              labels={{ left: 'Left', right: 'Right' }}
              className="shrink-0"
            />
            <ParameterAwareInput
              elementId={action.id}
              fieldName="target.value"
              value={Math.abs(inner.target.value)}
              onValueChange={(v) => {
                const mag = Math.abs(parseFloat(v) || 0);
                const sign = currentDir === 'left' ? 1 : -1;
                updateInner({
                  target: { ...inner.target, value: mag * sign } as LaneOffsetTarget,
                });
              }}
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-8 text-sm flex-1 min-w-0"
            />
            <SegmentedControl
              value={inner.target.kind}
              options={['absolute', 'relative'] as const}
              onValueChange={(v) => {
                if (v === 'absolute') {
                  updateInner({ target: { kind: 'absolute', value: inner.target.value } });
                } else {
                  updateInner({ target: { kind: 'relative', entityRef: '', value: inner.target.value } });
                }
              }}
              labels={{ absolute: 'Abs', relative: 'Rel' }}
              className="shrink-0"
            />
          </div>
        </div>
        {inner.target.kind === 'relative' && (
          <div className="grid gap-1">
            <Label className="text-xs">Entity Ref</Label>
            <EntityRefSelect
              value={inner.target.entityRef}
              onValueChange={(v) =>
                updateInner({
                  target: { ...inner.target, entityRef: v } as LaneOffsetTarget,
                })
              }
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Dynamics</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label className="text-[10px]">Max Speed ({speedLabel})</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="dynamics.maxSpeed"
              value={dynamics.maxSpeed != null ? toDisplaySpeed(dynamics.maxSpeed) : ''}
              placeholder="—"
              onValueChange={(v) => {
                const n = parseFloat(v);
                if (isNaN(n) || v === '') {
                  updateDynamicsNum('maxSpeed', v);
                } else {
                  updateDynamicsNum('maxSpeed', String(toInternalSpeed(n)));
                }
              }}
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px]">Max Lateral Acc (m/s²)</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="dynamics.maxLateralAcc"
              value={dynamics.maxLateralAcc ?? ''}
              placeholder="—"
              onValueChange={(v) => updateDynamicsNum('maxLateralAcc', v)}
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-7 text-xs"
            />
          </div>
        </div>
        <div className="grid gap-1">
          <Label className="text-[10px]">Shape</Label>
          <SegmentedControl
            value={dynamics.dynamicsShape ?? 'sinusoidal'}
            options={SHAPE_OPTIONS}
            onValueChange={(v) =>
              updateInner({ dynamics: { ...dynamics, dynamicsShape: v as DynamicsShape } })
            }
            labels={SHAPE_LABELS}
            icons={Object.fromEntries(
              DYNAMICS_SHAPES.map((s) => [s, shapeIcon(s)]),
            ) as Record<string, React.ReactNode>}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Options</p>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={inner.continuous}
            onChange={(e) => updateInner({ continuous: e.target.checked })}
          />
          Continuous
        </label>
      </div>
    </div>
  );
}

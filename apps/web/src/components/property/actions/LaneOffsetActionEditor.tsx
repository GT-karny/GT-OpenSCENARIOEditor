import type {
  ScenarioAction,
  LaneOffsetAction,
  LaneOffsetTarget,
  LaneOffsetDynamics,
  DynamicsShape,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EntityRefSelect } from '../EntityRefSelect';
import { SegmentedControl } from '../SegmentedControl';
import { SHAPE_PATHS, SHAPE_LABELS } from '../TransitionDynamicsEditor';
import { DYNAMICS_SHAPES } from '../../../constants/osc-enum-values';

const SHAPE_OPTIONS = ['', ...DYNAMICS_SHAPES] as const;

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

  const updateInner = (updates: Partial<LaneOffsetAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  const dynamics = inner.dynamics;

  const updateDynamicsShape = (v: string) => {
    if (v === '') {
      const { dynamicsShape: _ds, ...rest } = dynamics;
      updateInner({ dynamics: rest as LaneOffsetDynamics });
    } else {
      updateInner({ dynamics: { ...dynamics, dynamicsShape: v as DynamicsShape } });
    }
  };

  const updateDynamicsNum = (field: 'maxSpeed' | 'maxLateralAcc', value: string) => {
    if (value === '') {
      const { [field]: _removed, ...rest } = dynamics;
      updateInner({ dynamics: rest as LaneOffsetDynamics });
    } else {
      const n = parseFloat(value);
      if (!Number.isFinite(n)) return;
      updateInner({ dynamics: { ...dynamics, [field]: n } });
    }
  };

  return (
    <div className="space-y-3">
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

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Dynamics</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label className="text-[10px]">Max Speed (m/s)</Label>
            <Input
              type="number"
              value={dynamics.maxSpeed ?? ''}
              placeholder="—"
              step="any"
              onChange={(e) => updateDynamicsNum('maxSpeed', e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px]">Max Lateral Acc (m/s²)</Label>
            <Input
              type="number"
              value={dynamics.maxLateralAcc ?? ''}
              placeholder="—"
              step="any"
              onChange={(e) => updateDynamicsNum('maxLateralAcc', e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Shape (optional)</Label>
          <SegmentedControl
            value={dynamics.dynamicsShape ?? ''}
            options={SHAPE_OPTIONS}
            onValueChange={updateDynamicsShape}
            labels={{ '': '—', ...SHAPE_LABELS }}
            icons={Object.fromEntries(
              DYNAMICS_SHAPES.map((s) => [s, shapeIcon(s)]),
            ) as Record<string, React.ReactNode>}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Target</p>
        <div className="grid gap-1">
          <Label className="text-xs">Kind</Label>
          <SegmentedControl
            value={inner.target.kind}
            options={['absolute', 'relative'] as const}
            onValueChange={(v) => {
              if (v === 'absolute') {
                updateInner({ target: { kind: 'absolute', value: 0 } });
              } else {
                updateInner({ target: { kind: 'relative', entityRef: '', value: 0 } });
              }
            }}
            labels={{ absolute: 'Absolute', relative: 'Relative' }}
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Value</Label>
          <Input
            type="number"
            value={inner.target.value}
            onChange={(e) =>
              updateInner({
                target: { ...inner.target, value: parseFloat(e.target.value) || 0 } as LaneOffsetTarget,
              })
            }
            className="h-8 text-sm"
          />
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
    </div>
  );
}

import type {
  ScenarioAction,
  LongitudinalDistanceAction,
  DynamicConstraints,
  CoordinateSystem,
  LongitudinalDisplacement,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { EnumSelect } from '../EnumSelect';
import { SegmentedControl } from '../SegmentedControl';

const LONGITUDINAL_DISPLACEMENTS = ['any', 'trailingReferencedEntity', 'leadingReferencedEntity'] as const;
const COORDINATE_SYSTEMS = ['', 'entity', 'lane', 'road', 'trajectory'] as const;

interface LongitudinalDistanceActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function LongitudinalDistanceActionEditor({ action, onUpdate }: LongitudinalDistanceActionEditorProps) {
  const inner = action.action as LongitudinalDistanceAction;

  const updateInner = (updates: Partial<LongitudinalDistanceAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  const dynamics = inner.dynamics ?? {};

  const updateDynamics = (field: keyof DynamicConstraints, value: string) => {
    if (value === '') {
      const entries = (Object.entries(dynamics) as [keyof DynamicConstraints, number][]).filter(
        ([k, v]) => k !== field && v !== undefined,
      );
      if (entries.length === 0) {
        const { dynamics: _d, ...outerRest } = inner;
        updateInner(outerRest as LongitudinalDistanceAction);
      } else {
        updateInner({ dynamics: Object.fromEntries(entries) as DynamicConstraints });
      }
    } else {
      const n = parseFloat(value);
      if (!Number.isFinite(n)) return;
      updateInner({ dynamics: { ...dynamics, [field]: n } });
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Reference</p>
        <div className="grid gap-1">
          <Label className="text-xs">Entity Ref</Label>
          <EntityRefSelect
            value={inner.entityRef}
            onValueChange={(v) => updateInner({ entityRef: v })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Distance</p>
        <div className="grid gap-1">
          <Label className="text-xs">Distance (m) (optional)</Label>
          <ParameterAwareInput
            elementId={action.id}
            fieldName="action.distance"
            value={inner.distance ?? ''}
            placeholder="—"
            onValueChange={(v) => {
              if (v === '') {
                const { distance: _d, ...rest } = inner;
                updateInner(rest as LongitudinalDistanceAction);
              } else {
                updateInner({ distance: parseFloat(v) || 0 });
              }
            }}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Time Gap (s) (optional)</Label>
          <ParameterAwareInput
            elementId={action.id}
            fieldName="action.timeGap"
            value={inner.timeGap ?? ''}
            placeholder="—"
            onValueChange={(v) => {
              if (v === '') {
                const { timeGap: _t, ...rest } = inner;
                updateInner(rest as LongitudinalDistanceAction);
              } else {
                updateInner({ timeGap: parseFloat(v) || 0 });
              }
            }}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Options</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={inner.freespace}
              onChange={(e) => updateInner({ freespace: e.target.checked })}
            />
            Freespace
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={inner.continuous}
              onChange={(e) => updateInner({ continuous: e.target.checked })}
            />
            Continuous
          </label>
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Coordinate System (optional)</Label>
          <SegmentedControl
            value={inner.coordinateSystem ?? ''}
            options={COORDINATE_SYSTEMS}
            onValueChange={(v) => {
              if (v === '') {
                const { coordinateSystem: _cs, ...rest } = inner;
                onUpdate({ action: rest } as Partial<ScenarioAction>);
              } else {
                updateInner({ coordinateSystem: v as CoordinateSystem });
              }
            }}
            labels={{ '': '—', entity: 'Entity', lane: 'Lane', road: 'Road', trajectory: 'Traj' }}
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Displacement (optional)</Label>
          <EnumSelect
            value={inner.displacement ?? ''}
            options={['', ...LONGITUDINAL_DISPLACEMENTS]}
            onValueChange={(v) => {
              if (v === '') {
                const { displacement: _dp, ...rest } = inner;
                onUpdate({ action: rest } as Partial<ScenarioAction>);
              } else {
                updateInner({ displacement: v as LongitudinalDisplacement });
              }
            }}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Dynamic Constraints</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="grid gap-1">
            <Label className="text-[10px]">Max Accel (m/s²)</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="action.dynamics.maxAcceleration"
              value={dynamics.maxAcceleration ?? ''}
              placeholder="—"
              onValueChange={(v) => updateDynamics('maxAcceleration', v)}
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px]">Max Decel (m/s²)</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="action.dynamics.maxDeceleration"
              value={dynamics.maxDeceleration ?? ''}
              placeholder="—"
              onValueChange={(v) => updateDynamics('maxDeceleration', v)}
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px]">Max Speed (m/s)</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="action.dynamics.maxSpeed"
              value={dynamics.maxSpeed ?? ''}
              placeholder="—"
              onValueChange={(v) => updateDynamics('maxSpeed', v)}
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

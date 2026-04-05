import type {
  ScenarioAction,
  LongitudinalDistanceAction,
  DynamicConstraints,
  CoordinateSystem,
  LongitudinalDisplacement,
} from '@osce/shared';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { SegmentedControl } from '../SegmentedControl';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';
import { EnumSelect } from '../EnumSelect';
import { Label } from '../../ui/label';
import { useSpeedUnit } from '../../../hooks/use-speed-unit';

const LONGITUDINAL_DISPLACEMENTS = ['any', 'trailingReferencedEntity', 'leadingReferencedEntity'] as const;
const COORDINATE_SYSTEMS = ['', 'entity', 'lane', 'road', 'trajectory'] as const;
const DISTANCE_MODES = ['distance', 'timeGap'] as const;

type DistanceMode = 'distance' | 'timeGap';

interface LongitudinalDistanceActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function LongitudinalDistanceActionEditor({ action, onUpdate }: LongitudinalDistanceActionEditorProps) {
  const inner = action.action as LongitudinalDistanceAction;
  const { label: speedLabel, toDisplay: toDisplaySpeed, toInternal: toInternalSpeed } = useSpeedUnit();

  const updateInner = (updates: Partial<LongitudinalDistanceAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  const dynamics = inner.dynamics ?? {};
  const hasDynamics = inner.dynamics !== undefined && Object.keys(inner.dynamics).length > 0;

  const distanceMode: DistanceMode =
    inner.timeGap !== undefined ? 'timeGap' : 'distance';

  const handleDistanceModeChange = (mode: DistanceMode) => {
    if (mode === 'distance') {
      const { timeGap: _t, ...rest } = inner;
      onUpdate({ action: { ...rest, distance: inner.distance ?? 0 } } as Partial<ScenarioAction>);
    } else {
      const { distance: _d, ...rest } = inner;
      onUpdate({ action: { ...rest, timeGap: inner.timeGap ?? 0 } } as Partial<ScenarioAction>);
    }
  };

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

  const clearDynamics = () => {
    const { dynamics: _d, ...rest } = inner;
    onUpdate({ action: rest } as Partial<ScenarioAction>);
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

      <div className="grid gap-1">
        <Label className="text-xs">
          {distanceMode === 'distance' ? 'Distance (m)' : 'Time Gap (s)'}
        </Label>
        <div className="flex gap-1">
          <ParameterAwareInput
            elementId={action.id}
            fieldName={distanceMode === 'distance' ? 'action.distance' : 'action.timeGap'}
            value={distanceMode === 'distance' ? (inner.distance ?? 0) : (inner.timeGap ?? 0)}
            onValueChange={(v) => {
              if (distanceMode === 'distance') {
                updateInner({ distance: parseFloat(v) || 0 });
              } else {
                updateInner({ timeGap: parseFloat(v) || 0 });
              }
            }}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            className="h-8 text-sm flex-1 min-w-0"
          />
          <SegmentedControl
            value={distanceMode}
            options={DISTANCE_MODES}
            onValueChange={handleDistanceModeChange}
            labels={{ distance: 'Distance', timeGap: 'Time Gap' }}
            className="shrink-0"
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
        <OptionalFieldWrapper
          label="Coordinate System"
          hasValue={inner.coordinateSystem !== undefined}
          onClear={() => {
            const { coordinateSystem: _cs, ...rest } = inner;
            onUpdate({ action: rest } as Partial<ScenarioAction>);
          }}
        >
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
        </OptionalFieldWrapper>
        <OptionalFieldWrapper
          label="Displacement"
          hasValue={inner.displacement !== undefined}
          onClear={() => {
            const { displacement: _dp, ...rest } = inner;
            onUpdate({ action: rest } as Partial<ScenarioAction>);
          }}
        >
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
        </OptionalFieldWrapper>
      </div>

      <OptionalFieldWrapper
        label="Dynamic Constraints"
        hasValue={hasDynamics}
        onClear={clearDynamics}
      >
        <div className="grid grid-cols-3 gap-2">
          <div className="grid gap-1">
            <Label className="text-[10px]">Max Accel (m/s²)</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="dynamics.maxAcceleration"
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
              fieldName="dynamics.maxDeceleration"
              value={dynamics.maxDeceleration ?? ''}
              placeholder="—"
              onValueChange={(v) => updateDynamics('maxDeceleration', v)}
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-7 text-xs"
            />
          </div>
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
                  updateDynamics('maxSpeed', v);
                } else {
                  updateDynamics('maxSpeed', String(toInternalSpeed(n)));
                }
              }}
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </OptionalFieldWrapper>
    </div>
  );
}

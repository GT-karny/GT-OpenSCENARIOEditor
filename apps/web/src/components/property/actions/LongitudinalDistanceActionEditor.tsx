import type {
  ScenarioAction,
  LongitudinalDistanceAction,
  DynamicConstraints,
  CoordinateSystem,
  LongitudinalDisplacement,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';

const LONGITUDINAL_DISPLACEMENTS = ['any', 'trailingReferencedEntity', 'leadingReferencedEntity'] as const;
const COORDINATE_SYSTEMS = ['entity', 'lane', 'road', 'trajectory'] as const;

interface LongitudinalDistanceActionEditorProps {
  action: ScenarioAction;
}

export function LongitudinalDistanceActionEditor({ action }: LongitudinalDistanceActionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = action.action as LongitudinalDistanceAction;

  const updateInner = (updates: Partial<LongitudinalDistanceAction>) => {
    storeApi.getState().updateAction(action.id, {
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  const dynamics = inner.dynamics ?? {};

  const updateDynamics = (field: keyof DynamicConstraints, value: string) => {
    if (value === '') {
      const rest: DynamicConstraints = {
        maxAcceleration: field !== 'maxAcceleration' ? dynamics.maxAcceleration : undefined,
        maxDeceleration: field !== 'maxDeceleration' ? dynamics.maxDeceleration : undefined,
        maxSpeed: field !== 'maxSpeed' ? dynamics.maxSpeed : undefined,
      };
      const allEmpty =
        rest.maxAcceleration === undefined &&
        rest.maxDeceleration === undefined &&
        rest.maxSpeed === undefined;
      if (allEmpty) {
        const { dynamics: _d, ...outerRest } = inner;
        updateInner(outerRest as LongitudinalDistanceAction);
      } else {
        updateInner({ dynamics: rest });
      }
    } else {
      const n = parseFloat(value);
      if (!Number.isFinite(n)) return;
      const next: DynamicConstraints = { ...dynamics, [field]: n };
      updateInner({ dynamics: next });
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Reference</p>
        <div className="grid gap-1">
          <Label className="text-xs">Entity Ref</Label>
          <Input
            value={inner.entityRef}
            onChange={(e) => updateInner({ entityRef: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Distance</p>
        <div className="grid gap-1">
          <Label className="text-xs">Distance (m) (optional)</Label>
          <Input
            type="number"
            value={inner.distance ?? ''}
            placeholder="—"
            step="any"
            onChange={(e) => {
              if (e.target.value === '') {
                const { distance: _d, ...rest } = inner;
                updateInner(rest as LongitudinalDistanceAction);
              } else {
                updateInner({ distance: parseFloat(e.target.value) || 0 });
              }
            }}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Time Gap (s) (optional)</Label>
          <Input
            type="number"
            value={inner.timeGap ?? ''}
            placeholder="—"
            step="any"
            onChange={(e) => {
              if (e.target.value === '') {
                const { timeGap: _t, ...rest } = inner;
                updateInner(rest as LongitudinalDistanceAction);
              } else {
                updateInner({ timeGap: parseFloat(e.target.value) || 0 });
              }
            }}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Options</p>
        <div className="grid gap-1">
          <Label className="text-xs">Freespace</Label>
          <EnumSelect
            value={String(inner.freespace)}
            options={['false', 'true']}
            onValueChange={(v) => updateInner({ freespace: v === 'true' })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Continuous</Label>
          <EnumSelect
            value={String(inner.continuous)}
            options={['false', 'true']}
            onValueChange={(v) => updateInner({ continuous: v === 'true' })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Coordinate System (optional)</Label>
          <EnumSelect
            value={inner.coordinateSystem ?? ''}
            options={['', ...COORDINATE_SYSTEMS]}
            onValueChange={(v) => {
              if (v === '') {
                const { coordinateSystem: _cs, ...rest } = inner;
                updateInner(rest as LongitudinalDistanceAction);
              } else {
                updateInner({ coordinateSystem: v as CoordinateSystem });
              }
            }}
            className="h-8 text-sm"
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
                updateInner(rest as LongitudinalDistanceAction);
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
        <div className="grid gap-1">
          <Label className="text-xs">Max Acceleration (optional)</Label>
          <Input
            type="number"
            value={dynamics.maxAcceleration ?? ''}
            placeholder="—"
            step="any"
            onChange={(e) => updateDynamics('maxAcceleration', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Max Deceleration (optional)</Label>
          <Input
            type="number"
            value={dynamics.maxDeceleration ?? ''}
            placeholder="—"
            step="any"
            onChange={(e) => updateDynamics('maxDeceleration', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Max Speed (optional)</Label>
          <Input
            type="number"
            value={dynamics.maxSpeed ?? ''}
            placeholder="—"
            step="any"
            onChange={(e) => updateDynamics('maxSpeed', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

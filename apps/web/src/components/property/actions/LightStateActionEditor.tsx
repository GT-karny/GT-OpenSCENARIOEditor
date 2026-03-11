import type { ScenarioAction, LightStateAction } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';
import { SegmentedControl } from '../SegmentedControl';

interface LightStateActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

const VEHICLE_LIGHT_TYPES = [
  'daytimeRunningLights',
  'lowBeam',
  'highBeam',
  'fogLights',
  'fogLightsFront',
  'fogLightsRear',
  'brakeLights',
  'warningLights',
  'indicatorLeft',
  'indicatorRight',
  'reversingLights',
  'licensePlateIllumination',
  'specialPurposeLights',
] as const;

export function LightStateActionEditor({ action, onUpdate }: LightStateActionEditorProps) {
  const inner = action.action as LightStateAction;

  const updateInner = (updates: Partial<LightStateAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  const lightCategory = inner.lightType.startsWith('vehicleLight:') ? 'vehicleLight' : 'userDefinedLight';
  const vehicleLightType = inner.lightType.startsWith('vehicleLight:')
    ? inner.lightType.slice('vehicleLight:'.length)
    : VEHICLE_LIGHT_TYPES[0];

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Light Type</p>
        <div className="grid gap-1">
          <Label className="text-xs">Category</Label>
          <SegmentedControl
            value={lightCategory}
            options={['vehicleLight', 'userDefinedLight'] as const}
            onValueChange={(v) => {
              if (v === 'vehicleLight') {
                updateInner({ lightType: `vehicleLight:${VEHICLE_LIGHT_TYPES[0]}` });
              } else {
                updateInner({ lightType: '' });
              }
            }}
            labels={{ vehicleLight: 'Vehicle', userDefinedLight: 'User Defined' }}
          />
        </div>

        {lightCategory === 'vehicleLight' && (
          <div className="grid gap-1">
            <Label className="text-xs">Vehicle Light Type</Label>
            <EnumSelect
              value={vehicleLightType}
              options={[...VEHICLE_LIGHT_TYPES]}
              onValueChange={(v) => updateInner({ lightType: `vehicleLight:${v}` })}
              className="h-8 text-sm"
            />
          </div>
        )}

        {lightCategory === 'userDefinedLight' && (
          <div className="grid gap-1">
            <Label className="text-xs">Light Type Name</Label>
            <Input
              value={inner.lightType}
              placeholder="custom light type"
              onChange={(e) => updateInner({ lightType: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Light State</p>
        <div className="grid gap-1">
          <Label className="text-xs">Mode</Label>
          <SegmentedControl
            value={inner.mode}
            options={['on', 'off', 'flashing'] as const}
            onValueChange={(v) => updateInner({ mode: v as LightStateAction['mode'] })}
            labels={{ on: 'On', off: 'Off', flashing: 'Flashing' }}
          />
        </div>

        <div className="grid gap-1">
          <Label className="text-xs">Luminous Intensity (cd) (optional)</Label>
          <Input
            type="number"
            value={inner.intensity ?? ''}
            placeholder="--"
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (isNaN(v)) {
                const { intensity: _, ...rest } = inner;
                onUpdate({ action: { ...rest } } as Partial<ScenarioAction>);
              } else {
                updateInner({ intensity: v });
              }
            }}
            className="h-8 text-sm"
          />
        </div>

        <div className="grid gap-1">
          <Label className="text-xs">Transition Time (s) (optional)</Label>
          <Input
            type="number"
            value={inner.transitionTime ?? ''}
            placeholder="--"
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (isNaN(v)) {
                const { transitionTime: _, ...rest } = inner;
                onUpdate({ action: { ...rest } } as Partial<ScenarioAction>);
              } else {
                updateInner({ transitionTime: v });
              }
            }}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

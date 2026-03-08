import type { ScenarioAction, OverrideControllerAction, OverrideValue, OverrideGearValue } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';

interface OverrideControllerActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

interface OverrideValueGroupProps {
  label: string;
  value: OverrideValue | undefined;
  showMaxRate?: boolean;
  showMaxTorque?: boolean;
  onChange: (v: OverrideValue | undefined) => void;
}

function OverrideValueGroup({ label, value, showMaxRate = true, showMaxTorque = false, onChange }: OverrideValueGroupProps) {
  const active = value?.active ?? false;

  const handleActiveChange = (checked: boolean) => {
    if (!checked) {
      onChange(undefined);
    } else {
      onChange({ value: 0, active: true });
    }
  };

  return (
    <div className="space-y-1 py-2 border-b last:border-0">
      <label className="flex items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => handleActiveChange(e.target.checked)}
        />
        {label}
      </label>
      {active && value && (
        <div className={`grid gap-2 pl-4 ${showMaxRate || showMaxTorque ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Value (0–1)</Label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={value.value}
              onChange={(e) => onChange({ ...value, value: parseFloat(e.target.value) || 0 })}
              className="h-7 text-xs"
            />
          </div>
          {showMaxRate && (
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Max Rate</Label>
              <Input
                type="number"
                value={value.maxRate ?? ''}
                placeholder="--"
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (isNaN(v)) {
                    const { maxRate: _, ...rest } = value;
                    onChange(rest);
                  } else {
                    onChange({ ...value, maxRate: v });
                  }
                }}
                className="h-7 text-xs"
              />
            </div>
          )}
          {showMaxTorque && (
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Max Torque</Label>
              <Input
                type="number"
                value={value.maxTorque ?? ''}
                placeholder="--"
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (isNaN(v)) {
                    const { maxTorque: _, ...rest } = value;
                    onChange(rest);
                  } else {
                    onChange({ ...value, maxTorque: v });
                  }
                }}
                className="h-7 text-xs"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface GearGroupProps {
  value: OverrideGearValue | undefined;
  onChange: (v: OverrideGearValue | undefined) => void;
}

function GearGroup({ value, onChange }: GearGroupProps) {
  const active = value?.active ?? false;

  return (
    <div className="space-y-1 py-2">
      <label className="flex items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => {
            if (!e.target.checked) {
              onChange(undefined);
            } else {
              onChange({ active: true });
            }
          }}
        />
        Gear
      </label>
      {active && value && (
        <div className="grid gap-1 pl-4">
          <Label className="text-xs text-muted-foreground">Gear Number (optional)</Label>
          <Input
            type="number"
            step={1}
            value={value.number ?? ''}
            placeholder="--"
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (isNaN(v)) {
                onChange({ active: true });
              } else {
                onChange({ active: true, number: v });
              }
            }}
            className="h-7 text-xs"
          />
        </div>
      )}
    </div>
  );
}

export function OverrideControllerActionEditor({ action, onUpdate }: OverrideControllerActionEditorProps) {
  const inner = action.action as OverrideControllerAction;

  const updateInner = (updates: Partial<OverrideControllerAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground mb-2">Controller Overrides</p>
      <OverrideValueGroup
        label="Throttle"
        value={inner.throttle}
        onChange={(v) => updateInner({ throttle: v })}
      />
      <OverrideValueGroup
        label="Brake"
        value={inner.brake}
        onChange={(v) => updateInner({ brake: v })}
      />
      <OverrideValueGroup
        label="Clutch"
        value={inner.clutch}
        onChange={(v) => updateInner({ clutch: v })}
      />
      <OverrideValueGroup
        label="Parking Brake"
        value={inner.parkingBrake}
        onChange={(v) => updateInner({ parkingBrake: v })}
      />
      <OverrideValueGroup
        label="Steering Wheel"
        value={inner.steeringWheel}
        showMaxTorque
        onChange={(v) => updateInner({ steeringWheel: v })}
      />
      <GearGroup
        value={inner.gear}
        onChange={(v) => updateInner({ gear: v })}
      />
    </div>
  );
}

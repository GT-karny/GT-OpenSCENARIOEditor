import type { ScenarioAction, OverrideControllerAction, OverrideValue, OverrideGearValue } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';

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
  elementId: string;
  fieldPrefix: string;
}

function OverrideValueGroup({ label, value, showMaxRate = true, showMaxTorque = false, onChange, elementId, fieldPrefix }: OverrideValueGroupProps) {
  const active = value?.active ?? false;

  const handleActiveChange = (checked: boolean) => {
    if (!checked) {
      onChange(undefined);
    } else {
      onChange({ value: 0, active: true });
    }
  };

  return (
    <div className="space-y-1 py-2 border-b border-[var(--color-glass-edge)] last:border-0">
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
            <ParameterAwareInput
              elementId={elementId}
              fieldName={`${fieldPrefix}.value`}
              value={value.value}
              onValueChange={(v) => onChange({ ...value, value: parseFloat(v) || 0 })}
              acceptedTypes={['double']}
              className="h-7 text-xs"
            />
          </div>
          {showMaxRate && (
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Max Rate</Label>
              <ParameterAwareInput
                elementId={elementId}
                fieldName={`${fieldPrefix}.maxRate`}
                value={value.maxRate ?? ''}
                placeholder="--"
                onValueChange={(v) => {
                  const n = parseFloat(v);
                  if (isNaN(n) || v === '') {
                    const { maxRate: _, ...rest } = value;
                    onChange(rest);
                  } else {
                    onChange({ ...value, maxRate: n });
                  }
                }}
                acceptedTypes={['double']}
                className="h-7 text-xs"
              />
            </div>
          )}
          {showMaxTorque && (
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Max Torque</Label>
              <ParameterAwareInput
                elementId={elementId}
                fieldName={`${fieldPrefix}.maxTorque`}
                value={value.maxTorque ?? ''}
                placeholder="--"
                onValueChange={(v) => {
                  const n = parseFloat(v);
                  if (isNaN(n) || v === '') {
                    const { maxTorque: _, ...rest } = value;
                    onChange(rest);
                  } else {
                    onChange({ ...value, maxTorque: n });
                  }
                }}
                acceptedTypes={['double']}
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
  elementId: string;
}

function GearGroup({ value, onChange, elementId }: GearGroupProps) {
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
          <ParameterAwareInput
            elementId={elementId}
            fieldName="gear.number"
            value={value.number ?? ''}
            placeholder="--"
            onValueChange={(v) => {
              const n = parseInt(v, 10);
              if (isNaN(n) || v === '') {
                onChange({ active: true });
              } else {
                onChange({ active: true, number: n });
              }
            }}
            acceptedTypes={['int', 'unsignedInt']}
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
        elementId={action.id}
        fieldPrefix="action.throttle"
      />
      <OverrideValueGroup
        label="Brake"
        value={inner.brake}
        onChange={(v) => updateInner({ brake: v })}
        elementId={action.id}
        fieldPrefix="action.brake"
      />
      <OverrideValueGroup
        label="Clutch"
        value={inner.clutch}
        onChange={(v) => updateInner({ clutch: v })}
        elementId={action.id}
        fieldPrefix="action.clutch"
      />
      <OverrideValueGroup
        label="Parking Brake"
        value={inner.parkingBrake}
        onChange={(v) => updateInner({ parkingBrake: v })}
        elementId={action.id}
        fieldPrefix="action.parkingBrake"
      />
      <OverrideValueGroup
        label="Steering Wheel"
        value={inner.steeringWheel}
        showMaxTorque
        onChange={(v) => updateInner({ steeringWheel: v })}
        elementId={action.id}
        fieldPrefix="action.steeringWheel"
      />
      <GearGroup
        value={inner.gear}
        onChange={(v) => updateInner({ gear: v })}
        elementId={action.id}
      />
    </div>
  );
}

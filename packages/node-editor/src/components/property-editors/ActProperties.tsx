import type { Act } from '@osce/shared';
import { PropertyField } from './PropertyField.js';

export interface ActPropertiesProps {
  act: Act;
  onUpdate?: (updates: Partial<Act>) => void;
}

export function ActProperties({ act, onUpdate }: ActPropertiesProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-indigo-800">Act</div>
      <PropertyField
        label="Name"
        value={act.name}
        onChange={(v) => onUpdate?.({ name: v })}
      />
      <PropertyField
        label="Maneuver Groups"
        value={act.maneuverGroups.length}
        type="readonly"
      />
      <PropertyField
        label="Has Start Trigger"
        value={act.startTrigger.conditionGroups.length > 0 ? 'Yes' : 'No'}
        type="readonly"
      />
      <PropertyField
        label="ID"
        value={act.id}
        type="readonly"
      />
    </div>
  );
}

import type { ManeuverGroup } from '@osce/shared';
import { PropertyField } from './PropertyField.js';

export interface ManeuverGroupPropertiesProps {
  group: ManeuverGroup;
  onUpdate?: (updates: Partial<ManeuverGroup>) => void;
}

export function ManeuverGroupProperties({ group, onUpdate }: ManeuverGroupPropertiesProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-violet-800">Maneuver Group</div>
      <PropertyField
        label="Name"
        value={group.name}
        onChange={(v) => onUpdate?.({ name: v })}
      />
      <PropertyField
        label="Max Execution Count"
        value={group.maximumExecutionCount}
        type="number"
        onChange={(v) => onUpdate?.({ maximumExecutionCount: Number(v) })}
      />
      <PropertyField
        label="Actors"
        value={group.actors.entityRefs.join(', ') || 'None'}
        type="readonly"
      />
      <PropertyField
        label="ID"
        value={group.id}
        type="readonly"
      />
    </div>
  );
}

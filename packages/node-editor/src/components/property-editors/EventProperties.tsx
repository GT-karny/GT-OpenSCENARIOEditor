import type { ScenarioEvent } from '@osce/shared';
import { PropertyField } from './PropertyField.js';

const priorityOptions = [
  { value: 'override', label: 'Override' },
  { value: 'overwrite', label: 'Overwrite' },
  { value: 'skip', label: 'Skip' },
  { value: 'parallel', label: 'Parallel' },
];

export interface EventPropertiesProps {
  event: ScenarioEvent;
  onUpdate?: (updates: Partial<ScenarioEvent>) => void;
}

export function EventProperties({ event, onUpdate }: EventPropertiesProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-amber-800">Event</div>
      <PropertyField
        label="Name"
        value={event.name}
        onChange={(v) => onUpdate?.({ name: v })}
      />
      <PropertyField
        label="Priority"
        value={event.priority}
        type="select"
        options={priorityOptions}
        onChange={(v) => onUpdate?.({ priority: v as ScenarioEvent['priority'] })}
      />
      <PropertyField
        label="Actions"
        value={event.actions.length}
        type="readonly"
      />
      <PropertyField
        label="ID"
        value={event.id}
        type="readonly"
      />
    </div>
  );
}

import type { Trigger } from '@osce/shared';
import { PropertyField } from './PropertyField.js';
import { getTriggerSummary } from '../../utils/condition-display.js';

export interface TriggerPropertiesProps {
  trigger: Trigger;
  triggerKind?: 'start' | 'stop';
}

export function TriggerProperties({ trigger, triggerKind }: TriggerPropertiesProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-rose-800">
        {triggerKind === 'stop' ? 'Stop' : 'Start'} Trigger
      </div>
      <PropertyField
        label="Condition Groups"
        value={trigger.conditionGroups.length}
        type="readonly"
      />
      <PropertyField
        label="Summary"
        value={getTriggerSummary(trigger)}
        type="readonly"
      />
      <PropertyField
        label="ID"
        value={trigger.id}
        type="readonly"
      />
    </div>
  );
}

import type { ScenarioAction } from '@osce/shared';
import { PropertyField } from './PropertyField.js';
import { getActionTypeLabel, getActionSummary } from '../../utils/action-display.js';

export interface ActionPropertiesProps {
  action: ScenarioAction;
  onUpdate?: (updates: Partial<ScenarioAction>) => void;
}

export function ActionProperties({ action, onUpdate }: ActionPropertiesProps) {
  const innerAction = action.action;
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-orange-800">Action</div>
      <PropertyField
        label="Name"
        value={action.name}
        onChange={(v) => onUpdate?.({ name: v })}
      />
      <PropertyField
        label="Type"
        value={getActionTypeLabel(innerAction.type)}
        type="readonly"
      />
      <PropertyField
        label="Summary"
        value={getActionSummary(innerAction as Parameters<typeof getActionSummary>[0])}
        type="readonly"
      />
      <PropertyField
        label="ID"
        value={action.id}
        type="readonly"
      />
    </div>
  );
}

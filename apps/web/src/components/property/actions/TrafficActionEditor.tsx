import type { ScenarioAction, TrafficAction } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EnumSelect } from '../../form/EnumSelect';
import { GenericActionEditor } from './GenericActionEditor';
import { actionBody, actionUpdate } from '../lib/typed-updates';

interface TrafficActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

const TRAFFIC_ACTION_TYPES = ['trafficSource', 'trafficSink', 'trafficSwarm', 'trafficStop'] as const;

export function TrafficActionEditor({ action, onUpdate }: TrafficActionEditorProps) {
  const inner = action.action as TrafficAction;

  const trafficName = inner.trafficName ?? '';
  const trafficSubType = inner.trafficActionType ?? '';

  return (
    <div className="space-y-3">
      <div className="grid gap-1">
        <Label className="text-xs">Traffic Name (optional)</Label>
        <ParameterAwareInput
          value={trafficName}
          placeholder="--"
          onValueChange={(v) => {
            if (v === '') {
              const { trafficName: _, ...rest } = inner;
              onUpdate(actionBody(rest));
            } else {
              onUpdate(actionUpdate(inner, { trafficName: v }));
            }
          }}
          acceptedTypes={['string']}
          className="h-8 text-sm"
        />
      </div>

      <div className="grid gap-1">
        <Label className="text-xs">Traffic Action Type</Label>
        <EnumSelect
          value={trafficSubType || TRAFFIC_ACTION_TYPES[0]}
          options={[...TRAFFIC_ACTION_TYPES]}
          onValueChange={(v) => {
            onUpdate(actionUpdate(inner, { trafficActionType: v }));
          }}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Advanced traffic configuration:</p>
        <GenericActionEditor action={action} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

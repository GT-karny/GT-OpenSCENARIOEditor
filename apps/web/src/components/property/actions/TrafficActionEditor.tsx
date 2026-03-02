import type { ScenarioAction, TrafficAction } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';
import { GenericActionEditor } from './GenericActionEditor';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';

interface TrafficActionEditorProps {
  action: ScenarioAction;
}

const TRAFFIC_ACTION_TYPES = ['trafficSource', 'trafficSink', 'trafficSwarm', 'trafficStop'] as const;

export function TrafficActionEditor({ action }: TrafficActionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = action.action as TrafficAction;

  const trafficName = inner.trafficName ?? '';
  const trafficSubType = inner.trafficActionType ?? '';

  return (
    <div className="space-y-3">
      <div className="grid gap-1">
        <Label className="text-xs">Traffic Name (optional)</Label>
        <Input
          value={trafficName}
          placeholder="--"
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
              const { trafficName: _, ...rest } = inner;
              storeApi.getState().updateAction(action.id, { action: { ...rest } } as Partial<ScenarioAction>);
            } else {
              storeApi.getState().updateAction(action.id, {
                action: { ...inner, trafficName: val },
              } as Partial<ScenarioAction>);
            }
          }}
          className="h-8 text-sm"
        />
      </div>

      <div className="grid gap-1">
        <Label className="text-xs">Traffic Action Type</Label>
        <EnumSelect
          value={trafficSubType || TRAFFIC_ACTION_TYPES[0]}
          options={[...TRAFFIC_ACTION_TYPES]}
          onValueChange={(v) => {
            storeApi.getState().updateAction(action.id, {
              action: { ...inner, trafficActionType: v },
            } as Partial<ScenarioAction>);
          }}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Advanced traffic configuration:</p>
        <GenericActionEditor action={action} />
      </div>
    </div>
  );
}

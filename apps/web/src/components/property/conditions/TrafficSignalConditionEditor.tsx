import { useMemo } from 'react';
import type {
  Condition,
  ByValueCondition,
  TrafficSignalCondition,
  TrafficSignalController,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { RefSelect } from '../RefSelect';
import type { RefSelectItem } from '../RefSelect';
import { useScenarioStore } from '../../../stores/use-scenario-store';

const EMPTY_SIGNALS: TrafficSignalController[] = [];

interface TrafficSignalConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function TrafficSignalConditionEditor({
  condition,
  onUpdate,
}: TrafficSignalConditionEditorProps) {
  const inner = condition.condition as ByValueCondition;
  const cond = inner.valueCondition as TrafficSignalCondition;
  const controllers = useScenarioStore((s) => s.document.roadNetwork.trafficSignals ?? EMPTY_SIGNALS);

  const signalItems: RefSelectItem[] = useMemo(() => {
    const ids = new Set<string>();
    for (const ctrl of controllers) {
      for (const phase of ctrl.phases) {
        for (const state of phase.trafficSignalStates) {
          ids.add(state.trafficSignalId);
        }
      }
    }
    return [...ids].sort().map((id) => ({ name: id }));
  }, [controllers]);

  const update = (updates: Partial<TrafficSignalCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, valueCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Traffic Signal Condition</p>
        <div className="grid gap-1">
          <Label className="text-[10px]">Signal Name</Label>
          <RefSelect
            value={cond.name}
            onValueChange={(v) => update({ name: v })}
            items={signalItems}
            placeholder="Select signal..."
            emptyMessage="No traffic signals defined"
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[10px]">State</Label>
          <Input
            value={cond.state}
            placeholder="e.g. red, green, yellow"
            onChange={(e) => update({ state: e.target.value })}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

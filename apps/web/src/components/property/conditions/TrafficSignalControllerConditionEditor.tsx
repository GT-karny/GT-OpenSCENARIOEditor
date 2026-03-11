import { useMemo } from 'react';
import type {
  Condition,
  ByValueCondition,
  TrafficSignalControllerCondition,
  TrafficSignalController,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { RefSelect } from '../RefSelect';
import type { RefSelectItem } from '../RefSelect';
import { useScenarioStore } from '../../../stores/use-scenario-store';

const EMPTY_SIGNALS: TrafficSignalController[] = [];

interface TrafficSignalControllerConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function TrafficSignalControllerConditionEditor({
  condition,
  onUpdate,
}: TrafficSignalControllerConditionEditorProps) {
  const inner = condition.condition as ByValueCondition;
  const cond = inner.valueCondition as TrafficSignalControllerCondition;
  const controllers = useScenarioStore((s) => s.document.roadNetwork.trafficSignals ?? EMPTY_SIGNALS);

  const controllerItems: RefSelectItem[] = useMemo(
    () =>
      controllers.map((c) => ({
        name: c.name,
        description: `${c.phases.length} phase(s)`,
      })),
    [controllers],
  );

  const update = (updates: Partial<TrafficSignalControllerCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, valueCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Traffic Signal Controller Condition</p>
        <div className="grid gap-1">
          <Label className="text-[10px]">Controller Ref</Label>
          <RefSelect
            value={cond.trafficSignalControllerRef}
            onValueChange={(v) => update({ trafficSignalControllerRef: v })}
            items={controllerItems}
            placeholder="Select controller..."
            emptyMessage="No traffic signal controllers"
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[10px]">Phase</Label>
          <Input
            value={cond.phase}
            placeholder="phase name"
            onChange={(e) => update({ phase: e.target.value })}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

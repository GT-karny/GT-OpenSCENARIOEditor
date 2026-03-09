import type {
  Condition,
  ByValueCondition,
  TrafficSignalControllerCondition,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';

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
          <Label className="text-xs">Controller Ref</Label>
          <Input
            value={cond.trafficSignalControllerRef}
            placeholder="controller name"
            onChange={(e) => update({ trafficSignalControllerRef: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Phase</Label>
          <Input
            value={cond.phase}
            placeholder="phase name"
            onChange={(e) => update({ phase: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

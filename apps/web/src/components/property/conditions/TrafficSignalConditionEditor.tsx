import type { Condition, ByValueCondition, TrafficSignalCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';

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
          <Label className="text-xs">Signal Name</Label>
          <Input
            value={cond.name}
            placeholder="signal name"
            onChange={(e) => update({ name: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">State</Label>
          <Input
            value={cond.state}
            placeholder="e.g. red, green, yellow"
            onChange={(e) => update({ state: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

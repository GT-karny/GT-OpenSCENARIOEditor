import type { Condition, ByEntityCondition, ReachPositionCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { PositionEditor } from '../PositionEditor';

interface ReachPositionConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function ReachPositionConditionEditor({ condition, onUpdate }: ReachPositionConditionEditorProps) {
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as ReachPositionCondition;

  const update = (updates: Partial<ReachPositionCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Reach Position</p>
        <div className="grid gap-1">
          <Label className="text-xs">Tolerance (m)</Label>
          <Input
            type="number"
            value={cond.tolerance}
            onChange={(e) => update({ tolerance: parseFloat(e.target.value) || 0 })}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <PositionEditor
        position={cond.position}
        onChange={(pos) => update({ position: pos })}
      />
    </div>
  );
}

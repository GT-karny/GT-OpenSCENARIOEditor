import type { Condition, ByEntityCondition, RelativeClearanceCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefMultiSelect } from '../EntityRefMultiSelect';

interface RelativeClearanceConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function RelativeClearanceConditionEditor({
  condition,
  onUpdate,
}: RelativeClearanceConditionEditorProps) {
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as RelativeClearanceCondition;

  const update = (updates: Partial<RelativeClearanceCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Relative Clearance</p>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`${condition.id}-freeSpace`}
            checked={cond.freeSpace}
            onChange={(e) => update({ freeSpace: e.target.checked })}
            className="size-3.5"
          />
          <Label htmlFor={`${condition.id}-freeSpace`} className="text-xs">
            Free Space
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`${condition.id}-oppositeLanes`}
            checked={cond.oppositeLanes}
            onChange={(e) => update({ oppositeLanes: e.target.checked })}
            className="size-3.5"
          />
          <Label htmlFor={`${condition.id}-oppositeLanes`} className="text-xs">
            Opposite Lanes
          </Label>
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Entity Refs</Label>
          <EntityRefMultiSelect
            value={cond.entityRefs}
            onValueChange={(refs) => update({ entityRefs: refs })}
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Distance Forward (m, optional)</Label>
          <ParameterAwareInput
            elementId={condition.id}
            fieldName="distanceForward"
            value={cond.distanceForward ?? ''}
            onValueChange={(v) => {
              const num = parseFloat(v);
              if (v === '' || isNaN(num)) {
                const { distanceForward: _df, ...rest } = cond;
                onUpdate(condition.id, {
                  condition: {
                    ...inner,
                    entityCondition: rest as RelativeClearanceCondition,
                  },
                } as Partial<Condition>);
              } else {
                update({ distanceForward: num });
              }
            }}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Distance Backward (m, optional)</Label>
          <ParameterAwareInput
            elementId={condition.id}
            fieldName="distanceBackward"
            value={cond.distanceBackward ?? ''}
            onValueChange={(v) => {
              const num = parseFloat(v);
              if (v === '' || isNaN(num)) {
                const { distanceBackward: _db, ...rest } = cond;
                onUpdate(condition.id, {
                  condition: {
                    ...inner,
                    entityCondition: rest as RelativeClearanceCondition,
                  },
                } as Partial<Condition>);
              } else {
                update({ distanceBackward: num });
              }
            }}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

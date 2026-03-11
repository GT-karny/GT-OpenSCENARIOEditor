import type {
  Condition,
  ByEntityCondition,
  CollisionCondition,
  CollisionTarget,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { SegmentedControl } from '../SegmentedControl';

const TARGET_KINDS = ['entity', 'objectType'] as const;

interface CollisionConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function CollisionConditionEditor({
  condition,
  onUpdate,
}: CollisionConditionEditorProps) {
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as CollisionCondition;

  const updateTarget = (newTarget: CollisionTarget) => {
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, target: newTarget } },
    } as Partial<Condition>);
  };

  const handleKindChange = (newKind: string) => {
    if (newKind === cond.target.kind) return;
    if (newKind === 'entity') {
      updateTarget({ kind: 'entity', entityRef: '' });
    } else {
      updateTarget({ kind: 'objectType', objectType: '' });
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Collision</p>
      <div className="grid gap-1">
        <Label className="text-[10px]">Target Kind</Label>
        <SegmentedControl
          value={cond.target.kind}
          options={TARGET_KINDS}
          onValueChange={handleKindChange}
          labels={{ entity: 'Entity', objectType: 'Object Type' }}
        />
      </div>
      {cond.target.kind === 'entity' && (
        <div className="grid gap-1">
          <Label className="text-[10px]">Entity Ref</Label>
          <EntityRefSelect
            value={cond.target.entityRef}
            onValueChange={(v) => updateTarget({ kind: 'entity', entityRef: v })}
          />
        </div>
      )}
      {cond.target.kind === 'objectType' && (
        <div className="grid gap-1">
          <Label className="text-[10px]">Object Type</Label>
          <ParameterAwareInput
            elementId={condition.id}
            fieldName="objectType"
            value={cond.target.objectType}
            onValueChange={(v) => updateTarget({ kind: 'objectType', objectType: v })}
            acceptedTypes={['string']}
            className="h-7 text-xs"
          />
        </div>
      )}
    </div>
  );
}

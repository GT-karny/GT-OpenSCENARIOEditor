import type { Trigger, Condition, Position } from '@osce/shared';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { EnumSelect } from './EnumSelect';
import { PositionEditor } from './PositionEditor';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { CONDITION_EDGES, RULES } from '../../constants/osc-enum-values';

interface ConditionPropertyEditorProps {
  trigger: Trigger;
}

export function ConditionPropertyEditor({ trigger }: ConditionPropertyEditorProps) {
  const conditions = trigger.conditionGroups.flatMap((group) => group.conditions);

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b">
        <p className="text-sm font-medium">Trigger</p>
        <p className="text-xs text-muted-foreground">
          {trigger.conditionGroups.length} group{trigger.conditionGroups.length !== 1 ? 's' : ''},{' '}
          {conditions.length} condition{conditions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {conditions.map((condition) => (
        <ConditionItem key={condition.id} condition={condition} />
      ))}

      {conditions.length === 0 && (
        <p className="text-xs text-muted-foreground">No conditions</p>
      )}
    </div>
  );
}

interface ConditionItemProps {
  condition: Condition;
}

function ConditionItem({ condition }: ConditionItemProps) {
  const storeApi = useScenarioStoreApi();

  const handleConditionEdgeChange = (value: string) => {
    storeApi.getState().updateCondition(condition.id, {
      conditionEdge: value as Condition['conditionEdge'],
    });
  };

  const handleRuleChange = (value: string) => {
    const inner = condition.condition;
    if (inner.kind === 'byEntity') {
      const entityCondition = inner.entityCondition;
      if ('rule' in entityCondition) {
        storeApi.getState().updateCondition(condition.id, {
          condition: {
            ...inner,
            entityCondition: { ...entityCondition, rule: value },
          },
        } as Partial<Condition>);
      }
    } else if (inner.kind === 'byValue') {
      const valueCondition = inner.valueCondition;
      if ('rule' in valueCondition) {
        storeApi.getState().updateCondition(condition.id, {
          condition: {
            ...inner,
            valueCondition: { ...valueCondition, rule: value },
          },
        } as Partial<Condition>);
      }
    }
  };

  const handlePositionChange = (newPosition: Position) => {
    const inner = condition.condition;
    if (inner.kind === 'byEntity') {
      const entityCondition = inner.entityCondition;
      if ('position' in entityCondition) {
        storeApi.getState().updateCondition(condition.id, {
          condition: {
            ...inner,
            entityCondition: { ...entityCondition, position: newPosition },
          },
        } as Partial<Condition>);
      }
    }
  };

  const hasRule = (() => {
    const inner = condition.condition;
    if (inner.kind === 'byEntity') {
      return 'rule' in inner.entityCondition;
    }
    if (inner.kind === 'byValue') {
      return 'rule' in inner.valueCondition;
    }
    return false;
  })();

  const currentRule = (() => {
    const inner = condition.condition;
    if (inner.kind === 'byEntity' && 'rule' in inner.entityCondition) {
      return (inner.entityCondition as { rule: string }).rule;
    }
    if (inner.kind === 'byValue' && 'rule' in inner.valueCondition) {
      return (inner.valueCondition as { rule: string }).rule;
    }
    return undefined;
  })();

  const conditionPosition = getConditionPosition(condition);

  return (
    <div className="space-y-2 border-b pb-3">
      <div className="grid gap-1">
        <Label className="text-xs">Name</Label>
        <Input value={condition.name} readOnly className="h-8 text-sm bg-muted" />
      </div>

      <div className="grid gap-1">
        <Label className="text-xs">Condition Edge</Label>
        <EnumSelect
          value={condition.conditionEdge}
          options={CONDITION_EDGES}
          onValueChange={handleConditionEdgeChange}
          className="h-8 text-sm"
        />
      </div>

      {hasRule && currentRule !== undefined && (
        <div className="grid gap-1">
          <Label className="text-xs">Rule</Label>
          <EnumSelect
            value={currentRule}
            options={RULES}
            onValueChange={handleRuleChange}
            className="h-8 text-sm"
          />
        </div>
      )}

      {conditionPosition && (
        <PositionEditor
          position={conditionPosition}
          onChange={handlePositionChange}
        />
      )}
    </div>
  );
}

function getConditionPosition(condition: Condition): Position | null {
  const inner = condition.condition;
  if (inner.kind !== 'byEntity') return null;

  const ec = inner.entityCondition;
  if ('position' in ec && ec.position && typeof ec.position === 'object' && 'type' in ec.position) {
    return ec.position as Position;
  }
  return null;
}

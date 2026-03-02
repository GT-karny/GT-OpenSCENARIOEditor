import type {
  Trigger,
  Condition,
  ByEntityCondition,
  ByValueCondition,
  EntityCondition,
  ValueCondition,
} from '@osce/shared';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { EnumSelect } from './EnumSelect';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { defaultEntityConditionByType, defaultValueConditionByType } from '@osce/scenario-engine';
import {
  CONDITION_EDGES,
  ENTITY_CONDITION_TYPES,
  VALUE_CONDITION_TYPES,
} from '../../constants/osc-enum-values';
import { GenericConditionEditor } from './conditions/GenericConditionEditor';
import { SimulationTimeConditionEditor } from './conditions/SimulationTimeConditionEditor';
import { TimeHeadwayConditionEditor } from './conditions/TimeHeadwayConditionEditor';

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
  const inner = condition.condition;
  const kind = inner.kind;

  const conditionType =
    kind === 'byEntity'
      ? inner.entityCondition.type
      : inner.valueCondition.type;

  const typeOptions =
    kind === 'byEntity'
      ? ([...ENTITY_CONDITION_TYPES] as string[])
      : ([...VALUE_CONDITION_TYPES] as string[]);

  const handleConditionEdgeChange = (value: string) => {
    storeApi.getState().updateCondition(condition.id, {
      conditionEdge: value as Condition['conditionEdge'],
    });
  };

  const handleKindChange = (newKind: string) => {
    let newConditionBody: ByEntityCondition | ByValueCondition;
    if (newKind === 'byEntity') {
      newConditionBody = {
        kind: 'byEntity',
        triggeringEntities: { triggeringEntitiesRule: 'any', entityRefs: [] },
        entityCondition: defaultEntityConditionByType('speed'),
      };
    } else {
      newConditionBody = {
        kind: 'byValue',
        valueCondition: defaultValueConditionByType('simulationTime'),
      };
    }
    storeApi.getState().updateCondition(condition.id, {
      condition: newConditionBody,
    } as Partial<Condition>);
  };

  const handleConditionTypeChange = (newType: string) => {
    let newConditionBody: ByEntityCondition | ByValueCondition;
    if (kind === 'byEntity') {
      newConditionBody = {
        ...inner,
        entityCondition: defaultEntityConditionByType(newType as EntityCondition['type']),
      } as ByEntityCondition;
    } else {
      newConditionBody = {
        ...inner,
        valueCondition: defaultValueConditionByType(newType as ValueCondition['type']),
      } as ByValueCondition;
    }
    storeApi.getState().updateCondition(condition.id, {
      condition: newConditionBody,
    } as Partial<Condition>);
  };

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

      <div className="grid gap-1">
        <Label className="text-xs">Delay (s)</Label>
        <Input
          type="number"
          value={condition.delay}
          onChange={(e) =>
            storeApi.getState().updateCondition(condition.id, {
              delay: parseFloat(e.target.value) || 0,
            })
          }
          className="h-8 text-sm"
        />
      </div>

      <div className="grid gap-1">
        <Label className="text-xs">Kind</Label>
        <EnumSelect
          value={kind}
          options={['byEntity', 'byValue']}
          onValueChange={handleKindChange}
          className="h-8 text-sm"
        />
      </div>

      <div className="grid gap-1">
        <Label className="text-xs">Type</Label>
        <EnumSelect
          value={conditionType}
          options={typeOptions}
          onValueChange={handleConditionTypeChange}
          className="h-8 text-sm"
        />
      </div>

      <div className="pt-1">
        {conditionType === 'simulationTime' && (
          <SimulationTimeConditionEditor condition={condition} />
        )}
        {conditionType === 'timeHeadway' && (
          <TimeHeadwayConditionEditor condition={condition} />
        )}
        {conditionType !== 'simulationTime' && conditionType !== 'timeHeadway' && (
          <GenericConditionEditor condition={condition} />
        )}
      </div>
    </div>
  );
}

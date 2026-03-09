import type {
  Trigger,
  Condition,
  Position,
  ByEntityCondition,
  ByValueCondition,
  EntityCondition,
  ValueCondition,
} from '@osce/shared';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { ParameterAwareInput } from './ParameterAwareInput';
import { EnumSelect } from './EnumSelect';
import { PositionEditor } from './PositionEditor';
import { defaultEntityConditionByType, defaultValueConditionByType } from '@osce/scenario-engine';
import { CONDITION_EDGES, RULES, ENTITY_CONDITION_TYPES, VALUE_CONDITION_TYPES } from '../../constants/osc-enum-values';
import { GenericConditionEditor } from './conditions/GenericConditionEditor';
import { SimulationTimeConditionEditor } from './conditions/SimulationTimeConditionEditor';
import { TimeHeadwayConditionEditor } from './conditions/TimeHeadwayConditionEditor';
import { SpeedConditionEditor } from './conditions/SpeedConditionEditor';
import { DistanceConditionEditor } from './conditions/DistanceConditionEditor';
import { ReachPositionConditionEditor } from './conditions/ReachPositionConditionEditor';
import { StandStillConditionEditor } from './conditions/StandStillConditionEditor';
import { TraveledDistanceConditionEditor } from './conditions/TraveledDistanceConditionEditor';
import { AccelerationConditionEditor } from './conditions/AccelerationConditionEditor';
import { RelativeSpeedConditionEditor } from './conditions/RelativeSpeedConditionEditor';
import { ParameterConditionEditor } from './conditions/ParameterConditionEditor';
import { VariableConditionEditor } from './conditions/VariableConditionEditor';
import { StoryboardElementStateConditionEditor } from './conditions/StoryboardElementStateConditionEditor';
import { TimeToCollisionConditionEditor } from './conditions/TimeToCollisionConditionEditor';
import { TrafficSignalConditionEditor } from './conditions/TrafficSignalConditionEditor';
import { TrafficSignalControllerConditionEditor } from './conditions/TrafficSignalControllerConditionEditor';

// Condition types that have dedicated editors (suppress shared rule/position editors)
const DEDICATED_EDITOR_TYPES = new Set([
  'simulationTime',
  'timeHeadway',
  'speed',
  'distance',
  'reachPosition',
  'standStill',
  'traveledDistance',
  'acceleration',
  'relativeSpeed',
  'timeToCollision',
  'storyboardElementState',
  'parameter',
  'variable',
  'trafficSignal',
  'trafficSignalController',
]);

interface ConditionPropertyEditorProps {
  trigger: Trigger;
  onUpdateCondition: (conditionId: string, partial: Partial<Condition>) => void;
}

export function ConditionPropertyEditor({ trigger, onUpdateCondition }: ConditionPropertyEditorProps) {
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
        <ConditionItem key={condition.id} condition={condition} onUpdateCondition={onUpdateCondition} />
      ))}

      {conditions.length === 0 && (
        <p className="text-xs text-muted-foreground">No conditions</p>
      )}
    </div>
  );
}

interface ConditionItemProps {
  condition: Condition;
  onUpdateCondition: (conditionId: string, partial: Partial<Condition>) => void;
}

export function ConditionItem({ condition, onUpdateCondition }: ConditionItemProps) {
  const handleConditionEdgeChange = (value: string) => {
    onUpdateCondition(condition.id, {
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
    onUpdateCondition(condition.id, {
      condition: newConditionBody,
    } as Partial<Condition>);
  };

  const handleConditionTypeChange = (newType: string) => {
    const inner = condition.condition;
    let newConditionBody: ByEntityCondition | ByValueCondition;
    if (inner.kind === 'byEntity') {
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
    onUpdateCondition(condition.id, {
      condition: newConditionBody,
    } as Partial<Condition>);
  };

  const handleRuleChange = (value: string) => {
    const inner = condition.condition;
    if (inner.kind === 'byEntity') {
      const entityCondition = inner.entityCondition;
      if ('rule' in entityCondition) {
        onUpdateCondition(condition.id, {
          condition: {
            ...inner,
            entityCondition: { ...entityCondition, rule: value },
          },
        } as Partial<Condition>);
      }
    } else if (inner.kind === 'byValue') {
      const valueCondition = inner.valueCondition;
      if ('rule' in valueCondition) {
        onUpdateCondition(condition.id, {
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
        onUpdateCondition(condition.id, {
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

  const conditionKind = condition.condition.kind;

  const conditionType = (() => {
    const inner = condition.condition;
    if (inner.kind === 'byEntity') return inner.entityCondition.type;
    return inner.valueCondition.type;
  })();

  const typeOptions =
    conditionKind === 'byEntity'
      ? ([...ENTITY_CONDITION_TYPES] as string[])
      : ([...VALUE_CONDITION_TYPES] as string[]);

  // Only show generic position editor for conditions without a dedicated editor
  const conditionPosition = DEDICATED_EDITOR_TYPES.has(conditionType)
    ? null
    : getConditionPosition(condition);

  const renderConditionEditor = () => {
    if (conditionType === 'simulationTime') {
      return <SimulationTimeConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'timeHeadway') {
      return <TimeHeadwayConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'speed') {
      return <SpeedConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'distance') {
      return <DistanceConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'reachPosition') {
      return <ReachPositionConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'standStill') {
      return <StandStillConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'traveledDistance') {
      return <TraveledDistanceConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'acceleration') {
      return <AccelerationConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'relativeSpeed') {
      return <RelativeSpeedConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'timeToCollision') {
      return <TimeToCollisionConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'storyboardElementState') {
      return <StoryboardElementStateConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'parameter') {
      return <ParameterConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'variable') {
      return <VariableConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'trafficSignal') {
      return <TrafficSignalConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'trafficSignalController') {
      return <TrafficSignalControllerConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    return <GenericConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
  };

  return (
    <div className="space-y-2 border-b pb-3">
      <div className="grid gap-1">
        <Label className="text-xs">Name</Label>
        <Input value={condition.name} readOnly className="h-8 text-sm bg-muted" />
      </div>

      <div className="grid gap-1">
        <Label className="text-xs">Delay (s)</Label>
        <ParameterAwareInput
          elementId={condition.id}
          fieldName="delay"
          value={condition.delay}
          onValueChange={(v) =>
            onUpdateCondition(condition.id, {
              delay: parseFloat(v) || 0,
            })
          }
          acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
          className="h-8 text-sm"
        />
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
        <Label className="text-xs">Kind</Label>
        <EnumSelect
          value={conditionKind}
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

      {hasRule && currentRule !== undefined && !DEDICATED_EDITOR_TYPES.has(conditionType) && (
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

      <div className="pt-1">
        {renderConditionEditor()}
      </div>
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

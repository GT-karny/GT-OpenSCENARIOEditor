import { useMemo } from 'react';
import type {
  Trigger,
  Condition,
  Position,
  ByEntityCondition,
  ByValueCondition,
  EntityCondition,
  ValueCondition,
} from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { ParameterAwareInput } from './ParameterAwareInput';
import { EnumSelect } from './EnumSelect';
import { PositionEditor } from './PositionEditor';
import { defaultEntityConditionByType, defaultValueConditionByType } from '@osce/scenario-engine';
import {
  CONDITION_EDGES,
  RULES,
  ENTITY_CONDITION_TYPES,
  CONDITION_SUBCATEGORIES,
} from '../../constants/osc-enum-values';
import { Lock } from 'lucide-react';
import { useFeatureGate } from '../../hooks/use-feature-gate';
import { cn } from '@/lib/utils';
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
import { RelativeDistanceConditionEditor } from './conditions/RelativeDistanceConditionEditor';
import { EndOfRoadConditionEditor } from './conditions/EndOfRoadConditionEditor';
import { CollisionConditionEditor } from './conditions/CollisionConditionEditor';
import { OffroadConditionEditor } from './conditions/OffroadConditionEditor';
import { RelativeClearanceConditionEditor } from './conditions/RelativeClearanceConditionEditor';
import { UserDefinedValueConditionEditor } from './conditions/UserDefinedValueConditionEditor';

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
  'relativeDistance',
  'endOfRoad',
  'collision',
  'offroad',
  'relativeClearance',
  'userDefinedValue',
]);

function detectSubcategory(type: string): string {
  for (const sub of CONDITION_SUBCATEGORIES) {
    if ((sub.types as readonly string[]).includes(type)) return sub.key;
  }
  return CONDITION_SUBCATEGORIES[0].key;
}

function isEntityConditionType(type: string): boolean {
  return (ENTITY_CONDITION_TYPES as readonly string[]).includes(type);
}

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
  const { t } = useTranslation('openscenario');
  const { checkCondition } = useFeatureGate();

  const handleConditionEdgeChange = (value: string) => {
    onUpdateCondition(condition.id, {
      conditionEdge: value as Condition['conditionEdge'],
    });
  };

  const conditionType = (() => {
    const inner = condition.condition;
    if (inner.kind === 'byEntity') return inner.entityCondition.type;
    return inner.valueCondition.type;
  })();

  const subcategory = detectSubcategory(conditionType);

  const typeList = useMemo(() => {
    const sub = CONDITION_SUBCATEGORIES.find((s) => s.key === subcategory);
    return sub ? ([...sub.types] as string[]) : [];
  }, [subcategory]);

  const handleConditionTypeChange = (newType: string) => {
    if (newType === conditionType) return;
    let newConditionBody: ByEntityCondition | ByValueCondition;
    if (isEntityConditionType(newType)) {
      const existingEntities =
        condition.condition.kind === 'byEntity'
          ? condition.condition.triggeringEntities
          : { triggeringEntitiesRule: 'any' as const, entityRefs: [] as string[] };
      newConditionBody = {
        kind: 'byEntity',
        triggeringEntities: existingEntities,
        entityCondition: defaultEntityConditionByType(newType as EntityCondition['type']),
      };
    } else {
      newConditionBody = {
        kind: 'byValue',
        valueCondition: defaultValueConditionByType(newType as ValueCondition['type']),
      };
    }
    onUpdateCondition(condition.id, {
      condition: newConditionBody,
    } as Partial<Condition>);
  };

  const handleSubcategoryChange = (newSubKey: string) => {
    if (newSubKey === subcategory) return;
    const sub = CONDITION_SUBCATEGORIES.find((s) => s.key === newSubKey);
    if (sub) {
      handleConditionTypeChange(sub.types[0]);
    }
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
    if (inner.kind !== 'byEntity') return;

    const entityCondition = inner.entityCondition;
    if ('position' in entityCondition) {
      onUpdateCondition(condition.id, {
        condition: {
          ...inner,
          entityCondition: { ...entityCondition, position: newPosition },
        },
      } as Partial<Condition>);
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
    if (conditionType === 'relativeDistance') {
      return <RelativeDistanceConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'endOfRoad') {
      return <EndOfRoadConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'collision') {
      return <CollisionConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'offroad') {
      return <OffroadConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'relativeClearance') {
      return <RelativeClearanceConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
    }
    if (conditionType === 'userDefinedValue') {
      return <UserDefinedValueConditionEditor condition={condition} onUpdate={onUpdateCondition} />;
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

      {/* Subcategory — SegmentedControl tabs */}
      <div className="grid gap-1.5">
        <Label className="text-xs">Category</Label>
        <div className="flex flex-wrap gap-0.5">
          {CONDITION_SUBCATEGORIES.map((sub) => (
            <button
              key={sub.key}
              type="button"
              onClick={() => handleSubcategoryChange(sub.key)}
              className={cn(
                'px-2 py-1 text-xs transition-all',
                subcategory === sub.key
                  ? 'glass-item selected'
                  : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-[var(--color-glass-edge-mid)]',
              )}
            >
              {t(`conditionSubcategories.${sub.key}` as never)}
            </button>
          ))}
        </div>
      </div>

      {/* Type list — flat buttons with descriptions */}
      <div className="grid gap-1.5">
        <Label className="text-xs">Type</Label>
        <div className="mx-4 flex flex-col divide-y divide-border border border-border bg-[var(--color-glass-1)] shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]">
          {typeList.map((type) => {
            const gate = checkCondition(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => gate.allowed && handleConditionTypeChange(type)}
                disabled={!gate.allowed}
                title={gate.allowed ? undefined : gate.reason}
                className={cn(
                  'px-3 py-1.5 text-left transition-all',
                  conditionType === type
                    ? 'glass-item selected'
                    : gate.allowed
                      ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      : 'text-muted-foreground/40 cursor-not-allowed',
                )}
              >
                <span className={cn('text-xs flex items-center justify-between', conditionType === type && 'font-medium')}>
                  <span>{t(`conditionType.${type}` as never)}</span>
                  {!gate.allowed && <Lock className="size-3 text-muted-foreground/40" />}
                </span>
                <span className="block text-[10px] text-muted-foreground mt-0.5">
                  {t(`conditionDescription.${type}` as never)}
                </span>
              </button>
            );
          })}
        </div>
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

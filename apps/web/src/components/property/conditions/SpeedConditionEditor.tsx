import type { Condition, ByEntityCondition, SpeedCondition, DirectionalDimension } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { RuleSegmentedControl } from '../RuleSegmentedControl';
import { SegmentedControl } from '../SegmentedControl';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';
import { useSpeedUnit } from '../../../hooks/use-speed-unit';

const DIRECTIONAL_DIMENSIONS = ['longitudinal', 'lateral', 'vertical'] as const;

interface SpeedConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function SpeedConditionEditor({ condition, onUpdate }: SpeedConditionEditorProps) {
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as SpeedCondition;
  const { label: speedLabel, toDisplay, toInternal } = useSpeedUnit();

  const update = (updates: Partial<SpeedCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  const clearDirection = () => {
    const { direction: _d, ...rest } = cond;
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: rest as SpeedCondition },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Speed</p>
      <div className="grid gap-1">
        <Label className="text-[10px]">Value ({speedLabel})</Label>
        <div className="flex gap-1">
          <ParameterAwareInput
            elementId={condition.id}
            fieldName="value"
            value={toDisplay(cond.value)}
            onValueChange={(v) => update({ value: toInternal(parseFloat(v) || 0) })}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            className="h-7 text-xs flex-1 min-w-0"
          />
          <RuleSegmentedControl
            value={cond.rule}
            onValueChange={(v) => update({ rule: v })}
            className="shrink-0"
          />
        </div>
      </div>
      <OptionalFieldWrapper
        label="Direction"
        hasValue={cond.direction !== undefined}
        onClear={clearDirection}
      >
        <SegmentedControl
          value={cond.direction ?? 'longitudinal'}
          options={DIRECTIONAL_DIMENSIONS}
          onValueChange={(v) => update({ direction: v as DirectionalDimension })}
          labels={{ longitudinal: 'Long', lateral: 'Lat', vertical: 'Vert' }}
        />
      </OptionalFieldWrapper>
    </div>
  );
}

import type { Condition, ByEntityCondition, RelativeClearanceCondition } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefMultiSelect } from '../EntityRefMultiSelect';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';
import { entityConditionReplace, entityConditionUpdate } from '../lib/typed-updates';

interface RelativeClearanceConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function RelativeClearanceConditionEditor({
  condition,
  onUpdate,
}: RelativeClearanceConditionEditorProps) {
  const { t } = useTranslation('common');
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as RelativeClearanceCondition;

  const update = (updates: Partial<RelativeClearanceCondition>) => {
    onUpdate(condition.id, entityConditionUpdate(inner, cond, updates));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        {t('conditionEditors.relativeClearance.title')}
      </p>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={cond.freeSpace}
            onChange={(e) => update({ freeSpace: e.target.checked })}
          />
          {t('conditionEditors.relativeClearance.freeSpace')}
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={cond.oppositeLanes}
            onChange={(e) => update({ oppositeLanes: e.target.checked })}
          />
          {t('conditionEditors.relativeClearance.oppositeLanes')}
        </label>
      </div>
      <div className="grid gap-1">
        <Label className="text-[10px]">{t('conditionEditors.relativeClearance.entityRefs')}</Label>
        <EntityRefMultiSelect
          value={cond.entityRefs}
          onValueChange={(refs) => update({ entityRefs: refs })}
        />
      </div>
      <OptionalFieldWrapper
        label={t('conditionEditors.relativeClearance.distances')}
        hasValue={cond.distanceForward !== undefined || cond.distanceBackward !== undefined}
        onClear={() => {
          const { distanceForward: _df, distanceBackward: _db, ...rest } = cond;
          onUpdate(condition.id, entityConditionReplace(inner, rest));
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label className="text-[10px]">{t('conditionEditors.relativeClearance.forward')}</Label>
            <ParameterAwareInput
              elementId={condition.id}
              fieldName="distanceForward"
              value={cond.distanceForward ?? ''}
              placeholder="—"
              onValueChange={(v) => {
                const num = parseFloat(v);
                if (v === '' || isNaN(num)) {
                  const { distanceForward: _df, ...rest } = cond;
                  onUpdate(condition.id, entityConditionReplace(inner, rest));
                } else {
                  update({ distanceForward: num });
                }
              }}
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px]">{t('conditionEditors.relativeClearance.backward')}</Label>
            <ParameterAwareInput
              elementId={condition.id}
              fieldName="distanceBackward"
              value={cond.distanceBackward ?? ''}
              placeholder="—"
              onValueChange={(v) => {
                const num = parseFloat(v);
                if (v === '' || isNaN(num)) {
                  const { distanceBackward: _db, ...rest } = cond;
                  onUpdate(condition.id, entityConditionReplace(inner, rest));
                } else {
                  update({ distanceBackward: num });
                }
              }}
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </OptionalFieldWrapper>
    </div>
  );
}

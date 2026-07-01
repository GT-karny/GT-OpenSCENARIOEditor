import type { ScenarioAction, SynchronizeAction, Position, FinalSpeed } from '@osce/shared';
import { SPEED_TARGET_VALUE_TYPES } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Label } from '../../ui/label';
import { PositionEditor } from '../PositionEditor';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { SegmentedControl } from '../SegmentedControl';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';
import { actionBody, actionUpdate } from '../lib/typed-updates';
import { useSpeedUnit } from '../../../hooks/use-speed-unit';

interface SynchronizeActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

type FinalSpeedMode = 'absolute' | 'relative';
const FINAL_SPEED_MODES = ['absolute', 'relative'] as const satisfies readonly FinalSpeedMode[];
const VALUE_TYPES = SPEED_TARGET_VALUE_TYPES;

export function SynchronizeActionEditor({ action, onUpdate }: SynchronizeActionEditorProps) {
  const { t } = useTranslation('openscenario');
  const inner = action.action as SynchronizeAction;
  const { label: speedLabel, toDisplay, toInternal } = useSpeedUnit();

  const updateInner = (updates: Partial<SynchronizeAction>) => {
    onUpdate(actionUpdate(inner, updates));
  };

  const handlePositionChange = (
    field: 'targetPositionMaster' | 'targetPosition',
    position: Position,
  ) => {
    updateInner(
      field === 'targetPositionMaster'
        ? { targetPositionMaster: position }
        : { targetPosition: position },
    );
  };

  // Optional numeric tolerance fields ----------------------------------------
  const hasTolerance = inner.tolerance !== undefined || inner.toleranceMaster !== undefined;

  const updateTolerance = (field: 'tolerance' | 'toleranceMaster', value: string) => {
    const n = parseFloat(value);
    if (value === '' || isNaN(n)) {
      const { [field]: _omit, ...rest } = inner;
      onUpdate(actionBody(rest));
    } else {
      updateInner(field === 'tolerance' ? { tolerance: n } : { toleranceMaster: n });
    }
  };

  const clearTolerance = () => {
    const { tolerance: _t, toleranceMaster: _tm, ...rest } = inner;
    onUpdate(actionBody(rest));
  };

  // Optional FinalSpeed ------------------------------------------------------
  const finalSpeed = inner.finalSpeed;
  const finalSpeedMode: FinalSpeedMode = finalSpeed?.relativeSpeedToMaster ? 'relative' : 'absolute';
  const isFactor = finalSpeed?.relativeSpeedToMaster?.speedTargetValueType === 'factor';

  const setFinalSpeed = (next: FinalSpeed | undefined) => {
    if (next === undefined) {
      const { finalSpeed: _fs, ...rest } = inner;
      onUpdate(actionBody(rest));
    } else {
      updateInner({ finalSpeed: next });
    }
  };

  const finalSpeedValue =
    finalSpeedMode === 'relative'
      ? (finalSpeed?.relativeSpeedToMaster?.value ?? 0)
      : (finalSpeed?.absoluteSpeed?.value ?? 0);

  const handleFinalSpeedModeChange = (mode: FinalSpeedMode) => {
    if (mode === finalSpeedMode) return;
    if (mode === 'absolute') {
      setFinalSpeed({ absoluteSpeed: { value: finalSpeedValue } });
    } else {
      setFinalSpeed({
        relativeSpeedToMaster: { value: finalSpeedValue, speedTargetValueType: 'delta' },
      });
    }
  };

  const handleFinalSpeedValueChange = (raw: string) => {
    // Factor is a unitless multiplier; everything else is a speed in m/s.
    const parsed = isFactor ? parseFloat(raw) || 0 : toInternal(parseFloat(raw) || 0);
    if (finalSpeedMode === 'absolute') {
      const steadyState = finalSpeed?.absoluteSpeed?.steadyState;
      setFinalSpeed({ absoluteSpeed: { value: parsed, ...(steadyState ? { steadyState } : {}) } });
    } else {
      const rel = finalSpeed?.relativeSpeedToMaster;
      setFinalSpeed({
        relativeSpeedToMaster: {
          value: parsed,
          speedTargetValueType: rel?.speedTargetValueType ?? 'delta',
          ...(rel?.steadyState ? { steadyState: rel.steadyState } : {}),
        },
      });
    }
  };

  const steadyStateChecked =
    finalSpeedMode === 'relative'
      ? !!finalSpeed?.relativeSpeedToMaster?.steadyState
      : !!finalSpeed?.absoluteSpeed?.steadyState;

  const handleSteadyStateChange = (checked: boolean) => {
    if (finalSpeedMode === 'absolute') {
      setFinalSpeed({
        absoluteSpeed: { value: finalSpeedValue, ...(checked ? { steadyState: true } : {}) },
      });
    } else {
      const rel = finalSpeed?.relativeSpeedToMaster;
      setFinalSpeed({
        relativeSpeedToMaster: {
          value: finalSpeedValue,
          speedTargetValueType: rel?.speedTargetValueType ?? 'delta',
          ...(checked ? { steadyState: true } : {}),
        },
      });
    }
  };

  const finalSpeedLabel =
    finalSpeedMode === 'relative'
      ? isFactor
        ? `${t('synchronizeFields.relativeValue')} (×)`
        : `${t('synchronizeFields.speedValue')} (${speedLabel})`
      : `${t('synchronizeFields.speedValue')} (${speedLabel})`;

  return (
    <div className="space-y-3">
      {/* Master entity (required) */}
      <div className="grid gap-1">
        <Label className="text-xs">{t('synchronizeFields.masterEntity')}</Label>
        <EntityRefSelect
          value={inner.masterEntityRef}
          onValueChange={(v) => updateInner({ masterEntityRef: v })}
        />
      </div>

      {/* Positions */}
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">
          {t('synchronizeFields.masterPosition')}
        </Label>
        <PositionEditor
          position={inner.targetPositionMaster}
          onChange={(p) => handlePositionChange('targetPositionMaster', p)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">
          {t('synchronizeFields.targetPosition')}
        </Label>
        <PositionEditor
          position={inner.targetPosition}
          onChange={(p) => handlePositionChange('targetPosition', p)}
        />
      </div>

      {/* Tolerances (optional) */}
      <OptionalFieldWrapper
        label={t('synchronizeFields.tolerance')}
        hasValue={hasTolerance}
        onClear={clearTolerance}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label className="text-[10px]">{t('synchronizeFields.tolerance')}</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="action.targetTolerance"
              value={inner.tolerance ?? ''}
              placeholder="—"
              onValueChange={(v) => updateTolerance('tolerance', v)}
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px]">{t('synchronizeFields.toleranceMaster')}</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="action.targetToleranceMaster"
              value={inner.toleranceMaster ?? ''}
              placeholder="—"
              onValueChange={(v) => updateTolerance('toleranceMaster', v)}
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </OptionalFieldWrapper>

      {/* Final speed (optional) */}
      <OptionalFieldWrapper
        label={t('synchronizeFields.finalSpeed')}
        hasValue={finalSpeed !== undefined}
        onClear={() => setFinalSpeed(undefined)}
      >
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[10px]">{t('synchronizeFields.finalSpeedMode')}</Label>
            <SegmentedControl
              value={finalSpeedMode}
              options={FINAL_SPEED_MODES}
              onValueChange={handleFinalSpeedModeChange}
              labels={{
                absolute: t('synchronizeFields.absoluteSpeed'),
                relative: t('synchronizeFields.relativeSpeedToMaster'),
              }}
            />
          </div>

          <div className="grid gap-1">
            <Label className="text-xs">{finalSpeedLabel}</Label>
            <div className="flex gap-1">
              <ParameterAwareInput
                elementId={action.id}
                fieldName="action.finalSpeed.value"
                value={isFactor ? finalSpeedValue : toDisplay(finalSpeedValue)}
                onValueChange={handleFinalSpeedValueChange}
                acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
                className="h-8 text-sm flex-1 min-w-0"
              />
              {finalSpeedMode === 'relative' && (
                <SegmentedControl
                  value={finalSpeed?.relativeSpeedToMaster?.speedTargetValueType ?? 'delta'}
                  options={VALUE_TYPES}
                  onValueChange={(v) => {
                    const rel = finalSpeed?.relativeSpeedToMaster;
                    setFinalSpeed({
                      relativeSpeedToMaster: {
                        value: rel?.value ?? 0,
                        speedTargetValueType: v,
                        ...(rel?.steadyState ? { steadyState: rel.steadyState } : {}),
                      },
                    });
                  }}
                  labels={{
                    delta: t('synchronizeFields.delta'),
                    factor: t('synchronizeFields.factor'),
                  }}
                  className="shrink-0"
                />
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={steadyStateChecked}
              onChange={(e) => handleSteadyStateChange(e.target.checked)}
            />
            {t('synchronizeFields.steadyState')}
          </label>
        </div>
      </OptionalFieldWrapper>
    </div>
  );
}

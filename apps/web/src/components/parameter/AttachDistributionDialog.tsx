import { useEffect, useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { Plus, Trash2 } from 'lucide-react';
import type {
  DeterministicSingleDistributionType,
  DistributionRangeBounds,
  Histogram,
  ProbabilityDistributionSet,
  StochasticDistributionType,
} from '@osce/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { EnumSelect } from '../form/EnumSelect';
import {
  DISTRIBUTION_TYPE_LABELS,
  defaultDeterministic,
  defaultStochastic,
  typeOptionsForMode,
  type DeterministicTypeKind,
  type StochasticTypeKind,
} from './distribution-helpers';
import {
  useDistributionStore,
  type DistributionMode,
  type SingleParameterEntry,
} from '../../stores/distribution-store';
import { useDocumentRegistry } from '../../stores/document-registry';

interface AttachDistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parameterName: string;
  mode: DistributionMode;
  /** Existing distribution to edit, if any. */
  initial?: DeterministicSingleDistributionType | StochasticDistributionType;
}

/** Parse a numeric input, tolerating blanks (treated as 0). */
function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function AttachDistributionDialog({
  open,
  onOpenChange,
  parameterName,
  mode,
  initial,
}: AttachDistributionDialogProps) {
  const { t } = useTranslation('common');
  const attachToParameter = useDistributionStore((s) => s.attachToParameter);
  const setFocusedOverride = useDocumentRegistry((s) => s.setFocusedOverride);

  // While open, the distribution is the focused document so Ctrl+Z rewinds
  // distribution edits. Guard on `open` (this dialog is rendered per-parameter,
  // so the many closed instances must not clear an open one's override); clear
  // on close/unmount to return undo routing to the active editor view.
  useEffect(() => {
    if (!open) return;
    setFocusedOverride('distribution');
    return () => setFocusedOverride(null);
  }, [open, setFocusedOverride]);

  const options = typeOptionsForMode(mode);
  const [distribution, setDistribution] = useState<
    DeterministicSingleDistributionType | StochasticDistributionType
  >(
    initial ??
      (mode === 'deterministic' ? defaultDeterministic('range') : defaultStochastic('normal')),
  );

  // Reset local editing state whenever the dialog (re)opens or target changes.
  useEffect(() => {
    if (!open) return;
    setDistribution(
      initial ??
        (mode === 'deterministic' ? defaultDeterministic('range') : defaultStochastic('normal')),
    );
  }, [open, initial, mode]);

  const handleTypeChange = (kind: string) => {
    if (mode === 'deterministic') {
      setDistribution(defaultDeterministic(kind as DeterministicTypeKind));
    } else {
      setDistribution(defaultStochastic(kind as StochasticTypeKind));
    }
  };

  const handleSave = () => {
    const entry: SingleParameterEntry =
      mode === 'deterministic'
        ? {
            mode: 'deterministic',
            parameterName,
            distribution: distribution as DeterministicSingleDistributionType,
          }
        : {
            mode: 'stochastic',
            parameterName,
            distribution: distribution as StochasticDistributionType,
          };
    attachToParameter(entry);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('distributions.attachTitle', { name: parameterName })}</DialogTitle>
          <DialogDescription>{t('distributions.attachDescription')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="dist-type">{t('distributions.type')}</Label>
            <EnumSelect
              value={distribution.kind}
              options={options}
              onValueChange={handleTypeChange}
              className="h-8 text-xs"
            />
          </div>

          <DistributionFields distribution={distribution} onChange={setDistribution} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('buttons.cancel')}
          </Button>
          <Button onClick={handleSave}>{t('distributions.attach')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FieldsProps {
  distribution: DeterministicSingleDistributionType | StochasticDistributionType;
  onChange: (d: DeterministicSingleDistributionType | StochasticDistributionType) => void;
}

/** Per-type field grids. Each branch renders inputs for exactly one kind. */
function DistributionFields({ distribution, onChange }: FieldsProps) {
  const { t } = useTranslation('common');

  switch (distribution.kind) {
    case 'set':
      return (
        <ValueListEditor
          label={t('distributions.values')}
          values={distribution.values}
          onChange={(values) => onChange({ kind: 'set', values })}
        />
      );

    case 'range':
      return (
        <RangeStepRow
          range={distribution.range}
          step={distribution.stepWidth}
          onChange={(range, stepWidth) => onChange({ kind: 'range', stepWidth, range })}
        />
      );

    case 'uniform':
      return (
        <RangeRow
          label={t('distributions.range')}
          range={distribution.range}
          onChange={(range) => onChange({ kind: 'uniform', range })}
        />
      );

    case 'normal':
    case 'logNormal': {
      const kind = distribution.kind;
      return (
        <MomentFields
          expectedValue={distribution.expectedValue}
          variance={distribution.variance}
          range={distribution.range}
          onChange={(expectedValue, variance, range) =>
            onChange({ kind, expectedValue, variance, range })
          }
        />
      );
    }

    case 'poisson':
      return (
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="dist-lambda">{t('distributions.expectedValue')}</Label>
            <Input
              id="dist-lambda"
              type="number"
              value={distribution.expectedValue}
              onChange={(e) =>
                onChange({
                  kind: 'poisson',
                  expectedValue: num(e.target.value),
                  range: distribution.range,
                })
              }
              className="h-8 text-xs"
            />
          </div>
          <OptionalRangeRow
            range={distribution.range}
            onChange={(range) =>
              onChange({ kind: 'poisson', expectedValue: distribution.expectedValue, range })
            }
          />
        </div>
      );

    case 'probabilitySet':
      return <ProbabilitySetEditor distribution={distribution} onChange={(d) => onChange(d)} />;

    case 'histogram':
      return <HistogramEditor distribution={distribution} onChange={(d) => onChange(d)} />;

    case 'userDefined':
      return (
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="dist-udtype">{t('distributions.userType')}</Label>
            <Input
              id="dist-udtype"
              value={distribution.type}
              onChange={(e) =>
                onChange({
                  kind: 'userDefined',
                  type: e.target.value,
                  content: distribution.content,
                })
              }
              className="h-8 text-xs"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dist-udcontent">{t('distributions.content')}</Label>
            <Input
              id="dist-udcontent"
              value={distribution.content}
              onChange={(e) =>
                onChange({ kind: 'userDefined', type: distribution.type, content: e.target.value })
              }
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// Reusable field groups
// ---------------------------------------------------------------------------

function ValueListEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="grid gap-1.5">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={v}
              onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
              className="h-8 text-xs font-mono flex-1"
              placeholder={`Value ${i + 1}`}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove value"
              className="h-8 w-8 shrink-0"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              disabled={values.length <= 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 justify-start text-xs"
        onClick={() => onChange([...values, ''])}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('distributions.addValue')}
      </Button>
    </div>
  );
}

function RangeRow({
  label,
  range,
  onChange,
}: {
  label: string;
  range: DistributionRangeBounds;
  onChange: (range: DistributionRangeBounds) => void;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="grid gap-1 flex-1">
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {t('distributions.lower')}
          </span>
          <Input
            type="number"
            value={range.lowerLimit}
            onChange={(e) => onChange({ ...range, lowerLimit: num(e.target.value) })}
            className="h-8 text-xs"
          />
        </div>
        <div className="grid gap-1 flex-1">
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {t('distributions.upper')}
          </span>
          <Input
            type="number"
            value={range.upperLimit}
            onChange={(e) => onChange({ ...range, upperLimit: num(e.target.value) })}
            className="h-8 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function RangeStepRow({
  range,
  step,
  onChange,
}: {
  range: DistributionRangeBounds;
  step: number;
  onChange: (range: DistributionRangeBounds, step: number) => void;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="grid gap-2">
      <Label>{t('distributions.range')}</Label>
      <div className="flex items-center gap-2">
        <div className="grid gap-1 flex-1">
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {t('distributions.lower')}
          </span>
          <Input
            type="number"
            value={range.lowerLimit}
            onChange={(e) => onChange({ ...range, lowerLimit: num(e.target.value) }, step)}
            className="h-8 text-xs"
          />
        </div>
        <div className="grid gap-1 flex-1">
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {t('distributions.upper')}
          </span>
          <Input
            type="number"
            value={range.upperLimit}
            onChange={(e) => onChange({ ...range, upperLimit: num(e.target.value) }, step)}
            className="h-8 text-xs"
          />
        </div>
        <div className="grid gap-1 flex-1">
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {t('distributions.step')}
          </span>
          <Input
            type="number"
            value={step}
            onChange={(e) => onChange(range, num(e.target.value))}
            className="h-8 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function MomentFields({
  expectedValue,
  variance,
  range,
  onChange,
}: {
  expectedValue: number;
  variance: number;
  range?: DistributionRangeBounds;
  onChange: (expectedValue: number, variance: number, range?: DistributionRangeBounds) => void;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <div className="grid gap-1 flex-1">
          <Label htmlFor="dist-mean">{t('distributions.expectedValue')}</Label>
          <Input
            id="dist-mean"
            type="number"
            value={expectedValue}
            onChange={(e) => onChange(num(e.target.value), variance, range)}
            className="h-8 text-xs"
          />
        </div>
        <div className="grid gap-1 flex-1">
          <Label htmlFor="dist-variance">{t('distributions.variance')}</Label>
          <Input
            id="dist-variance"
            type="number"
            value={variance}
            onChange={(e) => onChange(expectedValue, num(e.target.value), range)}
            className="h-8 text-xs"
          />
        </div>
      </div>
      <OptionalRangeRow range={range} onChange={(r) => onChange(expectedValue, variance, r)} />
    </div>
  );
}

/** An optional (nullable) truncation range with an enable toggle. */
function OptionalRangeRow({
  range,
  onChange,
}: {
  range?: DistributionRangeBounds;
  onChange: (range?: DistributionRangeBounds) => void;
}) {
  const { t } = useTranslation('common');
  const enabled = range !== undefined;
  return (
    <div className="grid gap-2">
      <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) =>
            onChange(e.target.checked ? { lowerLimit: 0, upperLimit: 1 } : undefined)
          }
        />
        {t('distributions.limitRange')}
      </label>
      {enabled && range && (
        <div className="flex items-center gap-2">
          <div className="grid gap-1 flex-1">
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {t('distributions.lower')}
            </span>
            <Input
              type="number"
              value={range.lowerLimit}
              onChange={(e) => onChange({ ...range, lowerLimit: num(e.target.value) })}
              className="h-8 text-xs"
            />
          </div>
          <div className="grid gap-1 flex-1">
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {t('distributions.upper')}
            </span>
            <Input
              type="number"
              value={range.upperLimit}
              onChange={(e) => onChange({ ...range, upperLimit: num(e.target.value) })}
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ProbabilitySetEditor({
  distribution,
  onChange,
}: {
  distribution: ProbabilityDistributionSet;
  onChange: (d: ProbabilityDistributionSet) => void;
}) {
  const { t } = useTranslation('common');
  const { elements } = distribution;
  const update = (next: ProbabilityDistributionSet['elements']) =>
    onChange({ kind: 'probabilitySet', elements: next });
  return (
    <div className="grid gap-2">
      <Label>{t('distributions.valuesWeights')}</Label>
      <div className="grid gap-1.5">
        {elements.map((el, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={el.value}
              onChange={(e) =>
                update(elements.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
              }
              className="h-8 text-xs font-mono flex-1"
              placeholder="Value"
            />
            <Input
              type="number"
              value={el.weight}
              onChange={(e) =>
                update(
                  elements.map((x, j) => (j === i ? { ...x, weight: num(e.target.value) } : x)),
                )
              }
              className="h-8 text-xs w-20"
              placeholder="Weight"
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove element"
              className="h-8 w-8 shrink-0"
              onClick={() => update(elements.filter((_, j) => j !== i))}
              disabled={elements.length <= 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 justify-start text-xs"
        onClick={() => update([...elements, { value: '', weight: 1 }])}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('distributions.addValue')}
      </Button>
    </div>
  );
}

function HistogramEditor({
  distribution,
  onChange,
}: {
  distribution: Histogram;
  onChange: (d: Histogram) => void;
}) {
  const { t } = useTranslation('common');
  const { bins } = distribution;
  const update = (next: Histogram['bins']) => onChange({ kind: 'histogram', bins: next });
  return (
    <div className="grid gap-2">
      <Label>{t('distributions.bins')}</Label>
      <div className="grid gap-1.5">
        {bins.map((bin, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              type="number"
              value={bin.weight}
              onChange={(e) =>
                update(bins.map((x, j) => (j === i ? { ...x, weight: num(e.target.value) } : x)))
              }
              className="h-8 text-xs w-16"
              placeholder="Weight"
            />
            <Input
              type="number"
              value={bin.range.lowerLimit}
              onChange={(e) =>
                update(
                  bins.map((x, j) =>
                    j === i ? { ...x, range: { ...x.range, lowerLimit: num(e.target.value) } } : x,
                  ),
                )
              }
              className="h-8 text-xs flex-1"
              placeholder="Lower"
            />
            <Input
              type="number"
              value={bin.range.upperLimit}
              onChange={(e) =>
                update(
                  bins.map((x, j) =>
                    j === i ? { ...x, range: { ...x.range, upperLimit: num(e.target.value) } } : x,
                  ),
                )
              }
              className="h-8 text-xs flex-1"
              placeholder="Upper"
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove bin"
              className="h-8 w-8 shrink-0"
              onClick={() => update(bins.filter((_, j) => j !== i))}
              disabled={bins.length <= 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 justify-start text-xs"
        onClick={() => update([...bins, { weight: 1, range: { lowerLimit: 0, upperLimit: 1 } }])}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('distributions.addBin')}
      </Button>
    </div>
  );
}

/** Exposed for callers that need the label map (e.g. list summaries). */
export { DISTRIBUTION_TYPE_LABELS };

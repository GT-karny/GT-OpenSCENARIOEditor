import { useMemo, useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { Download, Grid3x3, Play, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SegmentedControl } from '../property/SegmentedControl';
import { PreviewVariantsDialog } from './PreviewVariantsDialog';
import { BatchRunDialog } from './BatchRunDialog';
import { summarizeDistribution, summarizeMultiParameter } from './distribution-helpers';
import {
  useDistributionStore,
  selectMultiParameterEntries,
  selectSingleParameterEntries,
  type DistributionMode,
} from '../../stores/distribution-store';
import { useFileOperations } from '../../hooks/use-file-operations';
import { useWasmSimulation } from '../../hooks/use-wasm-simulation';

const MODE_OPTIONS: readonly DistributionMode[] = ['deterministic', 'stochastic'];

/**
 * The Distributions accordion body: mode segmented control, stochastic settings,
 * a list of attached single-parameter entries (plus read-only multi-parameter
 * value-sets from loaded files), and preview/export actions.
 */
export function DistributionsSection() {
  const { t } = useTranslation('common');
  const document = useDistributionStore((s) => s.document);
  const setMode = useDistributionStore((s) => s.setMode);
  const removeEntry = useDistributionStore((s) => s.removeEntry);
  const setStochasticSettings = useDistributionStore((s) => s.setStochasticSettings);
  const { saveDistribution } = useFileOperations();
  const { startSimulation } = useWasmSimulation();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);

  const mode: DistributionMode = document?.distribution.kind ?? 'deterministic';
  const entries = useMemo(() => selectSingleParameterEntries(document), [document]);
  const multiEntries = useMemo(() => selectMultiParameterEntries(document), [document]);
  const hasEntries = entries.length > 0 || multiEntries.length > 0;

  const stochastic = document?.distribution.kind === 'stochastic' ? document.distribution : null;

  const handleModeChange = (next: DistributionMode) => {
    if (next === mode) return;
    // Switching kind clears entries (XSD allows one kind per document). Confirm
    // only when there is something to lose.
    if (hasEntries && !window.confirm(t('distributions.switchModeConfirm'))) return;
    setMode(next);
  };

  return (
    <div className="px-3 py-2 grid gap-2">
      <SegmentedControl
        value={mode}
        options={MODE_OPTIONS}
        onValueChange={handleModeChange}
        labels={{
          deterministic: t('distributions.deterministic'),
          stochastic: t('distributions.stochastic'),
        }}
      />

      {mode === 'stochastic' && (
        <div className="flex items-center gap-2">
          <div className="grid gap-0.5 flex-1">
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {t('distributions.numberOfTestRuns')}
            </span>
            <Input
              type="number"
              min={1}
              value={stochastic?.numberOfTestRuns ?? 10}
              onChange={(e) =>
                setStochasticSettings({
                  numberOfTestRuns: Math.max(1, Number(e.target.value) || 1),
                  randomSeed: stochastic?.randomSeed,
                })
              }
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-0.5 flex-1">
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {t('distributions.randomSeed')}
            </span>
            <Input
              type="number"
              value={stochastic?.randomSeed ?? ''}
              placeholder={t('distributions.seedOptional')}
              onChange={(e) =>
                setStochasticSettings({
                  numberOfTestRuns: stochastic?.numberOfTestRuns ?? 10,
                  randomSeed: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              className="h-7 text-xs"
            />
          </div>
        </div>
      )}

      <div className="grid gap-0.5">
        {entries.map((entry) => (
          <div
            key={entry.parameterName}
            className="glass-item flex items-center gap-2 px-2 py-1.5 group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium truncate">{entry.parameterName}</p>
              <p className="text-[10px] text-[var(--color-text-secondary)] truncate">
                {summarizeDistribution(entry.distribution)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove distribution"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
              onClick={() => removeEntry(entry.parameterName)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {multiEntries.map((entry, i) => (
          <div
            key={`multi-${i}`}
            className="flex items-center gap-2 px-2 py-1.5 bg-[var(--color-glass-1)]"
            title={t('distributions.multiReadOnly')}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium truncate text-[var(--color-text-secondary)]">
                {t('distributions.valueSets')}
              </p>
              <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                {summarizeMultiParameter(entry)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!hasEntries && (
        <p className="py-2 text-center text-xs text-[var(--color-text-tertiary)]">
          {t('distributions.empty')}
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-7 flex-1 text-xs"
          disabled={!hasEntries}
          onClick={() => setPreviewOpen(true)}
        >
          <Play className="h-3.5 w-3.5 mr-1" />
          {t('distributions.previewVariants')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 flex-1 text-xs"
          disabled={!hasEntries}
          onClick={() => setBatchOpen(true)}
        >
          <Grid3x3 className="h-3.5 w-3.5 mr-1" />
          {t('distributions.batch.run')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={!hasEntries}
          onClick={() => void saveDistribution()}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          {t('buttons.export')}
        </Button>
      </div>

      <PreviewVariantsDialog open={previewOpen} onOpenChange={setPreviewOpen} document={document} />
      <BatchRunDialog
        open={batchOpen}
        onOpenChange={setBatchOpen}
        document={document}
        startSimulation={startSimulation}
      />
    </div>
  );
}

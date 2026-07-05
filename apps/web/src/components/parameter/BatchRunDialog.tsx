import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { Play, X } from 'lucide-react';
import { toast } from 'sonner';
import { generateParameterVariants, type ParameterVariant } from '@osce/scenario-engine';
import { serializeCatalog, XoscSerializer } from '@osce/openscenario';
import type { ParameterValueDistributionDocument, ScenarioDocument } from '@osce/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useCatalogStore } from '../../stores/catalog-store';
import { getSimulationXodr } from '../../lib/simulation-xodr';
import {
  runBatch,
  defaultPoolSize,
  materializeVariant,
  type BatchRunResult,
  type BatchRunStatus,
} from '../../lib/wasm';

interface BatchRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ParameterValueDistributionDocument | null;
  /**
   * The single-run simulation entry point (from useWasmSimulation). Row
   * "Replay" re-runs one variant through this path so frames stream into the
   * simulation store and the viewer plays it.
   */
  startSimulation: (
    xml: string,
    xodrData?: string,
    catalogXmls?: Record<string, string>,
  ) => Promise<void>;
}

/** Batch runs are capped for tractability; the matrix stays readable. */
const MAX_VARIANTS = 64;

/** Collect catalog XMLs from the catalog store (mirrors SimulationButtons). */
function collectCatalogXmls(): Record<string, string> {
  const catalogState = useCatalogStore.getState();
  const catalogXmls: Record<string, string> = {};
  for (const [name] of catalogState.catalogs) {
    const raw = catalogState.rawXmls.get(name);
    if (raw) {
      catalogXmls[name] = raw;
    } else {
      const doc = catalogState.catalogs.get(name);
      if (doc) catalogXmls[name] = serializeCatalog(doc);
    }
  }
  return catalogXmls;
}

// APEX status chips: base token for text, a translucent tint of the same token
// for the pill background (no dedicated -bg tokens exist in the theme).
const STATUS_STYLES: Record<BatchRunStatus, string> = {
  passed:
    'text-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_18%,transparent)]',
  collision:
    'text-[var(--color-destructive)] bg-[color-mix(in_srgb,var(--color-destructive)_18%,transparent)]',
  error:
    'text-[var(--color-warning)] bg-[color-mix(in_srgb,var(--color-warning)_18%,transparent)]',
  incomplete: 'text-[var(--color-text-tertiary)] bg-[var(--color-glass-2)]',
};

/** Render a metric that may be Infinity as an em dash. */
function fmtMetric(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(2);
}

export function BatchRunDialog({
  open,
  onOpenChange,
  document,
  startSimulation,
}: BatchRunDialogProps) {
  const { t } = useTranslation('common');
  const storeApi = useScenarioStoreApi();

  const [results, setResults] = useState<BatchRunResult[]>([]);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const poolSize = useMemo(() => defaultPoolSize(), []);

  // Variants and their column set, generated from the distribution document.
  const { variants, columns } = useMemo(() => {
    if (!open || !document) return { variants: [] as ParameterVariant[], columns: [] as string[] };
    const gen = generateParameterVariants(document.distribution, { maxVariants: MAX_VARIANTS });
    const names = new Set<string>();
    for (const v of gen.variants) for (const k of Object.keys(v)) names.add(k);
    return { variants: gen.variants, columns: Array.from(names) };
  }, [open, document]);

  const handleStart = useCallback(async () => {
    if (variants.length === 0) return;
    const doc: ScenarioDocument = storeApi.getState().document;
    const { xml: xodrData, degraded: xodrDegraded } = getSimulationXodr();
    if (xodrDegraded) {
      toast.warning(t('simulation.degradedRoad'));
    }

    const hasCatalogLocations = Object.values(doc.catalogLocations).some((loc) => loc?.directory);
    const catalogs = collectCatalogXmls();
    if (hasCatalogLocations && Object.keys(catalogs).length === 0) {
      toast.error(t('simulation.missingCatalogs'));
      return;
    }

    const serializer = new XoscSerializer();
    // Materialize once up-front so unmatched-parameter warnings surface before
    // the (long) run, and the per-variant callback stays a cheap lookup.
    const unmatchedAll = new Set<string>();
    const xmls = variants.map((variant) => {
      const { xml, unmatched } = materializeVariant(doc, variant, serializer);
      for (const name of unmatched) unmatchedAll.add(name);
      return xml;
    });
    if (unmatchedAll.size > 0) {
      toast.warning(
        t('distributions.batch.unmatchedParams', { names: Array.from(unmatchedAll).join(', ') }),
      );
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setResults([]);
    setCompleted(0);

    try {
      const all = await runBatch({
        variants,
        buildXoscForVariant: (_variant, index) => xmls[index],
        xodrData,
        catalogs,
        poolSize,
        signal: controller.signal,
        onProgress: ({ completed: done, result }) => {
          setCompleted(done);
          setResults((prev) => {
            const next = [...prev];
            next[result.index] = result;
            return next;
          });
        },
      });
      // Reconcile in case the final progress event lagged the resolve.
      setResults((prev) => {
        const next = [...prev];
        for (const r of all) next[r.index] = r;
        return next;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [variants, storeApi, t, poolSize]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleReplay = useCallback(
    async (result: BatchRunResult) => {
      const doc: ScenarioDocument = storeApi.getState().document;
      const { xml: xodrData, degraded: xodrDegraded } = getSimulationXodr();
      if (xodrDegraded) {
        toast.warning(t('simulation.degradedRoad'));
      }
      const catalogs = collectCatalogXmls();
      const { xml } = materializeVariant(doc, result.params);
      onOpenChange(false);
      toast.info(t('distributions.batch.replayStarted', { index: result.index + 1 }));
      await startSimulation(xml, xodrData, catalogs);
    },
    [storeApi, startSimulation, onOpenChange, t],
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) abortRef.current?.abort();
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const rows = results.filter((r): r is BatchRunResult => r !== undefined);
  const statusLabel = (status: BatchRunStatus): string =>
    ({
      passed: t('distributions.batch.statusPassed'),
      collision: t('distributions.batch.statusCollision'),
      error: t('distributions.batch.statusError'),
      incomplete: t('distributions.batch.statusIncomplete'),
    })[status];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl" data-testid="batch-run-dialog">
        <DialogHeader>
          <DialogTitle>{t('distributions.batch.title')}</DialogTitle>
          <DialogDescription>{t('distributions.batch.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--color-text-secondary)]">
          <span>{t('distributions.batch.summary', { count: variants.length, pool: poolSize })}</span>
          {running && (
            <span data-testid="batch-progress" className="tabular-nums">
              {t('distributions.batch.progress', { completed, total: variants.length })}
            </span>
          )}
        </div>

        <ScrollArea className="max-h-[50vh] border border-[var(--color-glass-edge)]">
          {variants.length === 0 ? (
            <p className="p-4 text-center text-xs text-[var(--color-text-tertiary)]">
              {t('distributions.batch.noVariants')}
            </p>
          ) : (
            <table className="w-full text-[11px] border-collapse" data-testid="batch-matrix">
              <thead className="sticky top-0 bg-[var(--color-glass-1)] backdrop-blur-[40px]">
                <tr>
                  <th className="px-2 py-1 text-left font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-glass-edge)]">
                    #
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-2 py-1 text-left font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-glass-edge)]"
                    >
                      {col}
                    </th>
                  ))}
                  <th className="px-2 py-1 text-left font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-glass-edge)]">
                    {t('distributions.batch.colStatus')}
                  </th>
                  <th className="px-2 py-1 text-right font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-glass-edge)]">
                    {t('distributions.batch.colMinDistance')}
                  </th>
                  <th className="px-2 py-1 text-right font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-glass-edge)]">
                    {t('distributions.batch.colMinTtc')}
                  </th>
                  <th className="px-2 py-1 text-right font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-glass-edge)]">
                    {t('distributions.batch.colDuration')}
                  </th>
                  <th className="px-2 py-1 border-b border-[var(--color-glass-edge)]" />
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, i) => {
                  const result = rows.find((r) => r.index === i);
                  return (
                    <tr
                      key={i}
                      className="hover:bg-[var(--color-glass-hover)]"
                      data-testid="batch-row"
                      data-status={result?.status ?? ''}
                    >
                      <td className="px-2 py-1 text-[var(--color-text-tertiary)] tabular-nums">
                        {i + 1}
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="px-2 py-1 font-mono text-[var(--color-text-primary)]"
                        >
                          {variant[col] ?? ''}
                        </td>
                      ))}
                      <td className="px-2 py-1">
                        {result ? (
                          <span
                            className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[result.status]}`}
                          >
                            {statusLabel(result.status)}
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-tertiary)]">·</span>
                        )}
                      </td>
                      <td className="px-2 py-1 text-right tabular-nums">
                        {result ? fmtMetric(result.minDistance) : ''}
                      </td>
                      <td className="px-2 py-1 text-right tabular-nums">
                        {result ? fmtMetric(result.minTtc) : ''}
                      </td>
                      <td className="px-2 py-1 text-right tabular-nums">
                        {result ? fmtMetric(result.duration) : ''}
                      </td>
                      <td className="px-2 py-1 text-right">
                        {result && result.status !== 'error' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('distributions.batch.replay')}
                            title={t('distributions.batch.replay')}
                            className="h-6 w-6"
                            onClick={() => void handleReplay(result)}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </ScrollArea>

        <DialogFooter>
          {running ? (
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              {t('distributions.batch.cancel')}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t('distributions.batch.close')}
              </Button>
              <Button onClick={() => void handleStart()} disabled={variants.length === 0}>
                <Play className="h-3.5 w-3.5 mr-1.5" />
                {t('distributions.batch.start')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

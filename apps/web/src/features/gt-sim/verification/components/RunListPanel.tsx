/**
 * Left rail for the annotate view: a verdict/label filter, a text search, and
 * a scannable list of runs. Optimized for fast keyboard-driven labeling — the
 * selected row scrolls into view and a label dot shows what's already done.
 *
 * Ported from the fork's `components/verification/RunListPanel.tsx`, restyled
 * with APEX tokens; filter-chip counts now come from
 * `../lib/annotation.countAnnotationRuns` (extracted for unit testing).
 */
import { useEffect, useRef } from 'react';
import { useTranslation } from '@osce/i18n';
import type { AnnotationRun } from '@osce/esmini';
import { countAnnotationRuns, type RunFilter } from '../lib/annotation';

export type { RunFilter } from '../lib/annotation';

const VERDICT_CHIP: Record<string, string> = {
  pass: 'text-[var(--color-success)]',
  fail: 'text-[var(--color-destructive)]',
  'needs-review': 'text-[var(--color-warning)]',
  error: 'text-[var(--color-destructive)]',
};

function verdictGlyph(v: string | null): string {
  if (v === 'pass') return '✓';
  if (v === 'fail') return '✗';
  if (v === 'error') return '!';
  return '⚠'; // needs-review / unknown
}

export function RunListPanel({
  runs,
  allRuns,
  selectedId,
  onSelect,
  filter,
  onFilter,
  search,
  onSearch,
}: {
  /** rows to display (already filtered) */
  runs: AnnotationRun[];
  /** the full set, for filter-chip counts (so counts don't collapse to the active filter) */
  allRuns: AnnotationRun[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filter: RunFilter;
  onFilter: (f: RunFilter) => void;
  search: string;
  onSearch: (s: string) => void;
}) {
  const { t } = useTranslation('common');
  const selRef = useRef<HTMLButtonElement | null>(null);

  // Keep the active row visible as J/K moves the selection.
  useEffect(() => {
    selRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  const counts = countAnnotationRuns(allRuns);

  const filters: { key: RunFilter; label: string }[] = [
    { key: 'all', label: t('gtSim.vd.runList.filterAll') },
    { key: 'unlabeled', label: t('gtSim.vd.runList.filterUnlabeled') },
    { key: 'pass', label: t('gtSim.vd.runList.filterPass') },
    { key: 'fail', label: t('gtSim.vd.runList.filterFail') },
    { key: 'needs-review', label: t('gtSim.vd.runList.filterReview') },
  ];

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Segmented verdict/label filter */}
      <div className="flex flex-wrap gap-0.5 border border-[var(--color-glass-edge)] p-0.5 text-[11px]">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => onFilter(f.key)}
            className={`px-1.5 py-0.5 rounded-none cursor-pointer ${
              filter === f.key
                ? 'bg-[var(--color-accent-vivid)]/80 text-[var(--color-bg-void)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)]'
            }`}
          >
            {f.label} <span className="opacity-60">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={t('gtSim.vd.runList.searchPlaceholder')}
        className="rounded-none bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
      />

      {/* Run rows */}
      <div className="flex-1 min-h-0 overflow-y-auto -mr-1 pr-1 flex flex-col gap-0.5">
        {runs.length === 0 && (
          <div className="text-xs text-[var(--color-text-tertiary)] px-1 py-2">{t('gtSim.vd.runList.noMatches')}</div>
        )}
        {runs.map((r) => {
          const active = r.run_id === selectedId;
          return (
            <button
              key={r.run_id}
              type="button"
              ref={active ? selRef : undefined}
              onClick={() => onSelect(r.run_id)}
              className={`text-left rounded-none px-2 py-1.5 transition-colors cursor-pointer ${
                active ? 'bg-[var(--color-glass-active)]' : 'hover:bg-[var(--color-glass-hover)]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                    r.labeled ? 'bg-[var(--color-accent-vivid)]' : 'bg-transparent border border-[var(--color-glass-edge)]'
                  }`}
                  title={
                    r.labeled
                      ? t('gtSim.vd.runList.labeledTitle', { label: r.label })
                      : t('gtSim.vd.runList.unlabeled')
                  }
                />
                <span className="text-xs text-[var(--color-text-primary)] truncate flex-1">
                  {r.scenario_stem ?? r.run_id}
                </span>
                <span
                  className={`text-[11px] shrink-0 ${VERDICT_CHIP[r.verdict_overall ?? ''] ?? 'text-[var(--color-text-tertiary)]'}`}
                  title={t('gtSim.vd.runList.verdictTitle', { verdict: r.verdict_overall ?? 'n/a' })}
                >
                  {verdictGlyph(r.verdict_overall)}
                </span>
              </div>
              <div className="text-[10px] text-[var(--color-text-tertiary)] truncate pl-3">
                {r.batch_id ? `batch/${r.batch_id}` : r.run_id}
                {r.label && <span className="text-[var(--color-accent-vivid)]"> · {r.label}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

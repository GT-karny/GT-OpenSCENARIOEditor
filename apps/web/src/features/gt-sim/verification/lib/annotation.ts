/**
 * Pure display/filtering logic for the annotation (human-labeling) workflow.
 * No React — unit-testable directly. Extracted from the fork's
 * `VerificationAnnotatePage.tsx` inline `useMemo` blocks (client-side
 * filter/search, "next unlabeled" navigation, batch summary aggregation) and
 * `RunListPanel.tsx` (filter-chip counts) so the logic can be verified without
 * mounting the page.
 */
import type { AnnotationRun } from '@osce/esmini';

export type RunFilter = 'all' | 'unlabeled' | 'pass' | 'fail' | 'needs-review';

/** Client-side filter + free-text search over the full annotation run list. */
export function filterAnnotationRuns(
  runs: AnnotationRun[],
  filter: RunFilter,
  search: string,
): AnnotationRun[] {
  const q = search.trim().toLowerCase();
  return runs.filter((r) => {
    if (filter === 'unlabeled' && r.labeled) return false;
    if (filter === 'pass' && r.verdict_overall !== 'pass') return false;
    if (filter === 'fail' && r.verdict_overall !== 'fail') return false;
    if (filter === 'needs-review' && r.verdict_overall !== 'needs-review') return false;
    if (q && !`${r.scenario_stem ?? ''} ${r.run_id}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export interface AnnotationRunCounts {
  all: number;
  unlabeled: number;
  pass: number;
  fail: number;
  'needs-review': number;
}

/** Filter-chip counts computed over the FULL set (not the active filter). */
export function countAnnotationRuns(runs: AnnotationRun[]): AnnotationRunCounts {
  const c: AnnotationRunCounts = { all: runs.length, unlabeled: 0, pass: 0, fail: 0, 'needs-review': 0 };
  for (const r of runs) {
    if (!r.labeled) c.unlabeled += 1;
    if (r.verdict_overall === 'pass') c.pass += 1;
    else if (r.verdict_overall === 'fail') c.fail += 1;
    else if (r.verdict_overall === 'needs-review') c['needs-review'] += 1;
  }
  return c;
}

/**
 * Find the next unlabeled run after `justLabeledId` in the (already filtered)
 * list, wrapping around to the start if none follow. Returns `null` when
 * every run in the list is labeled.
 */
export function findNextUnlabeled(filtered: AnnotationRun[], justLabeledId: string): string | null {
  const i = filtered.findIndex((x) => x.run_id === justLabeledId);
  for (let j = i + 1; j < filtered.length; j++) {
    if (!filtered[j].labeled) return filtered[j].run_id;
  }
  for (let j = 0; j < filtered.length; j++) {
    if (!filtered[j].labeled && filtered[j].run_id !== justLabeledId) return filtered[j].run_id;
  }
  return null;
}

export interface AnnotationSummary {
  total: number;
  pass: number;
  fail: number;
  'needs-review': number;
  error: number;
  labeled: number;
}

/** Aggregate verdict/label counts across the full run list (SummaryCard). */
export function summarizeAnnotationRuns(runs: AnnotationRun[]): AnnotationSummary {
  const c: AnnotationSummary = { total: runs.length, pass: 0, fail: 0, 'needs-review': 0, error: 0, labeled: 0 };
  for (const r of runs) {
    if (r.labeled) c.labeled += 1;
    const v = r.verdict_overall;
    if (v === 'pass') c.pass += 1;
    else if (v === 'fail') c.fail += 1;
    else if (v === 'needs-review') c['needs-review'] += 1;
    else if (v === 'error') c.error += 1;
  }
  return c;
}

export interface AnnotationBatchSummary {
  id: string;
  total: number;
  labeled: number;
  pass: number;
  fail: number;
}

/** Group runs by `batch_id` (top-level runs bucket under `'(top-level)'`). */
export function summarizeAnnotationBatches(runs: AnnotationRun[]): AnnotationBatchSummary[] {
  const map = new Map<string, AnnotationBatchSummary>();
  for (const r of runs) {
    const key = r.batch_id ?? '(top-level)';
    const e = map.get(key) ?? { id: key, total: 0, labeled: 0, pass: 0, fail: 0 };
    e.total += 1;
    if (r.labeled) e.labeled += 1;
    if (r.verdict_overall === 'pass') e.pass += 1;
    else if (r.verdict_overall === 'fail') e.fail += 1;
    map.set(key, e);
  }
  return [...map.values()];
}

/** Percent-formatted match score for the "suggested from history" panel. */
export function formatMatchScore(score: number): string {
  return `${(score * 100).toFixed(0)}%`;
}

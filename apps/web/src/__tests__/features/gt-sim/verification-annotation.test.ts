import { describe, it, expect } from 'vitest';
import type { AnnotationRun } from '@osce/esmini';
import {
  countAnnotationRuns,
  filterAnnotationRuns,
  findNextUnlabeled,
  formatMatchScore,
  summarizeAnnotationBatches,
  summarizeAnnotationRuns,
} from '../../../features/gt-sim/verification/lib/annotation';

function run(overrides: Partial<AnnotationRun> & { run_id: string }): AnnotationRun {
  return {
    source: 'toplevel',
    batch_id: null,
    scenario: null,
    scenario_stem: null,
    project_id: null,
    scenario_file: null,
    frames: null,
    sim_duration_s: null,
    verdict_overall: null,
    verdict_summary: null,
    has_compare: false,
    has_verdict: false,
    label: null,
    comment: null,
    labeled: false,
    updated_at: null,
    ...overrides,
  };
}

const RUNS: AnnotationRun[] = [
  run({ run_id: 'a', scenario_stem: 'merge_scenario', verdict_overall: 'pass', labeled: true, label: 'pass' }),
  run({ run_id: 'b', scenario_stem: 'yield_scenario', verdict_overall: 'fail', labeled: false }),
  run({ run_id: 'c', scenario_stem: 'crosswalk_scenario', verdict_overall: 'needs-review', labeled: false }),
  run({ run_id: 'd', scenario_stem: 'merge_batch', batch_id: 'batch1', verdict_overall: 'pass', labeled: true, label: 'pass' }),
  run({ run_id: 'e', scenario_stem: 'stop_batch', batch_id: 'batch1', verdict_overall: 'error', labeled: false }),
];

describe('filterAnnotationRuns', () => {
  it('returns everything for filter "all" with no search', () => {
    expect(filterAnnotationRuns(RUNS, 'all', '')).toHaveLength(5);
  });

  it('filters to unlabeled runs only', () => {
    const result = filterAnnotationRuns(RUNS, 'unlabeled', '');
    expect(result.map((r) => r.run_id)).toEqual(['b', 'c', 'e']);
  });

  it('filters by verdict', () => {
    expect(filterAnnotationRuns(RUNS, 'pass', '').map((r) => r.run_id)).toEqual(['a', 'd']);
    expect(filterAnnotationRuns(RUNS, 'fail', '').map((r) => r.run_id)).toEqual(['b']);
    expect(filterAnnotationRuns(RUNS, 'needs-review', '').map((r) => r.run_id)).toEqual(['c']);
  });

  it('applies a case-insensitive free-text search over scenario_stem + run_id', () => {
    expect(filterAnnotationRuns(RUNS, 'all', 'MERGE').map((r) => r.run_id)).toEqual(['a', 'd']);
    expect(filterAnnotationRuns(RUNS, 'all', 'nonexistent')).toEqual([]);
  });

  it('combines filter and search', () => {
    expect(filterAnnotationRuns(RUNS, 'unlabeled', 'batch').map((r) => r.run_id)).toEqual(['e']);
  });
});

describe('countAnnotationRuns', () => {
  it('counts against the full set regardless of the active filter', () => {
    expect(countAnnotationRuns(RUNS)).toEqual({
      all: 5,
      unlabeled: 3,
      pass: 2,
      fail: 1,
      'needs-review': 1,
    });
  });
});

describe('findNextUnlabeled', () => {
  const filtered = [
    run({ run_id: 'a', labeled: true }),
    run({ run_id: 'b', labeled: false }),
    run({ run_id: 'c', labeled: false }),
    run({ run_id: 'd', labeled: true }),
  ];

  it('finds the next unlabeled run after the given id', () => {
    expect(findNextUnlabeled(filtered, 'a')).toBe('b');
  });

  it('skips already-labeled runs while advancing', () => {
    expect(findNextUnlabeled(filtered, 'b')).toBe('c');
  });

  it('wraps around to the start when nothing follows', () => {
    expect(findNextUnlabeled(filtered, 'd')).toBe('b');
  });

  it('returns null when every run is labeled', () => {
    const allLabeled = [run({ run_id: 'x', labeled: true }), run({ run_id: 'y', labeled: true })];
    expect(findNextUnlabeled(allLabeled, 'x')).toBeNull();
  });
});

describe('summarizeAnnotationRuns', () => {
  it('aggregates verdict + labeled counts', () => {
    expect(summarizeAnnotationRuns(RUNS)).toEqual({
      total: 5,
      pass: 2,
      fail: 1,
      'needs-review': 1,
      error: 1,
      labeled: 2,
    });
  });
});

describe('summarizeAnnotationBatches', () => {
  it('groups top-level runs under "(top-level)" and batch runs under their batch_id', () => {
    const batches = summarizeAnnotationBatches(RUNS);
    const topLevel = batches.find((b) => b.id === '(top-level)')!;
    const batch1 = batches.find((b) => b.id === 'batch1')!;
    expect(topLevel).toMatchObject({ total: 3, labeled: 1, pass: 1, fail: 1 });
    expect(batch1).toMatchObject({ total: 2, labeled: 1, pass: 1, fail: 0 });
  });
});

describe('formatMatchScore', () => {
  it('formats a 0-1 score as a rounded percentage', () => {
    expect(formatMatchScore(0.873)).toBe('87%');
    expect(formatMatchScore(1)).toBe('100%');
    expect(formatMatchScore(0)).toBe('0%');
  });
});

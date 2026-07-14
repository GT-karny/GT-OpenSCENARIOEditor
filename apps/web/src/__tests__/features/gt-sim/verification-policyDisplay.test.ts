import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { PolicyConstraint } from '@osce/esmini';
import {
  constraintDetail,
  constraintLabel,
  policySourceColor,
} from '../../../features/gt-sim/verification/lib/policyDisplay';
import { usePolicyLabels } from '../../../features/gt-sim/verification/hooks/usePolicyLabels';
import { initTestI18n } from '../../helpers/render-with-providers';

function constraint(overrides: Partial<PolicyConstraint>): PolicyConstraint {
  return { kind: 'none', s: 0, value: 0, source: 'traffic_light', ...overrides };
}

beforeAll(async () => {
  await initTestI18n();
});

describe('policyDisplay (pure)', () => {
  it('maps known sources to a color, and falls back for unknown ones', () => {
    expect(policySourceColor('stop_sign')).toBe('#E03131');
    expect(policySourceColor('unknown_source')).toBe('#9AA7FF');
  });

  it('formats a rich detail line per constraint kind', () => {
    expect(constraintDetail(constraint({ kind: 'stop_at_s', s: 42 }))).toBe('in 42 m');
    expect(constraintDetail(constraint({ kind: 'yield', s: 8.4 }))).toBe('in 8 m');
    expect(constraintDetail(constraint({ kind: 'max_speed', value: 13.9 }))).toBe('13.9 m/s (50 km/h)');
    expect(constraintDetail(constraint({ kind: 'max_speed_to_s', value: 8.3, s: 120 }))).toBe(
      '8.3 m/s (30 km/h) for 120 m',
    );
    expect(constraintDetail(constraint({ kind: 'wait_until', value: 3.5 }))).toBe('3.5 s');
    expect(constraintDetail(constraint({ kind: 'none' }))).toBe('');
  });

  it('formats a compact single-token label per constraint kind', () => {
    expect(constraintLabel(constraint({ kind: 'stop_at_s', s: 42 }))).toBe('stop @42 m');
    expect(constraintLabel(constraint({ kind: 'max_speed', value: 13.9 }))).toBe('max 13.9 m/s');
    expect(constraintLabel(constraint({ kind: 'max_speed_to_s', value: 8.3, s: 120 }))).toBe(
      'max 8.3 m/s →120 m',
    );
    expect(constraintLabel(constraint({ kind: 'yield', s: 5 }))).toBe('yield @5 m');
    expect(constraintLabel(constraint({ kind: 'wait_until', value: 2 }))).toBe('wait 2.0 s');
    // Unmapped kinds fall back to the raw kind string.
    expect(constraintLabel(constraint({ kind: 'none' }))).toBe('none');
  });
});

describe('usePolicyLabels (i18n)', () => {
  it('maps known sources to translated labels and falls back to the raw id', () => {
    const { result } = renderHook(() => usePolicyLabels());
    expect(result.current.sourceLabel('stop_sign')).toBe('Stop sign');
    expect(result.current.sourceLabel('traffic_light')).toBe('Traffic light');
    expect(result.current.sourceLabel('unknown_source')).toBe('unknown_source');
  });

  it('maps known constraint kinds to translated labels', () => {
    const { result } = renderHook(() => usePolicyLabels());
    expect(result.current.kindLabel('stop_at_s')).toBe('Stop');
    expect(result.current.kindLabel('max_speed')).toBe('Speed limit');
    expect(result.current.kindLabel('max_speed_to_s')).toBe('Speed limit');
    expect(result.current.kindLabel('yield')).toBe('Yield');
    expect(result.current.kindLabel('wait_until')).toBe('Wait');
    expect(result.current.kindLabel('none')).toBe('None');
  });
});

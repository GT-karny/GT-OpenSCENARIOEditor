/**
 * [F5 / Phase 4] Live traffic-policy decision panel.
 *
 * Renders what the VirtualDriver is deciding *right now* and why: one row per
 * active PolicyConstraint (see `@osce/esmini` `gt-sim-api-types.ts` /
 * `VirtualDriverTelemetryJson.cpp` `policy` block) with its source (traffic
 * light / stop sign / conflict point / crosswalk / …), decision kind (Stop /
 * Speed limit / Yield / Wait), the value (distance ahead in m, target speed
 * in m/s + km/h), and how long that constraint has been continuously active
 * (derived from the frame history).
 *
 * Rows are ordered nearest-first (smallest s) so the most imminent decision
 * sits on top. Degrades to a neutral empty state for pre-Phase-3 telemetry (no
 * `policy` field), an invalid snapshot (`policy.valid === false`), or a clear
 * road (no constraints) — it never throws on missing data.
 *
 * Ported unchanged (logic) from the fork's
 * `components/verification/ActivePolicyPanel.tsx`, restyled with APEX tokens.
 * Complements `PolicyTimelinePanel`: this is the current decision detail,
 * that is the activity-over-time history. Colours are shared via
 * `../lib/policyDisplay`, i18n labels via `../hooks/usePolicyLabels`.
 */
import { useMemo } from 'react';
import { useTranslation } from '@osce/i18n';
import type { PolicyConstraint, PolicyConstraintKind, VdTelemetryFrame } from '@osce/esmini';
import { constraintDetail, policySourceColor } from '../lib/policyDisplay';
import { usePolicyLabels } from '../hooks/usePolicyLabels';

interface ActiveConstraint {
  c: PolicyConstraint;
  /** Seconds the (source, kind) constraint has been continuously active. */
  activeFor: number;
}

/** Stable key for matching "the same" constraint across frames. */
const keyOf = (c: PolicyConstraint) => `${c.source}|${c.kind}`;

/* Display order: the imminent "must act" decisions first (stop, then yield,
 * then a speed-limited zone ahead), then standing speed caps (max_speed
 * carries s=0 — a global cap, not a 0 m point), then time waits. Within a
 * rank, nearer (smaller s) first. */
const KIND_ORDER: Record<PolicyConstraintKind, number> = {
  stop_at_s: 0,
  yield: 1,
  max_speed_to_s: 2,
  max_speed: 3,
  wait_until: 4,
  none: 5,
};

function compareConstraints(a: PolicyConstraint, b: PolicyConstraint): number {
  const ra = KIND_ORDER[a.kind] ?? 9;
  const rb = KIND_ORDER[b.kind] ?? 9;
  if (ra !== rb) return ra - rb;
  return a.s - b.s;
}

function computeActive(frames: VdTelemetryFrame[]): ActiveConstraint[] {
  if (!frames.length) return [];
  const last = frames.length - 1;
  const cur = frames[last];
  if (!cur.policy?.valid) return [];
  const constraints = cur.policy.constraints ?? [];
  if (constraints.length === 0) return [];

  const tNow = cur.sim_time;
  return constraints
    .map((c) => {
      // Walk back while a matching (source, kind) constraint stays present.
      let start = last;
      for (let j = last; j >= 0; j--) {
        const has = (frames[j].policy?.constraints ?? []).some((o) => keyOf(o) === keyOf(c));
        if (!has) break;
        start = j;
      }
      return { c, activeFor: Math.max(0, tNow - frames[start].sim_time) };
    })
    .sort((a, b) => compareConstraints(a.c, b.c));
}

function EmptyNote({ text }: { text: string }) {
  return <div className="text-[11px] text-[var(--color-text-tertiary)] py-1">{text}</div>;
}

export function ActivePolicyPanel({ frames }: { frames: VdTelemetryFrame[] }) {
  const { t } = useTranslation('common');
  const { sourceLabel, kindLabel } = usePolicyLabels();
  const active = useMemo(() => computeActive(frames), [frames]);

  if (!frames.length) return null;
  const cur = frames[frames.length - 1];

  let body: React.ReactNode;
  if (!cur.policy) {
    body = <EmptyNote text={t('gtSim.vd.policy.noTelemetry')} />;
  } else if (active.length === 0) {
    body = <EmptyNote text={t('gtSim.vd.policy.clearRoad')} />;
  } else {
    body = (
      <div className="space-y-1">
        {active.map(({ c, activeFor }, i) => (
          <div
            key={`${keyOf(c)}-${i}`}
            className="flex items-center gap-2 rounded-none bg-[var(--color-glass-1)] px-2 py-1"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: policySourceColor(c.source) }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px]" style={{ color: policySourceColor(c.source) }}>
                  {sourceLabel(c.source)}
                </span>
                <span className="shrink-0 rounded-none bg-[var(--color-glass-2)] px-1 text-[9px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  {kindLabel(c.kind)}
                </span>
              </div>
              <div className="font-mono text-[10px] text-[var(--color-text-primary)]">{constraintDetail(c)}</div>
            </div>
            <span
              className="shrink-0 font-mono text-[9px] text-[var(--color-text-tertiary)]"
              title={t('gtSim.vd.policy.activeForTitle')}
            >
              {activeFor.toFixed(1)}s
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-[var(--color-glass-edge)] p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] text-[var(--color-text-tertiary)]">{t('gtSim.vd.policy.activeTitle')}</span>
        {active.length > 0 && <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{active.length}</span>}
      </div>
      {body}
    </div>
  );
}

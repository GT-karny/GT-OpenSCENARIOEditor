/**
 * Shared presentation helpers for VirtualDriver traffic-policy constraints.
 *
 * Ported from the GT_Sim fork's `lib/policyDisplay.ts`. Single source of truth
 * for how a PolicyConstraint (see `@osce/esmini` `gt-sim-api-types.ts` and the
 * C++ serializer VirtualDriverTelemetryJson.cpp `policy` block) is coloured
 * and value-formatted, so the live decision panel (ActivePolicyPanel) and the
 * history timeline (PolicyTimelinePanel) agree. Pure — no React, no i18n — so
 * it can be unit tested and reused anywhere. Human-readable source/kind labels
 * (hardcoded English in the fork) moved to `../hooks/usePolicyLabels.ts` so
 * they go through i18n.
 *
 * Emitted `source` strings (from GT_esmini/src/control/virtualdriver/policies/*):
 *   traffic_light, stop_sign, yield_sign, lead_vehicle, conflict_point, crosswalk
 */
import type { PolicyConstraint } from '@osce/esmini';

const SOURCE_COLOR: Record<string, string> = {
  traffic_light: '#E8A24F',
  stop_sign: '#E03131',
  yield_sign: '#E0568A',
  lead_vehicle: '#4F9DE8',
  conflict_point: '#B08CF0',
  crosswalk: '#3FB8A0',
};

const FALLBACK_COLOR = '#9AA7FF';

export function policySourceColor(source: string): string {
  return SOURCE_COLOR[source] ?? FALLBACK_COLOR;
}

/** m/s -> whole km/h, for the readable speed detail. */
function kmh(mps: number): number {
  return Math.round(mps * 3.6);
}

/**
 * Rich, human-readable detail line for a constraint: distance and/or target
 * speed depending on the kind. Unit-only formatting (m / m/s / km/h / s) —
 * locale-neutral by design, so it stays out of i18n.
 */
export function constraintDetail(c: PolicyConstraint): string {
  switch (c.kind) {
    case 'stop_at_s':
      return `in ${c.s.toFixed(0)} m`;
    case 'yield':
      return `in ${c.s.toFixed(0)} m`;
    case 'max_speed':
      return `${c.value.toFixed(1)} m/s (${kmh(c.value)} km/h)`;
    case 'max_speed_to_s':
      return `${c.value.toFixed(1)} m/s (${kmh(c.value)} km/h) for ${c.s.toFixed(0)} m`;
    case 'wait_until':
      return `${c.value.toFixed(1)} s`;
    default:
      return '';
  }
}

/** Compact single-token label used by the timeline's current-frame readout. */
export function constraintLabel(c: PolicyConstraint): string {
  switch (c.kind) {
    case 'stop_at_s':
      return `stop @${c.s.toFixed(0)} m`;
    case 'max_speed':
      return `max ${c.value.toFixed(1)} m/s`;
    case 'max_speed_to_s':
      return `max ${c.value.toFixed(1)} m/s →${c.s.toFixed(0)} m`;
    case 'yield':
      return `yield @${c.s.toFixed(0)} m`;
    case 'wait_until':
      return `wait ${c.value.toFixed(1)} s`;
    default:
      return c.kind;
  }
}

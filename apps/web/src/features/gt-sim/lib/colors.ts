/**
 * Shared VD (VirtualDriver) visualization color constants.
 *
 * `MidLongConstraint['kind']` -> color was independently duplicated in
 * `live/lib/sceneGeometry.ts` (`MANEUVER_COLOR`, 2D live-scene constraint
 * markers) and `verification/components/VTargetProfileChart.tsx`
 * (`KIND_COLOR`, the v_target profile chart) with identical values (WP5
 * cross-cluster cleanup — see final report). Promoted here so both clusters
 * import the same constant instead of keeping two copies in sync by hand.
 */
import type { MidLongConstraint } from '@osce/esmini';

export const MID_LONG_CONSTRAINT_COLOR: Record<MidLongConstraint['kind'], string> = {
  curve: '#E8A24F',
  junction: '#E0568A',
  speed_limit: '#4F9DE8',
  stop: '#E03131',
};

/**
 * Road builder: creates a complete OdrRoad from partial input and optional lane preset.
 */

import type { OdrRoad, OdrLane, OdrLaneSection } from '@osce/shared';
import { generateRoadId } from '../operations/road-operations.js';
import { createDefaultCenterLane } from '../store/defaults.js';
import type { LanePreset } from './lane-presets.js';

/**
 * Build a lane with the given ID, type, and width.
 */
function buildLane(id: number, type: string, width: number): OdrLane {
  return {
    id,
    type,
    width: [{ sOffset: 0, a: width, b: 0, c: 0, d: 0 }],
    roadMarks: [{ sOffset: 0, type: 'solid', color: 'standard' }],
  };
}

/**
 * Build a lane section from a lane preset.
 * Left lanes get positive IDs (1, 2, ...), right lanes get negative IDs (-1, -2, ...).
 */
function buildLaneSectionFromPreset(preset: LanePreset): OdrLaneSection {
  const leftLanes = preset.leftLanes.map((def, i) => buildLane(i + 1, def.type, def.width));
  const rightLanes = preset.rightLanes.map((def, i) => buildLane(-(i + 1), def.type, def.width));
  return {
    s: 0,
    leftLanes,
    centerLane: createDefaultCenterLane(),
    rightLanes,
  };
}

/**
 * Create a complete OdrRoad from a partial definition and optional lane preset.
 * Missing fields are filled with sensible defaults.
 */
export function createRoadFromPartial(partial: Partial<OdrRoad>, preset?: LanePreset): OdrRoad {
  const id = partial.id ?? generateRoadId();
  const length = partial.length ?? 100;

  const lanes: OdrLaneSection[] = partial.lanes ??
    (preset ? [buildLaneSectionFromPreset(preset)] : [{
      s: 0,
      leftLanes: [buildLane(1, 'driving', 3.5)],
      centerLane: createDefaultCenterLane(),
      rightLanes: [buildLane(-1, 'driving', 3.5)],
    }]);

  return {
    id,
    name: partial.name ?? '',
    length,
    junction: partial.junction ?? '-1',
    rule: partial.rule,
    link: partial.link,
    type: partial.type,
    planView: partial.planView ?? [{ s: 0, x: 0, y: 0, hdg: 0, length, type: 'line' }],
    elevationProfile: partial.elevationProfile ?? [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
    lateralProfile: partial.lateralProfile ?? [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
    laneOffset: partial.laneOffset ?? [],
    lanes,
    objects: partial.objects ?? [],
    signals: partial.signals ?? [],
  };
}

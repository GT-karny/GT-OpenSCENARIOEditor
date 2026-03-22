/**
 * Junction topology classification.
 *
 * Classifies the topology of an intersection (T-junction, X-junction,
 * Y-junction, or merge) based on the crossing angle and the position
 * of the intersection on each road.
 *
 * This classification is used by planJunctionCreation() to determine:
 * - Whether to split a road or keep it whole (T-junctions)
 * - How to adjust split distances (Y-junctions)
 * - Whether to skip junction creation entirely (merges)
 */

import type { OdrRoad } from '@osce/shared';

/**
 * The topology type of a junction.
 *
 * - T-junction: one road ends at the other (3 arms)
 * - X-junction: two roads cross in the middle (4 arms)
 * - Y-junction: two roads cross at an acute angle (4 arms, tight geometry)
 * - merge: roads are nearly parallel (skip junction creation)
 */
export type JunctionTopology = 'T-junction' | 'X-junction' | 'Y-junction' | 'merge';

/**
 * Describes how a road participates in a junction.
 *
 * - 'before-only': only the before segment exists (intersection at road end)
 * - 'after-only': only the after segment exists (intersection at road start)
 * - 'both': road is split into before + after segments (normal crossing)
 */
export type ArmSide = 'before-only' | 'after-only' | 'both';

export interface JunctionArm {
  roadId: string;
  side: ArmSide;
}

export interface TopologyInfo {
  topology: JunctionTopology;
  /** Number of road arms at the junction (3 for T, 4 for X/Y, 0 for merge). */
  armCount: number;
  /** Per-road arm information. */
  arms: JunctionArm[];
  /** Angle between the two roads in radians [0, PI]. */
  angle: number;
}

/** Angle thresholds in radians. */
const MERGE_ANGLE = (15 * Math.PI) / 180; // < 15° → merge (too parallel)
const Y_JUNCTION_LOW = (15 * Math.PI) / 180; // 15°-45° → Y-junction
const Y_JUNCTION_HIGH = (45 * Math.PI) / 180;

/**
 * Classify the junction topology for an intersection between two roads.
 *
 * @param sA s-coordinate of intersection on road A
 * @param sB s-coordinate of intersection on road B
 * @param angle Intersection angle in radians [0, PI]
 * @param roadA The first road
 * @param roadB The second road
 * @param minSegLen Minimum segment length to consider a road split viable (default: 1m)
 */
export function classifyTopology(
  sA: number,
  sB: number,
  angle: number,
  roadA: OdrRoad,
  roadB: OdrRoad,
  minSegLen = 1,
): TopologyInfo {
  // --- Merge check: nearly parallel roads ---
  if (angle < MERGE_ANGLE || angle > Math.PI - MERGE_ANGLE) {
    return {
      topology: 'merge',
      armCount: 0,
      arms: [],
      angle,
    };
  }

  // --- Determine arm sides for each road ---
  const armA = classifyArmSide(sA, roadA.length, minSegLen);
  const armB = classifyArmSide(sB, roadB.length, minSegLen);

  const arms: JunctionArm[] = [
    { roadId: roadA.id, side: armA },
    { roadId: roadB.id, side: armB },
  ];

  const armCount = countArms(armA) + countArms(armB);

  // --- T-junction: one road is split, the other only has one side ---
  const isT = armA !== 'both' || armB !== 'both';
  if (isT) {
    return {
      topology: 'T-junction',
      armCount,
      arms,
      angle,
    };
  }

  // --- Y-junction vs X-junction ---
  const normalizedAngle = angle <= Math.PI / 2 ? angle : Math.PI - angle;
  if (normalizedAngle >= Y_JUNCTION_LOW && normalizedAngle < Y_JUNCTION_HIGH) {
    return {
      topology: 'Y-junction',
      armCount,
      arms,
      angle,
    };
  }

  return {
    topology: 'X-junction',
    armCount,
    arms,
    angle,
  };
}

/**
 * Determine which arm sides a road contributes based on the intersection position.
 */
function classifyArmSide(s: number, roadLength: number, minSegLen: number): ArmSide {
  const hasBeforeSeg = s >= minSegLen;
  const hasAfterSeg = roadLength - s >= minSegLen;

  if (hasBeforeSeg && hasAfterSeg) return 'both';
  if (hasBeforeSeg) return 'before-only';
  return 'after-only';
}

/**
 * Count arms contributed by a road.
 */
function countArms(side: ArmSide): number {
  return side === 'both' ? 2 : 1;
}

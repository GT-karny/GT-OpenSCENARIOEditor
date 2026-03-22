/**
 * Inverse coordinate lookup: convert world (x, y) to road/lane coordinates.
 * Uses coarse sampling + bisection refinement for accuracy.
 */

import type { OpenDriveDocument, OdrRoad, OdrLaneSection } from '@osce/shared';
import { evaluateReferenceLineAtS } from './reference-line.js';
import { computeLaneInnerT, computeLaneOuterT } from './lane-boundary.js';
import { evaluateLaneOffset } from './lane-offset.js';
import { evaluateElevation } from './elevation.js';
import { computeDrivingHeading } from './driving-direction.js';
import { findRecordAtS } from '../utils/math.js';

export interface RoadLookupResult {
  roadId: string;
  s: number;
  t: number;
  /** Distance from the query point to the nearest point on the road */
  distance: number;
}

export interface LaneLookupResult {
  roadId: string;
  laneId: number;
  s: number;
  /** Offset from lane center (positive = away from center line) */
  offset: number;
  /** Driving direction heading at this position */
  heading: number;
  /** Z elevation at this position */
  z: number;
  /** Road t-coordinate (lateral offset from reference line, left = positive) */
  roadT: number;
  /** Distance from query point to the matched road position */
  distance: number;
}

/**
 * Compute the squared distance from a world point (wx, wy) to a road at parameter s.
 * Also returns the t-coordinate (signed lateral offset).
 */
function distanceToRoadAtS(
  road: OdrRoad,
  s: number,
  wx: number,
  wy: number,
): { distSq: number; t: number } {
  const pose = evaluateReferenceLineAtS(road.planView, s);
  const dx = wx - pose.x;
  const dy = wy - pose.y;
  // t = perpendicular distance (left = positive)
  const perpX = -Math.sin(pose.hdg);
  const perpY = Math.cos(pose.hdg);
  const t = dx * perpX + dy * perpY;
  // Along-road component
  const along = dx * Math.cos(pose.hdg) + dy * Math.sin(pose.hdg);
  // Squared distance to the closest point on the reference line at this s
  // is approximately t^2 (when s is the closest point, along ≈ 0)
  const distSq = t * t + along * along;
  return { distSq, t };
}

/**
 * Find the nearest road and (s, t) coordinates for a world position.
 *
 * @param doc - OpenDRIVE document
 * @param wx - World X coordinate
 * @param wy - World Y coordinate
 * @param maxDistance - Maximum distance threshold (default 50m)
 * @returns Nearest road coordinates or null if too far from any road
 */
export function worldToRoad(
  doc: OpenDriveDocument,
  wx: number,
  wy: number,
  maxDistance = 50,
): RoadLookupResult | null {
  let bestResult: RoadLookupResult | null = null;
  let bestDistSq = maxDistance * maxDistance;

  for (const road of doc.roads) {
    if (road.planView.length === 0) continue;

    const roadLength = road.length;
    const coarseStep = Math.max(2, roadLength / 100); // 2m or 1% of road length

    // Coarse pass: sample at regular intervals
    let bestS = 0;
    let bestLocalDistSq = Infinity;

    for (let s = 0; s <= roadLength; s += coarseStep) {
      const { distSq } = distanceToRoadAtS(road, Math.min(s, roadLength), wx, wy);
      if (distSq < bestLocalDistSq) {
        bestLocalDistSq = distSq;
        bestS = s;
      }
    }
    // Also check endpoint
    {
      const { distSq } = distanceToRoadAtS(road, roadLength, wx, wy);
      if (distSq < bestLocalDistSq) {
        bestLocalDistSq = distSq;
        bestS = roadLength;
      }
    }

    // Early skip if this road can't beat current best
    if (bestLocalDistSq > bestDistSq * 4) continue;

    // Refinement pass: bisection around best coarse sample
    let lo = Math.max(0, bestS - coarseStep);
    let hi = Math.min(roadLength, bestS + coarseStep);

    for (let i = 0; i < 20; i++) {
      const mid1 = lo + (hi - lo) / 3;
      const mid2 = hi - (hi - lo) / 3;
      const d1 = distanceToRoadAtS(road, mid1, wx, wy);
      const d2 = distanceToRoadAtS(road, mid2, wx, wy);

      if (d1.distSq < d2.distSq) {
        hi = mid2;
        if (d1.distSq < bestLocalDistSq) {
          bestLocalDistSq = d1.distSq;
          bestS = mid1;
        }
      } else {
        lo = mid1;
        if (d2.distSq < bestLocalDistSq) {
          bestLocalDistSq = d2.distSq;
          bestS = mid2;
        }
      }

      if (hi - lo < 0.01) break; // 1cm precision
    }

    if (bestLocalDistSq < bestDistSq) {
      const { t } = distanceToRoadAtS(road, bestS, wx, wy);
      bestDistSq = bestLocalDistSq;
      bestResult = {
        roadId: road.id,
        s: bestS,
        t,
        distance: Math.sqrt(bestLocalDistSq),
      };
    }
  }

  return bestResult;
}

/**
 * Find the lane section at a given s coordinate.
 */
function findLaneSectionAtS(road: OdrRoad, s: number): OdrLaneSection | undefined {
  return findRecordAtS(road.lanes, s, (ls) => ls.s);
}

/**
 * Find the nearest lane and compute lane coordinates from world position.
 *
 * @param doc - OpenDRIVE document
 * @param wx - World X coordinate
 * @param wy - World Y coordinate
 * @param maxDistance - Maximum distance threshold (default 50m)
 * @param reverse - Whether to compute reverse driving heading
 * @returns Lane coordinates or null if too far from any lane
 */
export function worldToLane(
  doc: OpenDriveDocument,
  wx: number,
  wy: number,
  maxDistance = 50,
  reverse = false,
): LaneLookupResult | null {
  const roadResult = worldToRoad(doc, wx, wy, maxDistance);
  if (!roadResult) return null;

  const road = doc.roads.find((r) => r.id === roadResult.roadId);
  if (!road) return null;

  const laneSection = findLaneSectionAtS(road, roadResult.s);
  if (!laneSection) return null;

  const dsFromSectionStart = roadResult.s - laneSection.s;
  const t = roadResult.t;

  // Search through all lanes (left and right) to find which lane contains this t value
  let bestLaneId = 0;
  let bestOffset = 0;
  let bestLaneDistSq = Infinity;

  const allLanes = [...(laneSection.leftLanes ?? []), ...(laneSection.rightLanes ?? [])];
  const laneOff = evaluateLaneOffset(road.laneOffset, roadResult.s);

  for (const lane of allLanes) {
    if (lane.id === 0) continue; // Skip center lane

    const innerT = computeLaneInnerT(laneSection, lane, dsFromSectionStart) + laneOff;
    const outerT = computeLaneOuterT(laneSection, lane, dsFromSectionStart) + laneOff;

    const minT = Math.min(innerT, outerT);
    const maxT = Math.max(innerT, outerT);
    const centerT = (innerT + outerT) / 2;

    if (t >= minT && t <= maxT) {
      // Point is inside this lane
      const offset = t - centerT;
      bestLaneId = lane.id;
      bestOffset = offset;
      bestLaneDistSq = 0;
      break;
    }

    // Track closest lane even if not inside
    const distToLane = t < minT ? (minT - t) * (minT - t) : (t - maxT) * (t - maxT);
    if (distToLane < bestLaneDistSq) {
      bestLaneDistSq = distToLane;
      bestLaneId = lane.id;
      bestOffset = t - centerT;
    }
  }

  if (bestLaneId === 0) return null; // No driving lanes found

  const z = evaluateElevation(road.elevationProfile, roadResult.s);
  const heading = computeDrivingHeading(road, bestLaneId, roadResult.s, reverse);

  return {
    roadId: roadResult.roadId,
    laneId: bestLaneId,
    s: roadResult.s,
    offset: bestOffset,
    heading,
    z,
    roadT: roadResult.t,
    distance: roadResult.distance,
  };
}

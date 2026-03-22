/**
 * Lane taper generation utilities.
 *
 * Produces cubic polynomial width coefficients and lane-section structures
 * for smooth lane additions/removals (taper transitions).
 */

import type { OdrLane, OdrLaneSection, OdrLaneWidth, OdrRoad } from '@osce/shared';
import { createDefaultLane } from '../store/defaults.js';

// ── Cubic taper coefficients ───────────────────────────────────────────────────

/**
 * Compute cubic polynomial coefficients for an S-curve taper.
 *
 * The polynomial `w(ds) = a + b*ds + c*ds² + d*ds³` transitions smoothly
 * from `startWidth` to `endWidth` over `taperLength`, with zero first
 * derivatives at both endpoints (hermite-style S-curve).
 */
export function computeCubicTaperCoefficients(
  startWidth: number,
  endWidth: number,
  taperLength: number,
): OdrLaneWidth {
  // Guard against zero/negative taper length to avoid division by zero
  if (taperLength <= 0) {
    return { sOffset: 0, a: endWidth, b: 0, c: 0, d: 0 };
  }

  const L = taperLength;
  const dw = endWidth - startWidth;
  const L2 = L * L;
  const L3 = L2 * L;

  return {
    sOffset: 0,
    a: startWidth,
    b: 0,
    c: (3 * dw) / L2,
    d: (-2 * dw) / L3,
  };
}

// ── Deep-clone helpers ─────────────────────────────────────────────────────────

function cloneLane(lane: OdrLane): OdrLane {
  return {
    ...lane,
    width: lane.width.map((w) => ({ ...w })),
    roadMarks: lane.roadMarks.map((rm) => ({ ...rm })),
    link: lane.link ? { ...lane.link } : undefined,
    speed: lane.speed?.map((s) => ({ ...s })),
    height: lane.height?.map((h) => ({ ...h })),
  };
}

function cloneSection(section: OdrLaneSection): OdrLaneSection {
  return {
    ...section,
    leftLanes: section.leftLanes.map(cloneLane),
    centerLane: cloneLane(section.centerLane),
    rightLanes: section.rightLanes.map(cloneLane),
  };
}

// ── Section builders ───────────────────────────────────────────────────────────

interface BuildTaperSectionParams {
  /** Source lane section to base the taper on. */
  sourceSection: OdrLaneSection;
  /** Which side the new/removed lane is on. */
  side: 'left' | 'right';
  /** Lane ID of the affected lane. */
  laneId: number;
  /** Length of the taper transition in metres. */
  taperLength: number;
  /** S-position where the taper section begins. */
  taperStartS: number;
}

/**
 * Build a generic taper section.
 *
 * Clones the source section, sets its `s` to `taperStartS`, and applies
 * the cubic taper width polynomial to the lane identified by `laneId`.
 * If the lane does not yet exist it is created as a default driving lane.
 */
export function buildTaperSection(params: BuildTaperSectionParams): OdrLaneSection {
  const { sourceSection, side, laneId, taperLength, taperStartS } = params;
  const section = cloneSection(sourceSection);
  section.s = taperStartS;

  const lanes = side === 'left' ? section.leftLanes : section.rightLanes;

  let lane = lanes.find((l) => l.id === laneId);
  if (!lane) {
    // Lane doesn't exist yet — create a new one and insert it
    lane = createDefaultLane(laneId);
    lanes.push(lane);
    // Sort: left lanes ascending by id (1,2,3…), right lanes descending by id (-1,-2,-3…)
    if (side === 'left') {
      lanes.sort((a, b) => a.id - b.id);
    } else {
      lanes.sort((a, b) => b.id - a.id);
    }
  }

  // Determine the start/end widths from the existing lane width
  const currentWidth = lane.width.length > 0 ? lane.width[0].a : 3.5;
  const taperCoeffs = computeCubicTaperCoefficients(0, currentWidth, taperLength);
  lane.width = [taperCoeffs];

  return section;
}

/**
 * Build a taper section for adding a lane (width transitions 0 → 3.5 m).
 *
 * A new lane is inserted on the specified side with a cubic taper width.
 * All existing lanes are preserved unchanged.
 */
export function buildTaperSectionForAdd(
  road: OdrRoad,
  sectionIdx: number,
  side: 'left' | 'right',
  taperLength: number,
): OdrLaneSection {
  const sourceSection = road.lanes[sectionIdx];
  const lanes = side === 'left' ? sourceSection.leftLanes : sourceSection.rightLanes;

  // New lane gets the next outer ID
  const newLaneId =
    side === 'left'
      ? (lanes.length > 0 ? Math.max(...lanes.map((l) => l.id)) : 0) + 1
      : (lanes.length > 0 ? Math.min(...lanes.map((l) => l.id)) : 0) - 1;

  const section = cloneSection(sourceSection);
  section.s = sourceSection.s;

  const targetLanes = side === 'left' ? section.leftLanes : section.rightLanes;

  // Create the new taper lane
  const newLane = createDefaultLane(newLaneId);
  const taperCoeffs = computeCubicTaperCoefficients(0, 3.5, taperLength);
  newLane.width = [taperCoeffs];

  targetLanes.push(newLane);

  // Sort: left lanes ascending by id (1,2,3…), right lanes descending by id (-1,-2,-3…)
  if (side === 'left') {
    targetLanes.sort((a, b) => a.id - b.id);
  } else {
    targetLanes.sort((a, b) => b.id - a.id);
  }

  return section;
}

/**
 * Build a taper section for removing a lane (width transitions 3.5 m → 0).
 *
 * The specified lane's width polynomial is replaced with a cubic taper
 * that narrows the lane to zero width. All other lanes are preserved.
 */
export function buildTaperSectionForRemove(
  road: OdrRoad,
  sectionIdx: number,
  side: 'left' | 'right',
  laneId: number,
  taperLength: number,
): OdrLaneSection {
  const sourceSection = road.lanes[sectionIdx];
  const section = cloneSection(sourceSection);
  section.s = sourceSection.s;

  const lanes = side === 'left' ? section.leftLanes : section.rightLanes;
  const lane = lanes.find((l) => l.id === laneId);

  if (!lane) {
    throw new Error(
      `Lane ${laneId} not found on ${side} side of section at s=${sourceSection.s}`,
    );
  }

  // Current width at the start of the section
  const currentWidth = lane.width.length > 0 ? lane.width[0].a : 3.5;
  const taperCoeffs = computeCubicTaperCoefficients(currentWidth, 0, taperLength);
  lane.width = [taperCoeffs];

  return section;
}

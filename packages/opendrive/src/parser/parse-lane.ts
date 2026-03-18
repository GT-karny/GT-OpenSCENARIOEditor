/**
 * Parse OpenDRIVE lane elements.
 */
import type { OdrLaneSection, OdrLane, OdrLaneWidth, OdrRoadMark, OdrLaneLink } from '@osce/shared';
import { ensureArray, toNum, toStr, toOptStr, toOptNum } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseLaneSections(raw: Raw | undefined): OdrLaneSection[] {
  if (!raw) return [];
  return ensureArray(raw.laneSection).map(parseLaneSection);
}

function parseLaneSection(raw: Raw): OdrLaneSection {
  const leftLanes = raw.left ? ensureArray(raw.left.lane).map(parseLane) : [];
  const rightLanes = raw.right ? ensureArray(raw.right.lane).map(parseLane) : [];

  // Center lane - always id=0
  let centerLane: OdrLane;
  if (raw.center?.lane) {
    const centerArr = ensureArray(raw.center.lane);
    centerLane = parseLane(centerArr[0]);
  } else {
    centerLane = { id: 0, type: 'none', width: [], roadMarks: [] };
  }

  return {
    s: toNum(raw.s),
    singleSide: raw.singleSide === true || raw.singleSide === 'true' ? true : undefined,
    leftLanes,
    centerLane,
    rightLanes,
  };
}

function parseLane(raw: Raw): OdrLane {
  const lane: OdrLane = {
    id: toNum(raw.id),
    type: toStr(raw.type, 'none'),
    level:
      raw.level === true || raw.level === 'true'
        ? true
        : raw.level === false || raw.level === 'false'
          ? false
          : undefined,
    width: ensureArray(raw.width).map(parseLaneWidth),
    roadMarks: ensureArray(raw.roadMark).map(parseRoadMark),
  };

  // Link
  const link = raw.link;
  if (link) {
    const laneLink: OdrLaneLink = {};
    if (link.predecessor) {
      const pred = ensureArray(link.predecessor);
      if (pred.length > 0) laneLink.predecessorId = toNum(pred[0].id);
    }
    if (link.successor) {
      const succ = ensureArray(link.successor);
      if (succ.length > 0) laneLink.successorId = toNum(succ[0].id);
    }
    if (laneLink.predecessorId !== undefined || laneLink.successorId !== undefined) {
      lane.link = laneLink;
    }
  }

  // Speed
  const speedArr = ensureArray(raw.speed);
  if (speedArr.length > 0) {
    lane.speed = speedArr.map((s: Raw) => ({
      sOffset: toNum(s.sOffset),
      max: toNum(s.max),
      unit: toStr(s.unit, 'm/s'),
    }));
  }

  // Height
  const heightArr = ensureArray(raw.height);
  if (heightArr.length > 0) {
    lane.height = heightArr.map((h: Raw) => ({
      sOffset: toNum(h.sOffset),
      inner: toNum(h.inner),
      outer: toNum(h.outer),
    }));
  }

  return lane;
}

function parseLaneWidth(raw: Raw): OdrLaneWidth {
  return {
    sOffset: toNum(raw.sOffset),
    a: toNum(raw.a),
    b: toNum(raw.b),
    c: toNum(raw.c),
    d: toNum(raw.d),
  };
}

function parseRoadMark(raw: Raw): OdrRoadMark {
  return {
    sOffset: toNum(raw.sOffset),
    type: toStr(raw.type, 'none'),
    weight: toOptStr(raw.weight),
    color: toOptStr(raw.color),
    material: toOptStr(raw.material),
    width: toOptNum(raw.width),
    laneChange: toOptStr(raw.laneChange),
    height: toOptNum(raw.height),
  };
}

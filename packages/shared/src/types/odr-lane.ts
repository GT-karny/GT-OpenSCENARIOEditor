/**
 * OpenDRIVE lane types.
 */

export interface OdrLaneSection {
  s: number;
  singleSide?: boolean;
  leftLanes: OdrLane[];
  centerLane: OdrLane;
  rightLanes: OdrLane[];
}

export interface OdrLane {
  id: number;
  type: string;
  level?: boolean;
  width: OdrLaneWidth[];
  roadMarks: OdrRoadMark[];
  link?: OdrLaneLink;
  speed?: { sOffset: number; max: number; unit: string }[];
  height?: { sOffset: number; inner: number; outer: number }[];
}

export interface OdrLaneWidth {
  sOffset: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface OdrRoadMark {
  sOffset: number;
  type: string;
  weight?: string;
  color?: string;
  material?: string;
  width?: number;
  laneChange?: string;
  height?: number;
}

export interface OdrLaneLink {
  predecessorId?: number;
  successorId?: number;
}

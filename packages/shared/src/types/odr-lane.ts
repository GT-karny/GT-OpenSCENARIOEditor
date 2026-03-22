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
  border?: OdrLaneBorder[];
  material?: OdrLaneMaterial[];
  access?: OdrLaneAccess[];
  rule?: OdrLaneRule[];
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
  typeDef?: OdrRoadMarkTypeDef;
  explicit?: OdrRoadMarkExplicit;
  sway?: OdrRoadMarkSway[];
}

export interface OdrLaneLink {
  predecessorId?: number;
  successorId?: number;
}

export interface OdrLaneBorder {
  sOffset: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface OdrLaneMaterial {
  sOffset: number;
  surface?: string;
  friction: number;
  roughness?: number;
}

export interface OdrLaneAccess {
  sOffset: number;
  rule?: 'allow' | 'deny';
  restriction: string;
}

export interface OdrLaneRule {
  sOffset: number;
  value: string;
}

export interface OdrRoadMarkTypeDef {
  name: string;
  width: number;
  lines: OdrRoadMarkLine[];
}

export interface OdrRoadMarkLine {
  length: number;
  space: number;
  tOffset: number;
  sOffset: number;
  rule?: string;
  width?: number;
  color?: string;
}

export interface OdrRoadMarkExplicit {
  lines: OdrRoadMarkExplicitLine[];
}

export interface OdrRoadMarkExplicitLine {
  length: number;
  tOffset: number;
  sOffset: number;
  rule?: string;
  width?: number;
}

export interface OdrRoadMarkSway {
  ds: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

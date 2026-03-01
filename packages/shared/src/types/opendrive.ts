/**
 * OpenDRIVE internal model types.
 * Represents the parsed structure of a .xodr file.
 */

export interface OpenDriveDocument {
  header: OdrHeader;
  roads: OdrRoad[];
  controllers: OdrController[];
  junctions: OdrJunction[];
}

export interface OdrHeader {
  revMajor: number;
  revMinor: number;
  name: string;
  date: string;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  geoReference?: string;
}

export interface OdrRoad {
  id: string;
  name: string;
  length: number;
  junction: string;
  link?: OdrRoadLink;
  type?: OdrRoadTypeEntry[];
  planView: OdrGeometry[];
  elevationProfile: OdrElevation[];
  lateralProfile: OdrSuperelevation[];
  laneOffset: OdrLaneOffset[];
  lanes: OdrLaneSection[];
  objects: OdrRoadObject[];
  signals: OdrSignal[];
}

export interface OdrRoadLink {
  predecessor?: OdrRoadLinkElement;
  successor?: OdrRoadLinkElement;
}

export interface OdrRoadLinkElement {
  elementType: 'road' | 'junction';
  elementId: string;
  contactPoint?: 'start' | 'end';
}

export interface OdrRoadTypeEntry {
  s: number;
  type: string;
  speed?: { max: number; unit: string };
}

export interface OdrGeometry {
  s: number;
  x: number;
  y: number;
  hdg: number;
  length: number;
  type: 'line' | 'arc' | 'spiral' | 'poly3' | 'paramPoly3';
  /** Arc curvature */
  curvature?: number;
  /** Spiral start curvature */
  curvStart?: number;
  /** Spiral end curvature */
  curvEnd?: number;
  /** Poly3 coefficients */
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  /** ParamPoly3 U coefficients */
  aU?: number;
  bU?: number;
  cU?: number;
  dU?: number;
  /** ParamPoly3 V coefficients */
  aV?: number;
  bV?: number;
  cV?: number;
  dV?: number;
  /** ParamPoly3 parameter range */
  pRange?: 'arcLength' | 'normalized';
}

export interface OdrElevation {
  s: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface OdrSuperelevation {
  s: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface OdrLaneOffset {
  s: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

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

export interface OdrRoadObject {
  id: string;
  name?: string;
  type?: string;
  s: number;
  t: number;
  zOffset?: number;
  hdg?: number;
  pitch?: number;
  roll?: number;
  length?: number;
  width?: number;
  height?: number;
  radius?: number;
  orientation?: string;
}

export interface OdrSignal {
  id: string;
  name?: string;
  s: number;
  t: number;
  zOffset?: number;
  orientation: string;
  dynamic?: string;
  country?: string;
  type?: string;
  subtype?: string;
  value?: number;
  text?: string;
  hOffset?: number;
  pitch?: number;
  roll?: number;
  width?: number;
  height?: number;
}

export interface OdrController {
  id: string;
  name: string;
  sequence?: number;
  controls: { signalId: string; type?: string }[];
}

export interface OdrJunction {
  id: string;
  name: string;
  type?: string;
  connections: OdrJunctionConnection[];
}

export interface OdrJunctionConnection {
  id: string;
  incomingRoad: string;
  connectingRoad: string;
  contactPoint: 'start' | 'end';
  laneLinks: { from: number; to: number }[];
}

// --- Computed geometry (for rendering) ---

export interface RoadMeshData {
  roadId: string;
  laneSections: LaneSectionMeshData[];
}

export interface LaneSectionMeshData {
  sStart: number;
  sEnd: number;
  lanes: LaneMeshData[];
}

export interface LaneMeshData {
  laneId: number;
  laneType: string;
  /** Triangle mesh vertices [x, y, z, x, y, z, ...] */
  vertices: Float32Array;
  /** Triangle indices */
  indices: Uint32Array;
  /** UV coordinates for texturing */
  uvs?: Float32Array;
}

export interface RoadMarkMeshData {
  /** Line segments [x1, y1, z1, x2, y2, z2, ...] */
  vertices: Float32Array;
  color: string;
  width: number;
  /** Road mark type: 'solid', 'broken', 'solid solid', etc. */
  markType: string;
}

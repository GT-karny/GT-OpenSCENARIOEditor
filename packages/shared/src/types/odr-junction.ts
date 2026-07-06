/**
 * OpenDRIVE junction types.
 */

import type { OdrSurfaceCRG } from './odr-surface.js';
import type { OdrLayerType } from './odr-lane.js';
import type { OdrExtra } from './odr-common.js';

/**
 * Junction type — the value space of the `<junction>` `@type` attribute:
 * 'default' (common), 'virtual', 'direct', 'crossing'. Const array + welded
 * union so the parser and UI (W3 dropdown) share one source of truth.
 */
export const ODR_JUNCTION_TYPES = ['default', 'virtual', 'direct', 'crossing'] as const;
export type OdrJunctionType = (typeof ODR_JUNCTION_TYPES)[number];

export interface OdrJunction {
  id: string;
  name: string;
  type?: OdrJunctionType;
  connections: OdrJunctionConnection[];
  priority?: OdrJunctionPriority[];
  controller?: OdrJunctionController[];
  /** `<crossPath>` children (common/virtual junctions): pedestrian-style crossings. */
  crossPaths?: OdrJunctionCrossPath[];
  /** `<roadSection>` children (crossing junctions): s-ranges of crossing roads. */
  roadSections?: OdrJunctionRoadSection[];
  surface?: OdrJunctionSurface;
  /** Virtual junction: main road from which connecting roads branch off (t_junction_virtual/@mainRoad). */
  mainRoad?: string;
  /** Virtual junction: start position on the main road reference line (t_junction_virtual/@sStart). */
  sStart?: number;
  /** Virtual junction: end position on the main road reference line (t_junction_virtual/@sEnd). */
  sEnd?: number;
  /** Virtual junction: relevance by driving direction, one of '+', '-', 'none' (t_junction_virtual/@orientation). */
  orientation?: string;
  /** Unmodeled attrs/children (crossing/direct-junction subtrees, etc.) preserved for round-trip. */
  extra?: OdrExtra;
}

export interface OdrJunctionConnection {
  id: string;
  incomingRoad: string;
  connectingRoad: string;
  contactPoint: 'start' | 'end';
  laneLinks: OdrJunctionLaneLink[];
  /** Connection type (`e_connection_type`): 'default' or 'virtual'. */
  type?: 'default' | 'virtual';
  predecessor?: OdrJunctionPredSucc;
  successor?: OdrJunctionPredSucc;
  /** Unmodeled connection attrs (e.g. direct-junction @linkedRoad) preserved for round-trip. */
  extra?: OdrExtra;
}

export interface OdrJunctionLaneLink {
  from: number;
  to: number;
  /** 1.9 `@overlapZone` (`t_grZero`): s-range length where the two lanes overlap. */
  overlapZone?: number;
  /** 1.9 `@fromLayer` (`e_layerType`): layer of the incoming lane. */
  fromLayer?: OdrLayerType;
  /** 1.9 `@toLayer` (`e_layerType`): layer of the connection lane. */
  toLayer?: OdrLayerType;
  /** Unmodeled laneLink attrs/children preserved for round-trip. */
  extra?: OdrExtra;
}

/**
 * A `<crossPath>` (common/virtual junction, `t_junction_crossPath`): a crossing
 * where lane traffic crosses other lanes onto a different road. All attributes
 * are optional per XSD; the two laneLink children are required.
 */
export interface OdrJunctionCrossPath {
  id?: string;
  crossingRoad?: string;
  roadAtStart?: string;
  roadAtEnd?: string;
  startLaneLink: OdrJunctionCrossPathLaneLink;
  endLaneLink: OdrJunctionCrossPathLaneLink;
  /** Unmodeled crossPath attrs/children preserved for round-trip. */
  extra?: OdrExtra;
}

export interface OdrJunctionCrossPathLaneLink {
  /** `@s` (`t_grEqZero`): s-coordinate of the start/end point in the linked road. */
  s?: number;
  from?: number;
  to?: number;
  /** Unmodeled attrs/children preserved for round-trip. */
  extra?: OdrExtra;
}

/**
 * A `<roadSection>` (crossing junction, `t_junction_roadSection`): the s-range of
 * a crossing road with possible crossing traffic. All attributes optional per XSD.
 */
export interface OdrJunctionRoadSection {
  id?: string;
  roadId?: string;
  sStart?: number;
  sEnd?: number;
  /** Unmodeled roadSection attrs/children preserved for round-trip. */
  extra?: OdrExtra;
}

export interface OdrJunctionPriority {
  high?: string;
  low?: string;
}

export interface OdrJunctionController {
  id: string;
  type?: string;
  sequence?: number;
}

export interface OdrJunctionSurface {
  crg?: OdrSurfaceCRG[];
}

export interface OdrJunctionPredSucc {
  elementType: string;
  elementId: string;
  elementS: number;
  elementDir: '+' | '-';
}

export interface OdrJunctionGroup {
  id: string;
  name?: string;
  type: string;
  junctionReferences: string[];
}

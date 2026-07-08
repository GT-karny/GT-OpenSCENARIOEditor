/**
 * OpenDRIVE lane types.
 */

import type { OdrExtra } from './odr-common.js';
import type { OdrLaneOffset } from './odr-geometry.js';

/** Lane travel direction override (`e_lane_direction`). */
export const ODR_LANE_DIRECTIONS = ['both', 'reversed', 'standard'] as const;
export type OdrLaneDirection = (typeof ODR_LANE_DIRECTIONS)[number];

/** Advisory-lane usage (`e_laneAdvisory`). */
export const ODR_LANE_ADVISORIES = ['both', 'inner', 'none', 'outer'] as const;
export type OdrLaneAdvisory = (typeof ODR_LANE_ADVISORIES)[number];

/**
 * Lane layer (`e_layerType`): the permanent or temporary `<lanes>` layer. This
 * is the value space of the `<lanes>` element's `@layer` (a real XSD enum) and
 * is provided for UI option lists. Note: the lane-link `<predecessor>`/
 * `<successor>` `@layer` is `xs:string` in the XSD (see {@link OdrLaneLinkRef}),
 * NOT this enum, so unknown values there round-trip verbatim.
 */
export const ODR_LAYER_TYPES = ['permanent', 'temporary'] as const;
export type OdrLayerType = (typeof ODR_LAYER_TYPES)[number];

/**
 * Access-restriction participant types (`e_accessRestrictionType`). Exposed as a
 * const array for UI option lists; the runtime `restriction`/`type` fields stay
 * `string` so unknown/future values round-trip losslessly (mirrors {@link OdrLane}
 * `type`, which is `string` despite `e_laneType` being an enum).
 */
export const ODR_ACCESS_RESTRICTION_TYPES = [
  'simulator',
  'autonomousTraffic',
  'pedestrian',
  'passengerCar',
  'bus',
  'delivery',
  'emergency',
  'taxi',
  'throughTraffic',
  'truck',
  'bicycle',
  'motorcycle',
  'none',
  'trucks',
  'HOV',
] as const;
export type OdrAccessRestrictionType = (typeof ODR_ACCESS_RESTRICTION_TYPES)[number];

/**
 * One `<lanes>` layer. OpenDRIVE 1.9 permits up to two `<lanes>` per road: a
 * permanent layer (modeled flat on {@link OdrRoad} as `lanes`/`laneOffset`) and
 * an optional temporary layer, carried here.
 */
export interface OdrLanesLayer {
  laneOffset: OdrLaneOffset[];
  sections: OdrLaneSection[];
  /** Unmodeled `<lanes>` attrs/children (beyond @layer/laneOffset/laneSection). */
  extra?: OdrExtra;
}

export interface OdrLaneSection {
  s: number;
  /** Lane-section length (`@length`, valid only on a temporary layer per XSD). */
  length?: number;
  singleSide?: boolean;
  leftLanes: OdrLane[];
  centerLane: OdrLane;
  rightLanes: OdrLane[];
  /** Unmodeled <laneSection> children (userData) preserved for round-trip. */
  extra?: OdrExtra;
}

export interface OdrLane {
  id: number;
  type: string;
  level?: boolean;
  /** Travel-direction override (`@direction`). */
  direction?: OdrLaneDirection;
  /** Advisory-lane usage (`@advisory`). */
  advisory?: OdrLaneAdvisory;
  /** Lane type may change dynamically during simulation (`@dynamicLaneType`, `t_bool`). */
  dynamicLaneType?: boolean;
  /** Lane direction may change dynamically during simulation (`@dynamicLaneDirection`, `t_bool`). */
  dynamicLaneDirection?: boolean;
  /** Lane is under construction (`@roadWorks`, `t_bool`). */
  roadWorks?: boolean;
  width: OdrLaneWidth[];
  roadMarks: OdrRoadMark[];
  link?: OdrLaneLink;
  // Per 1.9 XSD lane speed @max is t_grEqZero (numeric only); only road-type
  // speed permits the special "no limit"/"undefined" literals.
  speed?: { sOffset: number; max: number; unit: string }[];
  height?: { sOffset: number; inner: number; outer: number }[];
  border?: OdrLaneBorder[];
  material?: OdrLaneMaterial[];
  access?: OdrLaneAccess[];
  rule?: OdrLaneRule[];
  /** Unmodeled lane attrs / children (userData) preserved for round-trip. */
  extra?: OdrExtra;
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

/**
 * A single linked lane reference within a lane `<link>`: the target lane `@id`
 * plus its optional `@layer`, so links to the same id in different layers stay
 * distinct. Per XSD this `@layer` is `xs:string` (documented as
 * permanent/temporary but not enum-constrained), so it is carried verbatim.
 */
export interface OdrLaneLinkRef {
  id: number;
  layer?: string;
}

/**
 * Lane-level predecessor/successor links. OpenDRIVE 1.9 allows multiple
 * `<predecessor>`/`<successor>` per link (`maxOccurs="unbounded"`), each with its
 * own `@layer`, so both sides are modeled as reference arrays. An empty array
 * means no link on that side; a lane with both empty carries no `link` at all.
 */
export interface OdrLaneLink {
  predecessors: OdrLaneLinkRef[];
  successors: OdrLaneLinkRef[];
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
  /**
   * Legacy single participant (`@restriction`, `e_accessRestrictionType`).
   * Optional in 1.9, superseded by {@link restrictions} child elements.
   */
  restriction?: string;
  /** 1.9 `<restriction>` children — each an `e_accessRestrictionType`. */
  restrictions?: OdrLaneAccessRestriction[];
  /** Unmodeled `<access>` attrs (out-of-enum @rule) / children (userData) preserved for round-trip. */
  extra?: OdrExtra;
}

export interface OdrLaneAccessRestriction {
  /** Participant type (`@type`, `e_accessRestrictionType`). Optional per XSD. */
  type?: string;
  /** Unmodeled `<restriction>` attrs/children preserved for round-trip. */
  extra?: OdrExtra;
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

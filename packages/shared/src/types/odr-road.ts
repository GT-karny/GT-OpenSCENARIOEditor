/**
 * OpenDRIVE road-level types.
 */

import type { OdrGeometry, OdrElevation, OdrSuperelevation, OdrLaneOffset, OdrShape } from './odr-geometry.js';
import type { OdrLaneSection, OdrLanesLayer } from './odr-lane.js';
import type { OdrRoadObject, OdrObjectReference, OdrTunnel, OdrBridge } from './odr-object.js';
import type { OdrSignal, OdrSignalRef } from './odr-signal.js';
import type { OdrRailroad } from './odr-railroad.js';
import type { OdrSurfaceCRG } from './odr-surface.js';
import type { OdrUserData, OdrDataQuality, OdrInclude, OdrExtra, OdrSpeedMaxSpecial } from './odr-common.js';

export type OdrRoadRule = 'RHT' | 'LHT';

export interface OdrRoad {
  id: string;
  name: string;
  length: number;
  junction: string;
  /** Driving rule: RHT (right-hand traffic) or LHT (left-hand traffic) */
  rule?: OdrRoadRule;
  link?: OdrRoadLink;
  type?: OdrRoadTypeEntry[];
  planView: OdrGeometry[];
  elevationProfile: OdrElevation[];
  lateralProfile: OdrSuperelevation[];
  laneOffset: OdrLaneOffset[];
  lanes: OdrLaneSection[];
  objects: OdrRoadObject[];
  signals: OdrSignal[];
  objectReferences?: OdrObjectReference[];
  signalReferences?: OdrSignalRef[];
  tunnels?: OdrTunnel[];
  bridges?: OdrBridge[];
  railroad?: OdrRailroad;
  surface?: { crg?: OdrSurfaceCRG[] };
  shapes?: OdrShape[];
  /** Arbitrary key/value metadata (OpenDRIVE <userData> elements). */
  userData?: OdrUserData[];
  /** Data quality information (<dataQuality> element). */
  dataQuality?: OdrDataQuality;
  /** External file includes (<include> elements). */
  includes?: OdrInclude[];
  /**
   * Temporary lane layer (`<lanes layer="temporary">`). OpenDRIVE 1.9 allows up
   * to two `<lanes>` elements per road: the permanent layer is modeled flat
   * above (`lanes`/`laneOffset`); the optional temporary layer is carried here,
   * parsed through the same laneOffset/laneSection model.
   */
  temporaryLanes?: OdrLanesLayer;
  /** Unmodeled direct attrs/children of <road> preserved for round-trip. */
  extra?: OdrExtra;
  /**
   * Unmodeled children of <lateralProfile> (notably the 1.9 <crossSectionSurface>
   * strip system) preserved for round-trip alongside superelevation/shape.
   */
  lateralProfileExtra?: OdrExtra;
}

export interface OdrRoadLink {
  predecessor?: OdrRoadLinkElement;
  successor?: OdrRoadLinkElement;
}

export interface OdrRoadLinkElement {
  elementType: 'road' | 'junction';
  elementId: string;
  contactPoint?: 'start' | 'end';
  elementS?: number;
  elementDir?: '+' | '-';
}

export interface OdrRoadTypeEntry {
  s: number;
  type: string;
  speed?: { max: number | OdrSpeedMaxSpecial; unit: string };
  /** Unmodeled <type> attrs (e.g. @country) preserved for round-trip. */
  extra?: OdrExtra;
}

/**
 * OpenDRIVE road-level types.
 */

import type { OdrGeometry, OdrElevation, OdrSuperelevation, OdrLaneOffset } from './odr-geometry.js';
import type { OdrLaneSection } from './odr-lane.js';
import type { OdrRoadObject, OdrObjectReference, OdrTunnel, OdrBridge } from './odr-object.js';
import type { OdrSignal, OdrSignalRef } from './odr-signal.js';
import type { OdrRailroad } from './odr-railroad.js';

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

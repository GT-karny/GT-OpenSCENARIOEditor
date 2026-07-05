/**
 * OpenDRIVE junction types.
 */

import type { OdrSurfaceCRG } from './odr-surface.js';
import type { OdrExtra } from './odr-common.js';

export interface OdrJunction {
  id: string;
  name: string;
  type?: string;
  connections: OdrJunctionConnection[];
  priority?: OdrJunctionPriority[];
  controller?: OdrJunctionController[];
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
  laneLinks: { from: number; to: number; extra?: OdrExtra }[];
  type?: string;
  predecessor?: OdrJunctionPredSucc;
  successor?: OdrJunctionPredSucc;
  /** Unmodeled connection attrs (linkedRoad, overlapZone, layer, …) preserved for round-trip. */
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

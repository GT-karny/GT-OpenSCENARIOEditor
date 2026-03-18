/**
 * OpenDRIVE junction types.
 */

import type { OdrSurfaceCRG } from './odr-surface.js';

export interface OdrJunction {
  id: string;
  name: string;
  type?: string;
  connections: OdrJunctionConnection[];
  priority?: OdrJunctionPriority[];
  controller?: OdrJunctionController[];
  surface?: OdrJunctionSurface;
}

export interface OdrJunctionConnection {
  id: string;
  incomingRoad: string;
  connectingRoad: string;
  contactPoint: 'start' | 'end';
  laneLinks: { from: number; to: number }[];
  type?: string;
  predecessor?: OdrJunctionPredSucc;
  successor?: OdrJunctionPredSucc;
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

/**
 * OpenDRIVE document and header types.
 */

import type { OdrRoad } from './odr-road.js';
import type { OdrController } from './odr-controller.js';
import type { OdrJunction } from './odr-junction.js';

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

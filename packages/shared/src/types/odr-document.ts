/**
 * OpenDRIVE document and header types.
 */

import type { OdrRoad } from './odr-road.js';
import type { OdrController } from './odr-controller.js';
import type { OdrJunction, OdrJunctionGroup } from './odr-junction.js';
import type { OdrStation } from './odr-railroad.js';
import type { OdrUserData, OdrDataQuality, OdrInclude, OdrExtra } from './odr-common.js';

export interface OpenDriveDocument {
  header: OdrHeader;
  roads: OdrRoad[];
  controllers: OdrController[];
  junctions: OdrJunction[];
  stations?: OdrStation[];
  junctionGroups?: OdrJunctionGroup[];
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
  /** Application/tooling that authored the file (<header> @version), round-tripped. */
  version?: string;
  /** Vendor string (<header> @vendor), round-tripped. */
  vendor?: string;
  geoReference?: string;
  offset?: OdrHeaderOffset;
  /** Arbitrary key/value metadata (OpenDRIVE <userData> elements). */
  userData?: OdrUserData[];
  /** Data quality information (<dataQuality> element). */
  dataQuality?: OdrDataQuality;
  /** External file includes (<include> elements). */
  includes?: OdrInclude[];
  /** Unmodeled header children (1.9 <license>, <defaultRegulations>) preserved for round-trip. */
  extra?: OdrExtra;
}

export interface OdrHeaderOffset {
  x: number;
  y: number;
  z: number;
  hdg: number;
}

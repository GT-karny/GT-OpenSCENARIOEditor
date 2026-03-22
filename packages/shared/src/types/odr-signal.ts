/**
 * OpenDRIVE signal types.
 */

import type { OdrLaneValidity } from './odr-common.js';

export interface OdrSignal {
  id: string;
  name?: string;
  s: number;
  t: number;
  zOffset?: number;
  orientation: string;
  dynamic?: string;
  country?: string;
  countryRevision?: string;
  type?: string;
  subtype?: string;
  value?: number;
  unit?: string;
  text?: string;
  hOffset?: number;
  pitch?: number;
  roll?: number;
  width?: number;
  height?: number;
  validity?: OdrLaneValidity[];
  dependency?: OdrSignalDependency[];
  reference?: OdrSignalReference[];
  positionRoad?: OdrSignalPositionRoad;
  positionInertial?: OdrSignalPositionInertial;
}

export interface OdrSignalDependency {
  id: string;
  type?: string;
}

export interface OdrSignalReference {
  elementType: 'object' | 'signal';
  elementId: string;
  type?: string;
}

export interface OdrSignalPositionRoad {
  roadId: string;
  s: number;
  t: number;
  zOffset: number;
  hOffset: number;
  pitch?: number;
  roll?: number;
}

export interface OdrSignalPositionInertial {
  x: number;
  y: number;
  z: number;
  hdg: number;
  pitch?: number;
  roll?: number;
}

export interface OdrSignalRef {
  s: number;
  t: number;
  id: string;
  orientation: string;
  validity?: OdrLaneValidity[];
}

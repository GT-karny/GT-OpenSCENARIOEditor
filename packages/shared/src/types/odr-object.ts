/**
 * OpenDRIVE road object types.
 */

import type { OdrLaneValidity } from './odr-common.js';

export interface OdrRoadObject {
  id: string;
  name?: string;
  type?: string;
  subtype?: string;
  dynamic?: string;
  s: number;
  t: number;
  zOffset?: number;
  validLength?: number;
  hdg?: number;
  pitch?: number;
  roll?: number;
  length?: number;
  width?: number;
  height?: number;
  radius?: number;
  orientation?: string;
  repeat?: OdrObjectRepeat[];
  outline?: OdrObjectOutline;
  outlines?: OdrObjectOutline[];
  material?: OdrObjectMaterial[];
  validity?: OdrLaneValidity[];
  parkingSpace?: OdrParkingSpace;
  markings?: OdrObjectMarking[];
  borders?: OdrObjectBorder[];
}

export interface OdrObjectRepeat {
  s: number;
  length: number;
  distance: number;
  tStart: number;
  tEnd: number;
  heightStart: number;
  heightEnd: number;
  zOffsetStart: number;
  zOffsetEnd: number;
  widthStart?: number;
  widthEnd?: number;
  lengthStart?: number;
  lengthEnd?: number;
  radiusStart?: number;
  radiusEnd?: number;
}

export interface OdrObjectOutline {
  id?: string;
  fillType?: string;
  outer?: boolean;
  closed?: boolean;
  laneType?: string;
  cornerRoad?: OdrCornerRoad[];
  cornerLocal?: OdrCornerLocal[];
}

export interface OdrCornerRoad {
  s: number;
  t: number;
  dz: number;
  height: number;
  id?: number;
}

export interface OdrCornerLocal {
  u: number;
  v: number;
  z: number;
  height: number;
  id?: number;
}

export interface OdrObjectMaterial {
  surface?: string;
  friction?: number;
  roughness?: number;
}

export interface OdrParkingSpace {
  access: string;
  restrictions?: string;
}

export interface OdrObjectMarking {
  side: string;
  weight?: string;
  width?: number;
  color: string;
  zOffset?: number;
  spaceLength: number;
  lineLength: number;
  startOffset: number;
  stopOffset: number;
  cornerReferences: number[];
}

export interface OdrObjectBorder {
  outlineId: string;
  type: string;
  width: number;
  useCompleteOutline?: boolean;
  cornerReferences: number[];
}

export interface OdrObjectReference {
  s: number;
  t: number;
  id: string;
  zOffset?: number;
  validLength?: number;
  orientation?: string;
  validity?: OdrLaneValidity[];
}

export interface OdrTunnel {
  s: number;
  length: number;
  name?: string;
  id: string;
  type: string;
  lighting?: number;
  daylight?: number;
  validity?: OdrLaneValidity[];
}

export interface OdrBridge {
  s: number;
  length: number;
  name?: string;
  id: string;
  type: string;
  validity?: OdrLaneValidity[];
}

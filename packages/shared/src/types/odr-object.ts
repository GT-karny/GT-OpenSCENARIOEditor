/**
 * OpenDRIVE road object types.
 */

export interface OdrRoadObject {
  id: string;
  name?: string;
  type?: string;
  s: number;
  t: number;
  zOffset?: number;
  hdg?: number;
  pitch?: number;
  roll?: number;
  length?: number;
  width?: number;
  height?: number;
  radius?: number;
  orientation?: string;
}

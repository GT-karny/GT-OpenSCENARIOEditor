/**
 * OpenDRIVE signal types.
 */

export interface OdrSignal {
  id: string;
  name?: string;
  s: number;
  t: number;
  zOffset?: number;
  orientation: string;
  dynamic?: string;
  country?: string;
  type?: string;
  subtype?: string;
  value?: number;
  text?: string;
  hOffset?: number;
  pitch?: number;
  roll?: number;
  width?: number;
  height?: number;
}

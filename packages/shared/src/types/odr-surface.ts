/**
 * OpenDRIVE surface types (shared across road and junction).
 */

export interface OdrSurfaceCRG {
  file: string;
  sStart?: number;
  sEnd?: number;
  orientation?: string;
  mode?: string;
  purpose?: string;
  sOffset?: number;
  tOffset?: number;
  zOffset?: number;
  zScale?: number;
  hOffset?: number;
}

/**
 * Internal geometry types for OpenDRIVE calculations.
 */

/** 3D vector */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** 2D pose: position + heading */
export interface Pose2D {
  x: number;
  y: number;
  hdg: number;
}

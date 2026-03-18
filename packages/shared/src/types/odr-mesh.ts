/**
 * OpenDRIVE computed geometry types (for rendering).
 */

export interface RoadMeshData {
  roadId: string;
  laneSections: LaneSectionMeshData[];
}

export interface LaneSectionMeshData {
  sStart: number;
  sEnd: number;
  lanes: LaneMeshData[];
}

export interface LaneMeshData {
  laneId: number;
  laneType: string;
  /** Triangle mesh vertices [x, y, z, x, y, z, ...] */
  vertices: Float32Array;
  /** Triangle indices */
  indices: Uint32Array;
  /** UV coordinates for texturing */
  uvs?: Float32Array;
}

export interface RoadMarkMeshData {
  /** Line segments [x1, y1, z1, x2, y2, z2, ...] */
  vertices: Float32Array;
  color: string;
  width: number;
  /** Road mark type: 'solid', 'broken', 'solid solid', etc. */
  markType: string;
}

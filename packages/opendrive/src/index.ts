/**
 * @osce/opendrive - OpenDRIVE (.xodr) parser, geometry calculator, and mesh generator.
 */

// Parser
export { XodrParser } from './parser/xodr-parser.js';

// Serializer
export { XodrSerializer } from './serializer/xodr-serializer.js';

// Geometry evaluation
export { evaluateReferenceLineAtS, evaluateGeometry } from './geometry/reference-line.js';
export { evaluateElevation, evaluateElevationGradient } from './geometry/elevation.js';
export { evaluateSuperelevation } from './geometry/superelevation.js';
export { evaluateLaneOffset } from './geometry/lane-offset.js';
export {
  computeLaneBoundaries,
  computeLaneWidth,
  computeLaneOuterT,
  computeLaneInnerT,
  stToXyz,
} from './geometry/lane-boundary.js';

// Driving direction and inverse lookup
export { computeDrivingHeading } from './geometry/driving-direction.js';
export { worldToRoad, worldToLane } from './geometry/inverse-lookup.js';
export type { RoadLookupResult, LaneLookupResult } from './geometry/inverse-lookup.js';

// Individual geometry evaluators
export { evaluateLine } from './geometry/line.js';
export { evaluateArc } from './geometry/arc.js';
export { evaluateSpiral } from './geometry/spiral.js';
export { evaluatePoly3 } from './geometry/poly3.js';
export { evaluateParamPoly3 } from './geometry/param-poly3.js';

// Mesh generation
export { generateRoadMesh } from './mesh/road-mesh-generator.js';
export { buildLaneMesh } from './mesh/lane-mesh-builder.js';
export { buildRoadMarkMesh } from './mesh/road-mark-mesh-builder.js';
export {
  generateSamplePoints,
  generateUniformSamples,
  generateCurvatureAdaptiveSamples,
} from './mesh/sampling.js';
export { buildJunctionSurfaceMesh } from './mesh/junction-surface-builder.js';

// Types
export type { Vec3, Pose2D } from './geometry/types.js';
export type { LaneBoundaryPoint } from './geometry/lane-boundary.js';
export type { SamplingOptions } from './mesh/sampling.js';
export type { JunctionSurfaceData } from './mesh/junction-surface-builder.js';

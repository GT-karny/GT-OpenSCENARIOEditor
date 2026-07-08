/**
 * OpenSCENARIO v1.3.1 Enum Types
 *
 * Extracted from Thirdparty/openscenario-v1.3.1/.../OpenSCENARIO.xsd.
 * Each xsd:simpleType enumeration is represented as a `readonly` const value
 * array (single source of truth for UI dropdowns) plus a derived union type
 * (`(typeof ARR)[number]`) so any drift between the value list and the type
 * becomes a compile error.
 *
 * Backward compatibility: values deprecated in v1.3.1 are retained (documented
 * with `@deprecated`) so legacy v1.2 files continue to parse round-trip.
 */

// ---------------------------------------------------------------------------
// AngleType (new in v1.3)
// ---------------------------------------------------------------------------
export const ANGLE_TYPES = ['heading', 'pitch', 'roll'] as const;
export type AngleType = (typeof ANGLE_TYPES)[number];

// ---------------------------------------------------------------------------
// AutomaticGearType
// ---------------------------------------------------------------------------
export const AUTOMATIC_GEAR_TYPES = ['n', 'p', 'r', 'd'] as const;
export type AutomaticGearType = (typeof AUTOMATIC_GEAR_TYPES)[number];

// ---------------------------------------------------------------------------
// CloudState (deprecated in v1.3.1; kept for legacy v1.2 round-trip.
// FractionalCloudCover is the v1.3 replacement.)
// ---------------------------------------------------------------------------
/** @deprecated Superseded by FractionalCloudCover in v1.3. */
export const CLOUD_STATES = ['cloudy', 'free', 'overcast', 'rainy', 'skyOff'] as const;
/** @deprecated Superseded by FractionalCloudCover in v1.3. */
export type CloudState = (typeof CLOUD_STATES)[number];

// ---------------------------------------------------------------------------
// ColorType
// ---------------------------------------------------------------------------
export const COLOR_TYPES = [
  'other',
  'red',
  'yellow',
  'green',
  'blue',
  'violet',
  'orange',
  'brown',
  'black',
  'grey',
  'white',
] as const;
export type ColorType = (typeof COLOR_TYPES)[number];

// ---------------------------------------------------------------------------
// ConditionEdge
// ---------------------------------------------------------------------------
export const CONDITION_EDGES = ['falling', 'none', 'rising', 'risingOrFalling'] as const;
export type ConditionEdge = (typeof CONDITION_EDGES)[number];

// ---------------------------------------------------------------------------
// ControllerType
// ---------------------------------------------------------------------------
export const CONTROLLER_TYPES = [
  'lateral',
  'longitudinal',
  'lighting',
  'animation',
  'movement',
  'appearance',
  'all',
] as const;
export type ControllerType = (typeof CONTROLLER_TYPES)[number];

// ---------------------------------------------------------------------------
// CoordinateSystem ('world' added in v1.3)
// ---------------------------------------------------------------------------
export const COORDINATE_SYSTEMS = ['entity', 'lane', 'road', 'trajectory', 'world'] as const;
export type CoordinateSystem = (typeof COORDINATE_SYSTEMS)[number];

// ---------------------------------------------------------------------------
// DirectionalDimension
// ---------------------------------------------------------------------------
export const DIRECTIONAL_DIMENSIONS = ['longitudinal', 'lateral', 'vertical'] as const;
export type DirectionalDimension = (typeof DIRECTIONAL_DIMENSIONS)[number];

// ---------------------------------------------------------------------------
// DynamicsDimension
// ---------------------------------------------------------------------------
export const DYNAMICS_DIMENSIONS = ['distance', 'rate', 'time'] as const;
export type DynamicsDimension = (typeof DYNAMICS_DIMENSIONS)[number];

// ---------------------------------------------------------------------------
// DynamicsShape
// ---------------------------------------------------------------------------
export const DYNAMICS_SHAPES = ['cubic', 'linear', 'sinusoidal', 'step'] as const;
export type DynamicsShape = (typeof DYNAMICS_SHAPES)[number];

// ---------------------------------------------------------------------------
// FollowingMode
// ---------------------------------------------------------------------------
export const FOLLOWING_MODES = ['follow', 'position'] as const;
export type FollowingMode = (typeof FOLLOWING_MODES)[number];

// ---------------------------------------------------------------------------
// FractionalCloudCover
// ---------------------------------------------------------------------------
export const FRACTIONAL_CLOUD_COVER_VALUES = [
  'zeroOktas',
  'oneOktas',
  'twoOktas',
  'threeOktas',
  'fourOktas',
  'fiveOktas',
  'sixOktas',
  'sevenOktas',
  'eightOktas',
  'nineOktas',
] as const;
export type FractionalCloudCover = (typeof FRACTIONAL_CLOUD_COVER_VALUES)[number];

// ---------------------------------------------------------------------------
// LateralDisplacement
// ---------------------------------------------------------------------------
export const LATERAL_DISPLACEMENTS = [
  'any',
  'leftToReferencedEntity',
  'rightToReferencedEntity',
] as const;
export type LateralDisplacement = (typeof LATERAL_DISPLACEMENTS)[number];

// ---------------------------------------------------------------------------
// LightMode
// ---------------------------------------------------------------------------
export const LIGHT_MODES = ['on', 'off', 'flashing'] as const;
export type LightMode = (typeof LIGHT_MODES)[number];

// ---------------------------------------------------------------------------
// LongitudinalDisplacement
// ---------------------------------------------------------------------------
export const LONGITUDINAL_DISPLACEMENTS = [
  'any',
  'trailingReferencedEntity',
  'leadingReferencedEntity',
] as const;
export type LongitudinalDisplacement = (typeof LONGITUDINAL_DISPLACEMENTS)[number];

// ---------------------------------------------------------------------------
// MiscObjectCategory ('wind' deprecated in v1.3.1; kept for legacy round-trip)
// ---------------------------------------------------------------------------
export const MISC_OBJECT_CATEGORIES = [
  'barrier',
  'building',
  'crosswalk',
  'gantry',
  'none',
  'obstacle',
  'parkingSpace',
  'patch',
  'pole',
  'railing',
  'roadMark',
  'soundBarrier',
  'streetLamp',
  'trafficIsland',
  'tree',
  'vegetation',
  /** @deprecated */
  'wind',
] as const;
export type MiscObjectCategory = (typeof MISC_OBJECT_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// ObjectType
// ---------------------------------------------------------------------------
export const OBJECT_TYPES = ['miscellaneous', 'pedestrian', 'vehicle', 'external'] as const;
export type ObjectType = (typeof OBJECT_TYPES)[number];

// ---------------------------------------------------------------------------
// ParameterType ('integer' deprecated in v1.3.1; kept for legacy round-trip)
// ---------------------------------------------------------------------------
export const PARAMETER_TYPES = [
  'boolean',
  'dateTime',
  'double',
  /** @deprecated Use 'int' instead. */
  'integer',
  'string',
  'unsignedInt',
  'unsignedShort',
  'int',
] as const;
export type ParameterType = (typeof PARAMETER_TYPES)[number];

// ---------------------------------------------------------------------------
// PedestrianCategory
// ---------------------------------------------------------------------------
export const PEDESTRIAN_CATEGORIES = ['animal', 'pedestrian', 'wheelchair'] as const;
export type PedestrianCategory = (typeof PEDESTRIAN_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// PedestrianGestureType
// ---------------------------------------------------------------------------
export const PEDESTRIAN_GESTURE_TYPES = [
  'phoneCallRightHand',
  'phoneCallLeftHand',
  'phoneTextRightHand',
  'phoneTextLeftHand',
  'wavingRightArm',
  'wavingLeftArm',
  'umbrellaRightHand',
  'umbrellaLeftHand',
  'crossArms',
  'coffeeRightHand',
  'coffeeLeftHand',
  'sandwichRightHand',
  'sandwichLeftHand',
] as const;
export type PedestrianGestureType = (typeof PEDESTRIAN_GESTURE_TYPES)[number];

// ---------------------------------------------------------------------------
// PedestrianMotionType
// ---------------------------------------------------------------------------
export const PEDESTRIAN_MOTION_TYPES = [
  'standing',
  'sitting',
  'lying',
  'squatting',
  'walking',
  'running',
  'reeling',
  'crawling',
  'cycling',
  'jumping',
  'ducking',
  'bendingDown',
] as const;
export type PedestrianMotionType = (typeof PEDESTRIAN_MOTION_TYPES)[number];

// ---------------------------------------------------------------------------
// PrecipitationType
// ---------------------------------------------------------------------------
export const PRECIPITATION_TYPE_VALUES = ['dry', 'rain', 'snow'] as const;
export type PrecipitationType = (typeof PRECIPITATION_TYPE_VALUES)[number];

// ---------------------------------------------------------------------------
// Priority ('overwrite' deprecated in v1.3.1; renamed to 'override')
// ---------------------------------------------------------------------------
export const PRIORITIES = [
  /** @deprecated Renamed to 'override'. */
  'overwrite',
  'override',
  'parallel',
  'skip',
] as const;
export type Priority = (typeof PRIORITIES)[number];

// ---------------------------------------------------------------------------
// ReferenceContext
// ---------------------------------------------------------------------------
export const REFERENCE_CONTEXTS = ['absolute', 'relative'] as const;
export type ReferenceContext = (typeof REFERENCE_CONTEXTS)[number];

// ---------------------------------------------------------------------------
// RelativeDistanceType ('cartesianDistance' deprecated in v1.3.1)
// ---------------------------------------------------------------------------
export const RELATIVE_DISTANCE_TYPES = [
  'lateral',
  'longitudinal',
  /** @deprecated Use 'euclidianDistance' instead. */
  'cartesianDistance',
  'euclidianDistance',
] as const;
export type RelativeDistanceType = (typeof RELATIVE_DISTANCE_TYPES)[number];

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------
export const ROLES = [
  'none',
  'ambulance',
  'civil',
  'fire',
  'military',
  'police',
  'publicTransport',
  'roadAssistance',
] as const;
export type Role = (typeof ROLES)[number];

// ---------------------------------------------------------------------------
// RouteStrategy
// ---------------------------------------------------------------------------
export const ROUTE_STRATEGIES = ['fastest', 'leastIntersections', 'random', 'shortest'] as const;
export type RouteStrategy = (typeof ROUTE_STRATEGIES)[number];

// ---------------------------------------------------------------------------
// RoutingAlgorithm
// ---------------------------------------------------------------------------
export const ROUTING_ALGORITHMS = [
  'assignedRoute',
  'fastest',
  'leastIntersections',
  'shortest',
  'undefined',
] as const;
export type RoutingAlgorithm = (typeof ROUTING_ALGORITHMS)[number];

// ---------------------------------------------------------------------------
// Rule
// ---------------------------------------------------------------------------
export const RULES = [
  'equalTo',
  'greaterThan',
  'lessThan',
  'greaterOrEqual',
  'lessOrEqual',
  'notEqualTo',
] as const;
export type Rule = (typeof RULES)[number];

// ---------------------------------------------------------------------------
// SpeedTargetValueType
// ---------------------------------------------------------------------------
export const SPEED_TARGET_VALUE_TYPES = ['delta', 'factor'] as const;
export type SpeedTargetValueType = (typeof SPEED_TARGET_VALUE_TYPES)[number];

// ---------------------------------------------------------------------------
// StoryboardElementState
// ---------------------------------------------------------------------------
export const STORYBOARD_ELEMENT_STATES = [
  'completeState',
  'endTransition',
  'runningState',
  'skipTransition',
  'standbyState',
  'startTransition',
  'stopTransition',
] as const;
export type StoryboardElementState = (typeof STORYBOARD_ELEMENT_STATES)[number];

// ---------------------------------------------------------------------------
// StoryboardElementType
// ---------------------------------------------------------------------------
export const STORYBOARD_ELEMENT_TYPES = [
  'act',
  'action',
  'event',
  'maneuver',
  'maneuverGroup',
  'story',
] as const;
export type StoryboardElementType = (typeof STORYBOARD_ELEMENT_TYPES)[number];

// ---------------------------------------------------------------------------
// TriggeringEntitiesRule
// ---------------------------------------------------------------------------
export const TRIGGERING_ENTITIES_RULES = ['all', 'any'] as const;
export type TriggeringEntitiesRule = (typeof TRIGGERING_ENTITIES_RULES)[number];

// ---------------------------------------------------------------------------
// VehicleCategory
// ---------------------------------------------------------------------------
export const VEHICLE_CATEGORIES = [
  'bicycle',
  'bus',
  'car',
  'motorbike',
  'semitrailer',
  'trailer',
  'train',
  'tram',
  'truck',
  'van',
] as const;
export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// VehicleComponentType
// ---------------------------------------------------------------------------
export const VEHICLE_COMPONENT_TYPES = [
  'hood',
  'trunk',
  'doorFrontRight',
  'doorFrontLeft',
  'doorRearRight',
  'doorRearLeft',
  'windowFrontRight',
  'windowFrontLeft',
  'windowRearRight',
  'windowRearLeft',
  'sideMirrors',
  'sideMirrorRight',
  'sideMirrorLeft',
] as const;
export type VehicleComponentType = (typeof VEHICLE_COMPONENT_TYPES)[number];

// ---------------------------------------------------------------------------
// VehicleLightType
// ---------------------------------------------------------------------------
export const VEHICLE_LIGHT_TYPES = [
  'daytimeRunningLights',
  'lowBeam',
  'highBeam',
  'fogLights',
  'fogLightsFront',
  'fogLightsRear',
  'brakeLights',
  'warningLights',
  'indicatorLeft',
  'indicatorRight',
  'reversingLights',
  'licensePlateIllumination',
  'specialPurposeLights',
] as const;
export type VehicleLightType = (typeof VEHICLE_LIGHT_TYPES)[number];

// ---------------------------------------------------------------------------
// Wetness
// ---------------------------------------------------------------------------
export const WETNESS_VALUES = [
  'dry',
  'moist',
  'wetWithPuddles',
  'lowFlooded',
  'highFlooded',
] as const;
export type Wetness = (typeof WETNESS_VALUES)[number];

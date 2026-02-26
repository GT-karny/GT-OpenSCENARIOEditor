/**
 * OpenSCENARIO v1.2.0 Enum Types
 *
 * Auto-extracted from OpenSCENARIO.xsd schema.
 * Each type corresponds to an xsd:simpleType with enumeration restrictions.
 */

export type AutomaticGearType = 'n' | 'p' | 'r' | 'd';

/** @deprecated */
export type CloudState = 'cloudy' | 'free' | 'overcast' | 'rainy' | 'skyOff';

export type ColorType =
  | 'other'
  | 'red'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'violet'
  | 'orange'
  | 'brown'
  | 'black'
  | 'grey'
  | 'white';

export type ConditionEdge = 'falling' | 'none' | 'rising' | 'risingOrFalling';

export type ControllerType =
  | 'lateral'
  | 'longitudinal'
  | 'lighting'
  | 'animation'
  | 'movement'
  | 'appearance'
  | 'all';

export type CoordinateSystem = 'entity' | 'lane' | 'road' | 'trajectory';

export type DirectionalDimension = 'longitudinal' | 'lateral' | 'vertical';

export type DynamicsDimension = 'distance' | 'rate' | 'time';

export type DynamicsShape = 'cubic' | 'linear' | 'sinusoidal' | 'step';

export type FollowingMode = 'follow' | 'position';

export type FractionalCloudCover =
  | 'zeroOktas'
  | 'oneOktas'
  | 'twoOktas'
  | 'threeOktas'
  | 'fourOktas'
  | 'fiveOktas'
  | 'sixOktas'
  | 'sevenOktas'
  | 'eightOktas'
  | 'nineOktas';

export type LateralDisplacement = 'any' | 'leftToReferencedEntity' | 'rightToReferencedEntity';

export type LightMode = 'on' | 'off' | 'flashing';

export type LongitudinalDisplacement =
  | 'any'
  | 'trailingReferencedEntity'
  | 'leadingReferencedEntity';

export type MiscObjectCategory =
  | 'barrier'
  | 'building'
  | 'crosswalk'
  | 'gantry'
  | 'none'
  | 'obstacle'
  | 'parkingSpace'
  | 'patch'
  | 'pole'
  | 'railing'
  | 'roadMark'
  | 'soundBarrier'
  | 'streetLamp'
  | 'trafficIsland'
  | 'tree'
  | 'vegetation'
  /** @deprecated */
  | 'wind';

export type ObjectType = 'miscellaneous' | 'pedestrian' | 'vehicle' | 'external';

export type ParameterType =
  | 'boolean'
  | 'dateTime'
  | 'double'
  /** @deprecated */
  | 'integer'
  | 'string'
  | 'unsignedInt'
  | 'unsignedShort'
  | 'int';

export type PedestrianCategory = 'animal' | 'pedestrian' | 'wheelchair';

export type PedestrianGestureType =
  | 'phoneCallRightHand'
  | 'phoneCallLeftHand'
  | 'phoneTextRightHand'
  | 'phoneTextLeftHand'
  | 'wavingRightArm'
  | 'wavingLeftArm'
  | 'umbrellaRightHand'
  | 'umbrellaLeftHand'
  | 'crossArms'
  | 'coffeeRightHand'
  | 'coffeeLeftHand'
  | 'sandwichRightHand'
  | 'sandwichLeftHand';

export type PedestrianMotionType =
  | 'standing'
  | 'sitting'
  | 'lying'
  | 'squatting'
  | 'walking'
  | 'running'
  | 'reeling'
  | 'crawling'
  | 'cycling'
  | 'jumping'
  | 'ducking'
  | 'bendingDown';

export type PrecipitationType = 'dry' | 'rain' | 'snow';

export type Priority =
  /** @deprecated */
  | 'overwrite'
  | 'override'
  | 'parallel'
  | 'skip';

export type ReferenceContext = 'absolute' | 'relative';

export type RelativeDistanceType =
  | 'lateral'
  | 'longitudinal'
  /** @deprecated */
  | 'cartesianDistance'
  | 'euclidianDistance';

export type Role =
  | 'none'
  | 'ambulance'
  | 'civil'
  | 'fire'
  | 'military'
  | 'police'
  | 'publicTransport'
  | 'roadAssistance';

export type RouteStrategy = 'fastest' | 'leastIntersections' | 'random' | 'shortest';

export type RoutingAlgorithm =
  | 'assignedRoute'
  | 'fastest'
  | 'leastIntersections'
  | 'shortest'
  | 'undefined';

export type Rule =
  | 'equalTo'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterOrEqual'
  | 'lessOrEqual'
  | 'notEqualTo';

export type SpeedTargetValueType = 'delta' | 'factor';

export type StoryboardElementState =
  | 'completeState'
  | 'endTransition'
  | 'runningState'
  | 'skipTransition'
  | 'standbyState'
  | 'startTransition'
  | 'stopTransition';

export type StoryboardElementType =
  | 'act'
  | 'action'
  | 'event'
  | 'maneuver'
  | 'maneuverGroup'
  | 'story';

export type TriggeringEntitiesRule = 'all' | 'any';

export type VehicleCategory =
  | 'bicycle'
  | 'bus'
  | 'car'
  | 'motorbike'
  | 'semitrailer'
  | 'trailer'
  | 'train'
  | 'tram'
  | 'truck'
  | 'van';

export type VehicleComponentType =
  | 'hood'
  | 'trunk'
  | 'doorFrontRight'
  | 'doorFrontLeft'
  | 'doorRearRight'
  | 'doorRearLeft'
  | 'windowFrontRight'
  | 'windowFrontLeft'
  | 'windowRearRight'
  | 'windowRearLeft'
  | 'sideMirrors'
  | 'sideMirrorRight'
  | 'sideMirrorLeft';

export type VehicleLightType =
  | 'daytimeRunningLights'
  | 'lowBeam'
  | 'highBeam'
  | 'fogLights'
  | 'fogLightsFront'
  | 'fogLightsRear'
  | 'brakeLights'
  | 'warningLights'
  | 'indicatorLeft'
  | 'indicatorRight'
  | 'reversingLights'
  | 'licensePlateIllumination'
  | 'specialPurposeLights';

export type Wetness = 'dry' | 'moist' | 'wetWithPuddles' | 'lowFlooded' | 'highFlooded';

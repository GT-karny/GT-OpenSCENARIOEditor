/**
 * OpenDRIVE enum types.
 */

export type OdrRoadType =
  | 'unknown' | 'rural' | 'motorway' | 'town'
  | 'lowSpeed' | 'pedestrian' | 'bicycle' | 'townExpressway'
  | 'townCollector' | 'townArterial' | 'townPrivate' | 'townLocal'
  | 'townPlayStreet';

export type OdrLaneType =
  | 'shoulder' | 'border' | 'driving' | 'stop'
  | 'none' | 'restricted' | 'parking' | 'median'
  | 'biking' | 'sidewalk' | 'curb' | 'exit'
  | 'entry' | 'onRamp' | 'offRamp' | 'connectingRamp'
  | 'bidirectional' | 'special1' | 'special2' | 'special3'
  | 'roadWorks' | 'tram' | 'rail' | 'bus'
  | 'taxi' | 'HOV' | 'mwyEntry' | 'mwyExit';

export type OdrRoadMarkType =
  | 'none' | 'solid' | 'broken' | 'solid_solid'
  | 'solid_broken' | 'broken_solid' | 'broken_broken'
  | 'botts_dots' | 'grass' | 'curb' | 'custom' | 'edge';

export type OdrRoadMarkColor =
  | 'standard' | 'blue' | 'green' | 'red'
  | 'white' | 'yellow' | 'orange' | 'violet';

export type OdrContactPoint = 'start' | 'end';

export type OdrElementType = 'road' | 'junction';

export type OdrAccessRestriction =
  | 'simulator' | 'autonomousTraffic' | 'pedestrian' | 'passengerCar'
  | 'bus' | 'delivery' | 'emergency' | 'taxi'
  | 'throughTraffic' | 'truck' | 'bicycle' | 'motorcycle' | 'none' | 'trucks';

export type OdrObjectType =
  | 'none' | 'obstacle' | 'pole' | 'tree' | 'vegetation'
  | 'barrier' | 'building' | 'parkingSpace' | 'patch'
  | 'railing' | 'trafficIsland' | 'crosswalk' | 'streetLamp'
  | 'gantry' | 'soundBarrier' | 'roadMark';

export type OdrTunnelType = 'standard' | 'underpass';

export type OdrBridgeType = 'concrete' | 'steel' | 'brick' | 'wood';

export type OdrOutlineFillType =
  | 'grass' | 'concrete' | 'cobble' | 'asphalt'
  | 'pavement' | 'gravel' | 'soil';

export type OdrJunctionGroupType = 'roundabout' | 'unknown';

export type OdrRailroadSwitchPosition = 'dynamic' | 'straight' | 'turn';

export type OdrRoadMarkWeight = 'standard' | 'bold';

export type OdrRoadMarkRule = 'no passing' | 'caution' | 'none';

export type OdrParkingSpaceAccess =
  | 'all' | 'car' | 'women' | 'handicapped'
  | 'bus' | 'truck' | 'electric' | 'residents';

export type OdrStationType = 'small' | 'medium' | 'large';

export type OdrOrientation = '+' | '-' | 'none';

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

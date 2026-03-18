/**
 * OpenDRIVE junction types.
 */

export interface OdrJunction {
  id: string;
  name: string;
  type?: string;
  connections: OdrJunctionConnection[];
}

export interface OdrJunctionConnection {
  id: string;
  incomingRoad: string;
  connectingRoad: string;
  contactPoint: 'start' | 'end';
  laneLinks: { from: number; to: number }[];
}

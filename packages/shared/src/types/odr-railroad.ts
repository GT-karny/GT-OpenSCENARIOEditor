/**
 * OpenDRIVE railroad types.
 */

export interface OdrRailroad {
  switches?: OdrRailroadSwitch[];
}

export interface OdrRailroadSwitch {
  name: string;
  id: string;
  position: 'dynamic' | 'straight' | 'turn';
  mainTrack: OdrSwitchTrack;
  sideTrack: OdrSwitchTrack;
  partner?: OdrSwitchPartner;
}

export interface OdrSwitchTrack {
  id: string;
  s: number;
  dir: '+' | '-';
}

export interface OdrSwitchPartner {
  name?: string;
  id: string;
}

export interface OdrStation {
  name: string;
  id: string;
  type?: 'small' | 'medium' | 'large';
  platforms: OdrPlatform[];
}

export interface OdrPlatform {
  name?: string;
  id: string;
  segments: OdrPlatformSegment[];
}

export interface OdrPlatformSegment {
  roadId: string;
  sStart: number;
  sEnd: number;
  side: 'left' | 'right';
}

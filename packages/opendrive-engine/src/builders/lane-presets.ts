/**
 * Lane presets for quick road creation.
 * Each preset defines a symmetric or asymmetric lane configuration.
 */

export interface LanePreset {
  name: string;
  description: string;
  leftLanes: Array<{ type: string; width: number }>;
  rightLanes: Array<{ type: string; width: number }>;
}

export const DEFAULT_PRESETS: LanePreset[] = [
  {
    name: '2-lane',
    description: '1 lane each direction',
    leftLanes: [{ type: 'driving', width: 3.5 }],
    rightLanes: [{ type: 'driving', width: 3.5 }],
  },
  {
    name: '4-lane',
    description: '2 lanes each direction',
    leftLanes: [
      { type: 'driving', width: 3.5 },
      { type: 'driving', width: 3.5 },
    ],
    rightLanes: [
      { type: 'driving', width: 3.5 },
      { type: 'driving', width: 3.5 },
    ],
  },
  {
    name: '2-lane+shoulder',
    description: '1 lane each + shoulder',
    leftLanes: [
      { type: 'driving', width: 3.5 },
      { type: 'shoulder', width: 2.5 },
    ],
    rightLanes: [
      { type: 'driving', width: 3.5 },
      { type: 'shoulder', width: 2.5 },
    ],
  },
];

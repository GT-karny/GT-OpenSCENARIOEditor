/**
 * Universal signal head presets — country-independent.
 */
import type { BulbFaceShape } from './signal-preset-types.js';

export type SignalHeadOrientation = 'vertical' | 'horizontal';
export type SignalHeadCategory = 'vehicle' | 'pedestrian' | 'arrow';
export type BulbColor = 'red' | 'yellow' | 'green';

export interface SignalHeadPreset {
  id: string;
  label: string;
  orientation: SignalHeadOrientation;
  bulbs: { color: BulbColor; shape: BulbFaceShape }[];
  category: SignalHeadCategory;
}

export const BUILT_IN_PRESETS: SignalHeadPreset[] = [
  {
    id: '3-light-vertical',
    label: '3-Light Vertical',
    orientation: 'vertical',
    bulbs: [
      { color: 'red', shape: 'circle' },
      { color: 'yellow', shape: 'circle' },
      { color: 'green', shape: 'circle' },
    ],
    category: 'vehicle',
  },
  {
    id: '3-light-horizontal',
    label: '3-Light Horizontal',
    orientation: 'horizontal',
    bulbs: [
      { color: 'red', shape: 'circle' },
      { color: 'yellow', shape: 'circle' },
      { color: 'green', shape: 'circle' },
    ],
    category: 'vehicle',
  },
  {
    id: 'arrow-left',
    label: 'Arrow Left',
    orientation: 'vertical',
    bulbs: [{ color: 'green', shape: 'arrow-left' }],
    category: 'arrow',
  },
  {
    id: 'arrow-right',
    label: 'Arrow Right',
    orientation: 'vertical',
    bulbs: [{ color: 'green', shape: 'arrow-right' }],
    category: 'arrow',
  },
  {
    id: 'arrow-straight',
    label: 'Arrow Straight',
    orientation: 'vertical',
    bulbs: [{ color: 'green', shape: 'arrow-up' }],
    category: 'arrow',
  },
  {
    id: 'pedestrian-2',
    label: 'Pedestrian 2-Light',
    orientation: 'vertical',
    bulbs: [
      { color: 'red', shape: 'pedestrian-stop' },
      { color: 'green', shape: 'pedestrian-go' },
    ],
    category: 'pedestrian',
  },
];

export function getPresetById(id: string): SignalHeadPreset | undefined {
  return BUILT_IN_PRESETS.find((p) => p.id === id);
}

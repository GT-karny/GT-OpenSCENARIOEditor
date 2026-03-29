/**
 * Universal signal head presets — country-independent.
 */
import type { BulbDefinition, BulbFaceShape, SignalHeadOrientation } from './signal-preset-types.js';

export type SignalHeadCategory = 'vehicle' | 'pedestrian' | 'arrow';

export interface SignalHeadPreset {
  id: string;
  label: string;
  orientation: SignalHeadOrientation;
  bulbs: BulbDefinition[];
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
    bulbs: [{ color: 'green', shape: 'arrow-left' as BulbFaceShape }],
    category: 'arrow',
  },
  {
    id: 'arrow-right',
    label: 'Arrow Right',
    orientation: 'vertical',
    bulbs: [{ color: 'green', shape: 'arrow-right' as BulbFaceShape }],
    category: 'arrow',
  },
  {
    id: 'arrow-straight',
    label: 'Arrow Straight',
    orientation: 'vertical',
    bulbs: [{ color: 'green', shape: 'arrow-up' as BulbFaceShape }],
    category: 'arrow',
  },
  {
    id: 'pedestrian-2',
    label: 'Pedestrian 2-Light',
    orientation: 'vertical',
    bulbs: [
      { color: 'red', shape: 'pedestrian-stop' as BulbFaceShape },
      { color: 'green', shape: 'pedestrian-go' as BulbFaceShape },
    ],
    category: 'pedestrian',
  },
];

export function getPresetById(id: string): SignalHeadPreset | undefined {
  return BUILT_IN_PRESETS.find((p) => p.id === id);
}

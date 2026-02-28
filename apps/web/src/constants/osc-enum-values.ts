/**
 * Runtime enum value arrays for OpenSCENARIO v1.2.
 * Derived from the union types in @osce/shared (packages/shared/src/enums/osc-enums.ts).
 * Used for <Select> dropdown options in property editors.
 */

import type {
  VehicleCategory,
  PedestrianCategory,
  MiscObjectCategory,
  ConditionEdge,
  DynamicsShape,
  Rule,
} from '@osce/shared';
import type { EventPriority } from '@osce/shared';

export const VEHICLE_CATEGORIES: readonly VehicleCategory[] = [
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

export const PEDESTRIAN_CATEGORIES: readonly PedestrianCategory[] = [
  'animal',
  'pedestrian',
  'wheelchair',
] as const;

export const MISC_OBJECT_CATEGORIES: readonly MiscObjectCategory[] = [
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
  'wind',
] as const;

export const CONDITION_EDGES: readonly ConditionEdge[] = [
  'falling',
  'none',
  'rising',
  'risingOrFalling',
] as const;

export const DYNAMICS_SHAPES: readonly DynamicsShape[] = [
  'cubic',
  'linear',
  'sinusoidal',
  'step',
] as const;

export const RULES: readonly Rule[] = [
  'equalTo',
  'greaterThan',
  'lessThan',
  'greaterOrEqual',
  'lessOrEqual',
  'notEqualTo',
] as const;

export const EVENT_PRIORITIES: readonly EventPriority[] = [
  'override',
  'overwrite',
  'skip',
  'parallel',
] as const;

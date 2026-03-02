/**
 * Default values for each condition type.
 * Returns a minimal valid condition object for use when switching condition types.
 * Only required fields are set; optional fields are omitted.
 */

import type { EntityCondition, ValueCondition } from '@osce/shared';

export function defaultEntityConditionByType(type: EntityCondition['type']): EntityCondition {
  switch (type) {
    case 'distance':
      return {
        type: 'distance',
        value: 0,
        freespace: false,
        rule: 'greaterThan',
        position: { type: 'worldPosition', x: 0, y: 0 },
      };
    case 'relativeDistance':
      return {
        type: 'relativeDistance',
        entityRef: '',
        relativeDistanceType: 'euclidianDistance',
        value: 0,
        freespace: false,
        rule: 'greaterThan',
      };
    case 'timeHeadway':
      return {
        type: 'timeHeadway',
        entityRef: '',
        value: 0,
        freespace: false,
        rule: 'greaterThan',
      };
    case 'timeToCollision':
      return {
        type: 'timeToCollision',
        value: 0,
        freespace: false,
        rule: 'greaterThan',
        target: { kind: 'entity', entityRef: '' },
      };
    case 'acceleration':
      return { type: 'acceleration', value: 0, rule: 'greaterThan' };
    case 'speed':
      return { type: 'speed', value: 0, rule: 'greaterThan' };
    case 'relativeSpeed':
      return { type: 'relativeSpeed', entityRef: '', value: 0, rule: 'greaterThan' };
    case 'reachPosition':
      return {
        type: 'reachPosition',
        tolerance: 1,
        position: { type: 'worldPosition', x: 0, y: 0 },
      };
    case 'standStill':
      return { type: 'standStill', duration: 0 };
    case 'traveledDistance':
      return { type: 'traveledDistance', value: 0 };
    case 'endOfRoad':
      return { type: 'endOfRoad', duration: 0 };
    case 'collision':
      return { type: 'collision', target: { kind: 'entity', entityRef: '' } };
    case 'offroad':
      return { type: 'offroad', duration: 0 };
    case 'relativeClearance':
      return { type: 'relativeClearance', freeSpace: false, oppositeLanes: false, entityRefs: [] };
  }
}

export function defaultValueConditionByType(type: ValueCondition['type']): ValueCondition {
  switch (type) {
    case 'simulationTime':
      return { type: 'simulationTime', value: 0, rule: 'greaterThan' };
    case 'storyboardElementState':
      return {
        type: 'storyboardElementState',
        storyboardElementRef: '',
        storyboardElementType: 'story',
        state: 'startTransition',
      };
    case 'parameter':
      return { type: 'parameter', parameterRef: '', value: '0', rule: 'greaterThan' };
    case 'variable':
      return { type: 'variable', variableRef: '', value: '0', rule: 'greaterThan' };
    case 'trafficSignal':
      return { type: 'trafficSignal', name: '', state: '' };
    case 'trafficSignalController':
      return { type: 'trafficSignalController', trafficSignalControllerRef: '', phase: '' };
    case 'userDefinedValue':
      return { type: 'userDefinedValue', name: '', value: '', rule: 'greaterThan' };
  }
}

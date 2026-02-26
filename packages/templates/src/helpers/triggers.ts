import type {
  Trigger,
  ByEntityCondition,
  ByValueCondition,
} from '@osce/shared';
import { generateId } from './id.js';

export function createSimulationTimeTrigger(time: number): Trigger {
  return {
    id: generateId(),
    conditionGroups: [{
      id: generateId(),
      conditions: [{
        id: generateId(),
        name: 'SimulationTimeCondition',
        delay: 0,
        conditionEdge: 'rising',
        condition: {
          kind: 'byValue',
          valueCondition: {
            type: 'simulationTime',
            value: time,
            rule: 'greaterThan',
          },
        } satisfies ByValueCondition,
      }],
    }],
  };
}

export function createDistanceTrigger(
  triggeringEntityRef: string,
  targetEntityRef: string,
  distance: number,
  rule: 'greaterThan' | 'lessThan' = 'lessThan',
): Trigger {
  return {
    id: generateId(),
    conditionGroups: [{
      id: generateId(),
      conditions: [{
        id: generateId(),
        name: 'RelativeDistanceCondition',
        delay: 0,
        conditionEdge: 'rising',
        condition: {
          kind: 'byEntity',
          triggeringEntities: {
            triggeringEntitiesRule: 'any',
            entityRefs: [triggeringEntityRef],
          },
          entityCondition: {
            type: 'relativeDistance',
            entityRef: targetEntityRef,
            relativeDistanceType: 'longitudinal',
            value: distance,
            freespace: false,
            rule,
          },
        } satisfies ByEntityCondition,
      }],
    }],
  };
}

export function createTimeToCollisionTrigger(
  triggeringEntityRef: string,
  targetEntityRef: string,
  ttcValue: number,
): Trigger {
  return {
    id: generateId(),
    conditionGroups: [{
      id: generateId(),
      conditions: [{
        id: generateId(),
        name: 'TimeToCollisionCondition',
        delay: 0,
        conditionEdge: 'rising',
        condition: {
          kind: 'byEntity',
          triggeringEntities: {
            triggeringEntitiesRule: 'any',
            entityRefs: [triggeringEntityRef],
          },
          entityCondition: {
            type: 'timeToCollision',
            value: ttcValue,
            freespace: true,
            rule: 'lessThan',
            target: { kind: 'entity', entityRef: targetEntityRef },
          },
        } satisfies ByEntityCondition,
      }],
    }],
  };
}

export function createTraveledDistanceTrigger(
  triggeringEntityRef: string,
  distance: number,
): Trigger {
  return {
    id: generateId(),
    conditionGroups: [{
      id: generateId(),
      conditions: [{
        id: generateId(),
        name: 'TraveledDistanceCondition',
        delay: 0,
        conditionEdge: 'rising',
        condition: {
          kind: 'byEntity',
          triggeringEntities: {
            triggeringEntitiesRule: 'any',
            entityRefs: [triggeringEntityRef],
          },
          entityCondition: {
            type: 'traveledDistance',
            value: distance,
          },
        } satisfies ByEntityCondition,
      }],
    }],
  };
}

export function createEmptyTrigger(): Trigger {
  return { id: generateId(), conditionGroups: [] };
}

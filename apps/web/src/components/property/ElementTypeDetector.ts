import type { ScenarioEntity, ScenarioEvent, ScenarioAction, Story, Act, Trigger } from '@osce/shared';

export type DetectedElementType =
  | { kind: 'entity'; element: ScenarioEntity }
  | { kind: 'event'; element: ScenarioEvent }
  | { kind: 'action'; element: ScenarioAction }
  | { kind: 'story'; element: Story }
  | { kind: 'act'; element: Act }
  | { kind: 'trigger'; element: Trigger }
  | { kind: 'unknown'; element: unknown };

export function detectElementType(element: unknown): DetectedElementType {
  if (!element || typeof element !== 'object') {
    return { kind: 'unknown', element };
  }

  const obj = element as Record<string, unknown>;

  // ScenarioEntity: has type ('vehicle'|'pedestrian'|'miscObject') and definition
  if ('type' in obj && 'definition' in obj && 'name' in obj) {
    const t = obj.type;
    if (t === 'vehicle' || t === 'pedestrian' || t === 'miscObject') {
      return { kind: 'entity', element: element as ScenarioEntity };
    }
  }

  // ScenarioEvent: has priority, actions array, and startTrigger
  if ('priority' in obj && 'actions' in obj && 'startTrigger' in obj) {
    return { kind: 'event', element: element as ScenarioEvent };
  }

  // ScenarioAction: has action field
  if ('action' in obj && 'name' in obj && !('acts' in obj) && !('events' in obj)) {
    return { kind: 'action', element: element as ScenarioAction };
  }

  // Story: has acts array
  if ('acts' in obj && 'name' in obj) {
    return { kind: 'story', element: element as Story };
  }

  // Act: has maneuverGroups array
  if ('maneuverGroups' in obj && 'startTrigger' in obj) {
    return { kind: 'act', element: element as Act };
  }

  // Trigger: has conditionGroups array
  if ('conditionGroups' in obj && !('startTrigger' in obj)) {
    return { kind: 'trigger', element: element as Trigger };
  }

  return { kind: 'unknown', element };
}

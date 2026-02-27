/**
 * Duck-typing element type detection for scenario document elements.
 * Mirrors the field-detection approach used in tree-traversal.ts.
 */

import type { OsceNodeType } from '../types/node-types.js';

export function detectElementType(element: unknown): OsceNodeType | null {
  if (!element || typeof element !== 'object') return null;
  const obj = element as Record<string, unknown>;

  // Order matters: check more specific fields first to avoid ambiguity.

  // ScenarioEvent has 'actions' + 'startTrigger' + 'priority'
  if ('actions' in obj && 'startTrigger' in obj && 'priority' in obj) return 'event';

  // ScenarioAction has 'action' (the inner discriminated union) + 'name'
  if ('action' in obj && 'name' in obj && !('acts' in obj) && !('events' in obj)) {
    const action = obj.action;
    if (action && typeof action === 'object' && 'type' in (action as Record<string, unknown>)) {
      return 'action';
    }
  }

  // Condition has 'condition' (inner) + 'conditionEdge' + 'delay'
  if ('conditionEdge' in obj && 'delay' in obj) return 'condition';

  // Trigger has 'conditionGroups'
  if ('conditionGroups' in obj && !('init' in obj)) return 'trigger';

  // Storyboard has 'init' + 'stories' + 'stopTrigger'
  if ('init' in obj && 'stories' in obj) return 'storyboard';

  // Init has 'globalActions' + 'entityActions'
  if ('globalActions' in obj && 'entityActions' in obj) return 'init';

  // Story has 'acts'
  if ('acts' in obj) return 'story';

  // Act has 'maneuverGroups'
  if ('maneuverGroups' in obj) return 'act';

  // ManeuverGroup has 'maneuvers' + 'actors'
  if ('maneuvers' in obj && 'actors' in obj) return 'maneuverGroup';

  // Maneuver has 'events'
  if ('events' in obj) return 'maneuver';

  // ScenarioEntity has 'definition' + 'type' (vehicle|pedestrian|miscObject)
  if ('definition' in obj && 'type' in obj) {
    const t = obj.type;
    if (t === 'vehicle' || t === 'pedestrian' || t === 'miscObject') return 'entity';
  }

  return null;
}

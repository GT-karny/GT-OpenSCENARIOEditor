/**
 * Duck-typing element type detection for scenario document elements.
 *
 * All detection rules live in a single ordered registry (`ELEMENT_TYPE_MATCHERS`)
 * so that the precedence between ambiguous shapes (e.g. 'act' vs 'story') is
 * explicit and adding a new type is one registry entry, not a new if-branch
 * scattered across consumers. Downstream packages (e.g. the web app) that need
 * additional, package-local types can extend the registry via
 * `createElementTypeDetector` rather than duck-typing ahead of the canonical
 * detector.
 */

import type { OsceNodeType } from '../types/node-types.js';

/** A single ordered rule: if `matches` returns true, `type` is the detected result. */
export interface ElementTypeMatcher<T extends string> {
  type: T;
  matches(obj: Record<string, unknown>): boolean;
}

/**
 * Canonical, precedence-ordered matcher list for `OsceNodeType`.
 * Order matters: more specific field combinations must be checked before
 * more generic ones to avoid ambiguity (e.g. 'storyboard' before 'init'/'trigger').
 */
export const ELEMENT_TYPE_MATCHERS: ElementTypeMatcher<OsceNodeType>[] = [
  {
    // ScenarioEvent has 'actions' + 'startTrigger' + 'priority'
    type: 'event',
    matches: (obj) => 'actions' in obj && 'startTrigger' in obj && 'priority' in obj,
  },
  {
    // ScenarioAction has 'action' (the inner discriminated union) + 'name'
    type: 'action',
    matches: (obj) => {
      if (!('action' in obj) || !('name' in obj) || 'acts' in obj || 'events' in obj) {
        return false;
      }
      const action = obj.action;
      return (
        !!action && typeof action === 'object' && 'type' in (action as Record<string, unknown>)
      );
    },
  },
  {
    // Condition has 'condition' (inner) + 'conditionEdge' + 'delay'
    type: 'condition',
    matches: (obj) => 'conditionEdge' in obj && 'delay' in obj,
  },
  {
    // Storyboard has 'init' + 'stories' + 'stopTrigger'; must precede 'init'/'trigger'.
    type: 'storyboard',
    matches: (obj) => 'init' in obj && 'stories' in obj,
  },
  {
    // Trigger has 'conditionGroups'; must follow 'storyboard' (which also nests one).
    type: 'trigger',
    matches: (obj) => 'conditionGroups' in obj && !('init' in obj),
  },
  {
    // Init has 'globalActions' + 'entityActions'
    type: 'init',
    matches: (obj) => 'globalActions' in obj && 'entityActions' in obj,
  },
  {
    // Act has 'maneuverGroups'; must precede 'story' (which only has 'acts').
    type: 'act',
    matches: (obj) => 'maneuverGroups' in obj,
  },
  {
    // Story has 'acts'
    type: 'story',
    matches: (obj) => 'acts' in obj,
  },
  {
    // ManeuverGroup has 'maneuvers' + 'actors'
    type: 'maneuverGroup',
    matches: (obj) => 'maneuvers' in obj && 'actors' in obj,
  },
  {
    // Maneuver has 'events'
    type: 'maneuver',
    matches: (obj) => 'events' in obj,
  },
  {
    // ScenarioEntity has 'definition' + 'type' (vehicle|pedestrian|miscObject)
    type: 'entity',
    matches: (obj) => {
      if (!('definition' in obj) || !('type' in obj)) return false;
      const t = obj.type;
      return t === 'vehicle' || t === 'pedestrian' || t === 'miscObject';
    },
  },
];

/**
 * Builds a detector function from an ordered matcher list. Consumers that need
 * additional, package-local types can pass `matchers` = canonical list plus
 * extension entries prepended/inserted at the correct precedence position.
 */
export function createElementTypeDetector<T extends string>(
  matchers: readonly ElementTypeMatcher<T>[],
): (element: unknown) => T | null {
  return (element: unknown): T | null => {
    if (!element || typeof element !== 'object') return null;
    const obj = element as Record<string, unknown>;
    for (const matcher of matchers) {
      if (matcher.matches(obj)) return matcher.type;
    }
    return null;
  };
}

/** Canonical detector: duck-types `element` against `ELEMENT_TYPE_MATCHERS` in order. */
export const detectElementType = createElementTypeDetector(ELEMENT_TYPE_MATCHERS);

/**
 * Maps a parent field name (e.g. 'maneuverGroups') to the `OsceNodeType` it
 * contains. Single-sourced here so that clipboard/paste-target logic in the
 * web app cannot silently drift from the detection registry above.
 */
export const PARENT_FIELD_TO_TYPE: Partial<Record<string, OsceNodeType>> = {
  maneuverGroups: 'maneuverGroup',
  maneuvers: 'maneuver',
  events: 'event',
  actions: 'action',
  entities: 'entity',
};

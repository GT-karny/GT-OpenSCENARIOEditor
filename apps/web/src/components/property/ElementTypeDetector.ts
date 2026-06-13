import type {
  ScenarioEntity,
  ScenarioEvent,
  ScenarioAction,
  Story,
  Act,
  ManeuverGroup,
  Trigger,
  EntityInitActions,
} from '@osce/shared';
import { detectElementType as detectNodeType } from '@osce/node-editor';

/**
 * Web-side discriminated union consumed by PropertyEditor. The detection rules
 * are single-sourced in `@osce/node-editor`'s `detectElementType`; this module is
 * a thin typed wrapper that maps the canonical string result onto this union and
 * adds the web-only `entityInit` case (which has no node-editor equivalent).
 */
export type DetectedElementType =
  | { kind: 'entity'; element: ScenarioEntity }
  | { kind: 'event'; element: ScenarioEvent }
  | { kind: 'action'; element: ScenarioAction }
  | { kind: 'story'; element: Story }
  | { kind: 'act'; element: Act }
  | { kind: 'maneuverGroup'; element: ManeuverGroup }
  | { kind: 'trigger'; element: Trigger }
  | { kind: 'entityInit'; element: EntityInitActions }
  | { kind: 'unknown'; element: unknown };

export function detectElementType(element: unknown): DetectedElementType {
  if (!element || typeof element !== 'object') {
    return { kind: 'unknown', element };
  }

  const obj = element as Record<string, unknown>;

  // EntityInitActions has no node-editor concept, so detect it web-side first.
  if ('entityRef' in obj && 'privateActions' in obj && Array.isArray(obj.privateActions)) {
    return { kind: 'entityInit', element: element as EntityInitActions };
  }

  // Delegate to the canonical node-editor detector and map onto this union.
  switch (detectNodeType(element)) {
    case 'entity':
      return { kind: 'entity', element: element as ScenarioEntity };
    case 'event':
      return { kind: 'event', element: element as ScenarioEvent };
    case 'action':
      return { kind: 'action', element: element as ScenarioAction };
    case 'story':
      return { kind: 'story', element: element as Story };
    case 'act':
      return { kind: 'act', element: element as Act };
    case 'maneuverGroup':
      return { kind: 'maneuverGroup', element: element as ManeuverGroup };
    case 'trigger':
      return { kind: 'trigger', element: element as Trigger };
    default:
      // storyboard | init | maneuver | condition | null are not handled by
      // PropertyEditor and fall through to the unknown branch.
      return { kind: 'unknown', element };
  }
}

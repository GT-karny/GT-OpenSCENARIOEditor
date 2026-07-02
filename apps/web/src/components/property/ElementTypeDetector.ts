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
import type { ElementTypeMatcher, OsceNodeType } from '@osce/node-editor';
import { createElementTypeDetector, ELEMENT_TYPE_MATCHERS } from '@osce/node-editor';

/**
 * Web-side discriminated union consumed by PropertyEditor. The detection rules
 * are single-sourced in `@osce/node-editor`'s element-type registry; this module
 * is a thin typed wrapper that maps the canonical result onto this union and
 * extends the registry with the web-only `entityInit` type (which has no
 * node-editor equivalent).
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

/** Web-only extension of `OsceNodeType`: entity init-actions have no node-editor concept. */
type WebNodeType = OsceNodeType | 'entityInit';

const entityInitMatcher: ElementTypeMatcher<WebNodeType> = {
  type: 'entityInit',
  matches: (obj) =>
    'entityRef' in obj && 'privateActions' in obj && Array.isArray(obj.privateActions),
};

// The entityInit matcher must run first: EntityInitActions has no overlapping
// field signature with any canonical type, but placing it first keeps the
// precedence explicit and matches the previous "detect web-only case first" order.
const WEB_MATCHERS: ElementTypeMatcher<WebNodeType>[] = [
  entityInitMatcher,
  ...ELEMENT_TYPE_MATCHERS,
];

const detectWebNodeType = createElementTypeDetector(WEB_MATCHERS);

export function detectElementType(element: unknown): DetectedElementType {
  if (!element || typeof element !== 'object') {
    return { kind: 'unknown', element };
  }

  // Delegate to the registry (canonical matchers + the web-only entityInit
  // extension) and map onto this union.
  switch (detectWebNodeType(element)) {
    case 'entityInit':
      return { kind: 'entityInit', element: element as EntityInitActions };
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

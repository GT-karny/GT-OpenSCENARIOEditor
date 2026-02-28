import type { OsceNodeType } from '@osce/node-editor';

/**
 * Return the number of direct children of the given element.
 * Used to decide whether a delete-confirmation dialog is needed.
 */
export function getDirectChildCount(element: unknown, elementType: OsceNodeType): number {
  if (!element || typeof element !== 'object') return 0;
  const obj = element as Record<string, unknown>;

  switch (elementType) {
    case 'story':
      return Array.isArray(obj.acts) ? obj.acts.length : 0;
    case 'act':
      return Array.isArray(obj.maneuverGroups) ? obj.maneuverGroups.length : 0;
    case 'maneuverGroup':
      return Array.isArray(obj.maneuvers) ? obj.maneuvers.length : 0;
    case 'maneuver':
      return Array.isArray(obj.events) ? obj.events.length : 0;
    case 'event':
      return Array.isArray(obj.actions) ? obj.actions.length : 0;
    default:
      return 0;
  }
}

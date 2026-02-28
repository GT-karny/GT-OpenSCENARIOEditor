import type { OsceNodeType } from '@osce/node-editor';

/**
 * Count the number of direct child sub-elements of the given element.
 * Includes both domain children (acts, maneuverGroups, …) and trigger
 * condition groups so that the delete-confirmation dialog fires whenever
 * any nested content would be cascade-deleted.
 */
export function getDirectChildCount(element: unknown, elementType: OsceNodeType): number {
  if (!element || typeof element !== 'object') return 0;
  const obj = element as Record<string, unknown>;

  let count = 0;

  switch (elementType) {
    case 'story':
      count += arrayLen(obj.acts);
      break;
    case 'act':
      count += arrayLen(obj.maneuverGroups);
      count += triggerConditionCount(obj.startTrigger);
      count += triggerConditionCount(obj.stopTrigger);
      break;
    case 'maneuverGroup':
      count += arrayLen(obj.maneuvers);
      break;
    case 'maneuver':
      count += arrayLen(obj.events);
      break;
    case 'event':
      count += arrayLen(obj.actions);
      count += triggerConditionCount(obj.startTrigger);
      break;
    default:
      return 0;
  }

  return count;
}

function arrayLen(val: unknown): number {
  return Array.isArray(val) ? val.length : 0;
}

/** Count total conditions inside a Trigger's conditionGroups. */
function triggerConditionCount(trigger: unknown): number {
  if (!trigger || typeof trigger !== 'object') return 0;
  const groups = (trigger as Record<string, unknown>).conditionGroups;
  if (!Array.isArray(groups)) return 0;
  let total = 0;
  for (const g of groups) {
    if (g && typeof g === 'object') {
      total += arrayLen((g as Record<string, unknown>).conditions);
    }
  }
  return total;
}

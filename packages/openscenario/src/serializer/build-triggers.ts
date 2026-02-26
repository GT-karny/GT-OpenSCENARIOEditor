import type { Trigger, Condition } from '@osce/shared';
import { buildConditionBody } from './build-conditions.js';
import { buildAttrs } from '../utils/xml-helpers.js';

/**
 * Serialize an internal Trigger into the XML object structure expected by
 * fast-xml-parser.
 *
 * Returns an object with a `ConditionGroup` array, or an empty string for
 * triggers with no condition groups (producing self-closing elements like
 * `<StopTrigger/>`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildTrigger(trigger: Trigger): any {
  if (trigger.conditionGroups.length === 0) {
    return '';
  }

  return {
    ConditionGroup: trigger.conditionGroups.map((cg) => ({
      Condition: cg.conditions.map(buildCondition),
    })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCondition(c: Condition): any {
  return {
    ...buildAttrs({
      name: c.name,
      delay: c.delay,
      conditionEdge: c.conditionEdge,
    }),
    ...buildConditionBody(c.condition),
  };
}

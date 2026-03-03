import type { Trigger, Condition } from '@osce/shared';
import { buildConditionBody } from './build-conditions.js';
import { buildAttrs } from '../utils/xml-helpers.js';

type AllBindings = Record<string, Record<string, string>>;

/**
 * Serialize an internal Trigger into the XML object structure expected by
 * fast-xml-parser.
 *
 * Returns an object with a `ConditionGroup` array, or an empty string for
 * triggers with no condition groups (producing self-closing elements like
 * `<StopTrigger/>`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildTrigger(trigger: Trigger, allBindings: AllBindings = {}): any {
  if (trigger.conditionGroups.length === 0) {
    return '';
  }

  return {
    ConditionGroup: trigger.conditionGroups.map((cg) => ({
      Condition: cg.conditions.map((c) => buildCondition(c, allBindings)),
    })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCondition(c: Condition, allBindings: AllBindings): any {
  const elementBindings = allBindings[c.id] ?? {};
  return {
    ...buildAttrs({
      name: c.name,
      delay: c.delay,
      conditionEdge: c.conditionEdge,
    }, elementBindings),
    ...buildConditionBody(c.condition, elementBindings),
  };
}

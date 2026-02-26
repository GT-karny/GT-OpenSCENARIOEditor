import type {
  Trigger,
  ConditionGroup,
  Condition,
  ConditionEdge,
} from '@osce/shared';
import { parseConditionBody } from './parse-conditions.js';
import { ensureArray } from '../utils/ensure-array.js';
import { generateId } from '../utils/uuid.js';
import { numAttr, strAttr } from '../utils/xml-helpers.js';

/**
 * Parse a <StartTrigger> or <StopTrigger> XML element into the internal
 * Trigger representation.
 *
 * An empty trigger element (e.g. `<StopTrigger/>`) produces a Trigger with
 * an empty conditionGroups array.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseTrigger(raw: any): Trigger {
  if (!raw) {
    return { id: generateId(), conditionGroups: [] };
  }

  const groups = ensureArray(raw.ConditionGroup);
  if (groups.length === 0) {
    return { id: generateId(), conditionGroups: [] };
  }

  return {
    id: generateId(),
    conditionGroups: groups.map(parseConditionGroup),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseConditionGroup(raw: any): ConditionGroup {
  return {
    id: generateId(),
    conditions: ensureArray(raw?.Condition).map(parseCondition),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCondition(raw: any): Condition {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    delay: numAttr(raw, 'delay'),
    conditionEdge: strAttr(raw, 'conditionEdge', 'rising') as ConditionEdge,
    condition: parseConditionBody(raw),
  };
}

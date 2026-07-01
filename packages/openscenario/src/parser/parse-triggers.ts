import type {
  Trigger,
  ConditionGroup,
  Condition,
  ConditionEdge,
} from '@osce/shared';
import type { RawXml } from '../utils/xml-helpers.js';
import { parseConditionBody } from './parse-conditions.js';
import { generateId } from '@osce/shared';
import { numAttr, strAttr, setBindingElementId, children } from '../utils/xml-helpers.js';

/**
 * Parse a <StartTrigger> or <StopTrigger> XML element into the internal
 * Trigger representation.
 *
 * An empty trigger element (e.g. `<StopTrigger/>`) produces a Trigger with
 * an empty conditionGroups array.
 */
export function parseTrigger(raw: RawXml | undefined): Trigger {
  if (!raw) {
    return { id: generateId(), conditionGroups: [] };
  }

  const groups = children(raw, 'ConditionGroup');
  if (groups.length === 0) {
    return { id: generateId(), conditionGroups: [] };
  }

  return {
    id: generateId(),
    conditionGroups: groups.map(parseConditionGroup),
  };
}

function parseConditionGroup(raw: RawXml): ConditionGroup {
  return {
    id: generateId(),
    conditions: children(raw, 'Condition').map(parseCondition),
  };
}

function parseCondition(raw: RawXml): Condition {
  const id = generateId();
  setBindingElementId(id);
  return {
    id,
    name: strAttr(raw, 'name'),
    delay: numAttr(raw, 'delay'),
    conditionEdge: strAttr(raw, 'conditionEdge', 'rising') as ConditionEdge,
    condition: parseConditionBody(raw),
  };
}

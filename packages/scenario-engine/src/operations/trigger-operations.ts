/**
 * Pure helper functions for trigger operations.
 * Searches the entire document tree for triggers, condition groups, and conditions by ID.
 */

import type {
  ScenarioDocument,
  Trigger,
  ConditionGroup,
  Condition,
} from '@osce/shared';

interface TriggerLocation {
  trigger: Trigger;
  elementId: string;
  field: 'startTrigger' | 'stopTrigger';
}

/**
 * Collects all triggers in the document.
 */
export function getAllTriggers(doc: ScenarioDocument): TriggerLocation[] {
  const results: TriggerLocation[] = [];
  const sb = doc.storyboard;

  // Storyboard stopTrigger
  results.push({ trigger: sb.stopTrigger, elementId: sb.id, field: 'stopTrigger' });

  for (const story of sb.stories) {
    for (const act of story.acts) {
      results.push({ trigger: act.startTrigger, elementId: act.id, field: 'startTrigger' });
      if (act.stopTrigger) {
        results.push({ trigger: act.stopTrigger, elementId: act.id, field: 'stopTrigger' });
      }
      for (const group of act.maneuverGroups) {
        for (const maneuver of group.maneuvers) {
          for (const event of maneuver.events) {
            results.push({ trigger: event.startTrigger, elementId: event.id, field: 'startTrigger' });
          }
        }
      }
    }
  }

  return results;
}

export function findTriggerById(
  doc: ScenarioDocument,
  triggerId: string,
): TriggerLocation | undefined {
  return getAllTriggers(doc).find((t) => t.trigger.id === triggerId);
}

export function findConditionGroupById(
  doc: ScenarioDocument,
  groupId: string,
): { trigger: Trigger; group: ConditionGroup; groupIndex: number } | undefined {
  for (const loc of getAllTriggers(doc)) {
    const groupIndex = loc.trigger.conditionGroups.findIndex((g) => g.id === groupId);
    if (groupIndex !== -1) {
      return { trigger: loc.trigger, group: loc.trigger.conditionGroups[groupIndex], groupIndex };
    }
  }
  return undefined;
}

export function findConditionById(
  doc: ScenarioDocument,
  conditionId: string,
): { group: ConditionGroup; condition: Condition; conditionIndex: number } | undefined {
  for (const loc of getAllTriggers(doc)) {
    for (const group of loc.trigger.conditionGroups) {
      const conditionIndex = group.conditions.findIndex((c) => c.id === conditionId);
      if (conditionIndex !== -1) {
        return { group, condition: group.conditions[conditionIndex], conditionIndex };
      }
    }
  }
  return undefined;
}

/**
 * Reverse mapping from storyboard elements to their single SimulationTime
 * trigger, used by the timeline to render draggable event blocks.
 *
 * A draggable block exists only when an element's `startTrigger` contains
 * EXACTLY ONE {@link SimulationTimeCondition} (across all condition groups /
 * conditions). Such a trigger has an unambiguous "fires at T seconds" time that
 * the user can drag. Anything else (no time condition, multiple time
 * conditions, or a time condition mixed with other conditions) is ambiguous and
 * stays a plain, non-draggable marker.
 *
 * Elements are keyed by both their editor element ID and their esmini fullPath
 * so the timeline (which receives esmini `StoryBoardEvent`s carrying only
 * `fullPath`) can look them up either way.
 */

import type { ScenarioDocument, Trigger, Rule } from '@osce/shared';

/** A resolved draggable time trigger for one storyboard element. */
export interface TimeTriggerTarget {
  /** Editor element ID (event or act). */
  elementId: string;
  /** esmini fullPath, e.g. "Story::Act::Group::Maneuver::Event". */
  fullPath: string;
  /** ID of the single SimulationTimeCondition's owning Condition. */
  conditionId: string;
  /** Current `value` (absolute sim time, seconds) of that condition. */
  currentValue: number;
  /** Current comparison rule of that condition (preserved across edits). */
  rule: Rule;
}

/**
 * If `trigger` contains exactly one SimulationTimeCondition, return that
 * condition's ID and value; otherwise return null (ambiguous / none).
 */
function extractSingleTimeCondition(
  trigger: Trigger | undefined,
): { conditionId: string; value: number; rule: Rule } | null {
  if (!trigger) return null;
  let found: { conditionId: string; value: number; rule: Rule } | null = null;

  for (const group of trigger.conditionGroups) {
    for (const cond of group.conditions) {
      const inner = cond.condition;
      if (inner.kind !== 'byValue') continue;
      if (inner.valueCondition.type !== 'simulationTime') continue;
      // A second time condition makes the trigger ambiguous — bail out.
      if (found) return null;
      found = {
        conditionId: cond.id,
        value: inner.valueCondition.value,
        rule: inner.valueCondition.rule,
      };
    }
  }

  return found;
}

/**
 * Walk the storyboard and collect every element whose startTrigger has exactly
 * one SimulationTimeCondition. Both events and acts are included (both expose a
 * `startTrigger`). Returns targets keyed independently by elementId and by
 * fullPath for flexible lookup.
 */
export function buildTimeTriggerTargets(doc: ScenarioDocument): {
  byElementId: Map<string, TimeTriggerTarget>;
  byFullPath: Map<string, TimeTriggerTarget>;
} {
  const byElementId = new Map<string, TimeTriggerTarget>();
  const byFullPath = new Map<string, TimeTriggerTarget>();

  const add = (elementId: string, fullPath: string, trigger: Trigger | undefined): void => {
    const time = extractSingleTimeCondition(trigger);
    if (!time) return;
    const target: TimeTriggerTarget = {
      elementId,
      fullPath,
      conditionId: time.conditionId,
      currentValue: time.value,
      rule: time.rule,
    };
    byElementId.set(elementId, target);
    byFullPath.set(fullPath, target);
  };

  for (const story of doc.storyboard.stories) {
    for (const act of story.acts) {
      const actPath = `${story.name}::${act.name}`;
      add(act.id, actPath, act.startTrigger);

      for (const group of act.maneuverGroups) {
        const groupPath = `${actPath}::${group.name}`;
        for (const maneuver of group.maneuvers) {
          const maneuverPath = `${groupPath}::${maneuver.name}`;
          for (const event of maneuver.events) {
            const eventPath = `${maneuverPath}::${event.name}`;
            add(event.id, eventPath, event.startTrigger);
          }
        }
      }
    }
  }

  return { byElementId, byFullPath };
}

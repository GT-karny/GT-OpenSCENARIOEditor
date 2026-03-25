/**
 * Utilities for detecting entity reference usages across the storyboard.
 */

import type { ScenarioDocument } from '@osce/shared';

export interface EntityRefUsage {
  /** Human-readable path describing where the reference was found */
  path: string;
  /** ManeuverGroup name (if the usage is in actors) */
  maneuverGroupName?: string;
  /** Type of usage */
  type: 'actor' | 'initAction' | 'triggerEntity' | 'actionRef' | 'conditionRef';
}

/**
 * Find all usages of a given entity name across the document.
 * Returns a list of usage descriptions for UI display.
 */
export function findEntityRefUsages(
  doc: ScenarioDocument,
  entityName: string,
): EntityRefUsage[] {
  const usages: EntityRefUsage[] = [];
  const sb = doc.storyboard;

  // Check init.entityActions
  for (const ea of sb.init.entityActions) {
    if (ea.entityRef === entityName) {
      usages.push({ path: `Init > ${entityName}`, type: 'initAction' });
    }
  }

  // Walk stories → acts → maneuverGroups
  for (const story of sb.stories) {
    for (const act of story.acts) {
      for (const mg of act.maneuverGroups) {
        // Check actors
        if (mg.actors.entityRefs.includes(entityName)) {
          usages.push({
            path: `${story.name} > ${act.name} > ${mg.name}`,
            maneuverGroupName: mg.name,
            type: 'actor',
          });
        }

        // Check triggers and actions in events
        for (const maneuver of mg.maneuvers) {
          for (const event of maneuver.events) {
            // Check triggeringEntities in start trigger
            for (const cg of event.startTrigger.conditionGroups) {
              for (const cond of cg.conditions) {
                if (hasEntityRef(cond, entityName)) {
                  usages.push({
                    path: `${story.name} > ${act.name} > ${mg.name} > ${event.name} (condition)`,
                    type: 'conditionRef',
                  });
                }
              }
            }

            // Check actions
            for (const action of event.actions) {
              if (hasEntityRef(action, entityName)) {
                usages.push({
                  path: `${story.name} > ${act.name} > ${mg.name} > ${event.name} (action)`,
                  type: 'actionRef',
                });
              }
            }
          }
        }
      }

      // Check act startTrigger
      if (act.startTrigger) {
        for (const cg of act.startTrigger.conditionGroups) {
          for (const cond of cg.conditions) {
            if (hasEntityRef(cond, entityName)) {
              usages.push({
                path: `${story.name} > ${act.name} (startTrigger)`,
                type: 'conditionRef',
              });
            }
          }
        }
      }
    }
  }

  // Check stopTrigger
  for (const cg of sb.stopTrigger.conditionGroups) {
    for (const cond of cg.conditions) {
      if (hasEntityRef(cond, entityName)) {
        usages.push({
          path: 'Storyboard stopTrigger',
          type: 'conditionRef',
        });
      }
    }
  }

  return usages;
}

/**
 * Shallow check if an object contains entityRef matching the given name.
 * Walks one level deep into the object's properties.
 */
function hasEntityRef(obj: unknown, entityName: string): boolean {
  if (typeof obj !== 'object' || obj === null) return false;

  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (key === 'entityRef' && val === entityName) return true;
    if (key === 'masterEntityRef' && val === entityName) return true;
    if (key === 'trailerRef' && val === entityName) return true;
    if (key === 'entityRefs' && Array.isArray(val) && val.includes(entityName)) return true;
    // Check one level deeper for nested condition/action properties
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      for (const [k2, v2] of Object.entries(val as Record<string, unknown>)) {
        if (k2 === 'entityRef' && v2 === entityName) return true;
        if (k2 === 'entityRefs' && Array.isArray(v2) && v2.includes(entityName)) return true;
      }
    }
  }
  return false;
}

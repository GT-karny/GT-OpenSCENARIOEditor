/**
 * Maps esmini fullPath strings to ScenarioDocument element IDs.
 *
 * esmini uses "::" separated name paths like "MyStory::MyAct::MyGroup::MyManeuver::MyEvent".
 * The editor uses UUID-based element IDs. This utility traverses the Storyboard
 * hierarchy and builds a lookup table.
 */

import type { ScenarioDocument } from '@osce/shared';

export function buildFullPathToIdMap(doc: ScenarioDocument): Map<string, string> {
  const map = new Map<string, string>();
  const sb = doc.storyboard;

  for (const story of sb.stories) {
    map.set(story.name, story.id);

    for (const act of story.acts) {
      const actPath = `${story.name}::${act.name}`;
      map.set(actPath, act.id);

      for (const group of act.maneuverGroups) {
        const groupPath = `${actPath}::${group.name}`;
        map.set(groupPath, group.id);

        for (const maneuver of group.maneuvers) {
          const maneuverPath = `${groupPath}::${maneuver.name}`;
          map.set(maneuverPath, maneuver.id);

          for (const event of maneuver.events) {
            const eventPath = `${maneuverPath}::${event.name}`;
            map.set(eventPath, event.id);

            for (const action of event.actions) {
              const actionPath = `${eventPath}::${action.name}`;
              map.set(actionPath, action.id);
            }
          }
        }
      }
    }
  }

  return map;
}

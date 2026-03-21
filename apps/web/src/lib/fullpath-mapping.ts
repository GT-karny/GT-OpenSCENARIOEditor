/**
 * Maps esmini fullPath strings to ScenarioDocument element IDs.
 *
 * esmini uses "::" separated name paths like "MyStory::MyAct::MyGroup::MyManeuver::MyEvent".
 * The editor uses UUID-based element IDs. This utility traverses the Storyboard
 * hierarchy and builds a lookup table.
 */

import type { ScenarioDocument, StoryBoardEvent } from '@osce/shared';

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

/** Build reverse map: element ID → fullPath */
export function buildIdToFullPathMap(doc: ScenarioDocument): Map<string, string> {
  const forward = buildFullPathToIdMap(doc);
  const reverse = new Map<string, string>();
  for (const [path, id] of forward) {
    reverse.set(id, path);
  }
  return reverse;
}

/** A time interval during which an element was in "running" state. */
export interface RunningInterval {
  start: number;
  end: number;
}

/**
 * Extract running intervals for a given fullPath from sorted storyBoardEvents.
 * Returns [{start, end}, ...] where start is the timestamp of "running"
 * and end is the timestamp of "complete" (or totalTime if never completed).
 */
export function getRunningIntervals(
  sortedEvents: StoryBoardEvent[],
  fullPath: string,
  totalTime: number,
): RunningInterval[] {
  const intervals: RunningInterval[] = [];
  let runStart: number | null = null;

  for (const ev of sortedEvents) {
    if (ev.fullPath !== fullPath) continue;
    if (ev.state === 'running') {
      runStart = ev.timestamp;
    } else if (ev.state === 'complete' && runStart !== null) {
      intervals.push({ start: runStart, end: ev.timestamp });
      runStart = null;
    }
  }

  // If still running at end of simulation
  if (runStart !== null) {
    intervals.push({ start: runStart, end: totalTime });
  }

  return intervals;
}

/**
 * Pure helper functions for storyboard hierarchy operations.
 */

import type {
  ScenarioDocument,
  Story,
  Act,
  ManeuverGroup,
  Maneuver,
  ScenarioEvent,
  ScenarioAction,
} from '@osce/shared';

export function findStoryById(
  doc: ScenarioDocument,
  storyId: string,
): Story | undefined {
  return doc.storyboard.stories.find((s) => s.id === storyId);
}

export function findStoryIndex(
  doc: ScenarioDocument,
  storyId: string,
): number {
  return doc.storyboard.stories.findIndex((s) => s.id === storyId);
}

export function findActById(
  doc: ScenarioDocument,
  actId: string,
): { story: Story; act: Act; actIndex: number } | undefined {
  for (const story of doc.storyboard.stories) {
    const actIndex = story.acts.findIndex((a) => a.id === actId);
    if (actIndex !== -1) return { story, act: story.acts[actIndex], actIndex };
  }
  return undefined;
}

export function findManeuverGroupById(
  doc: ScenarioDocument,
  groupId: string,
): { act: Act; group: ManeuverGroup; groupIndex: number } | undefined {
  for (const story of doc.storyboard.stories) {
    for (const act of story.acts) {
      const groupIndex = act.maneuverGroups.findIndex((g) => g.id === groupId);
      if (groupIndex !== -1) return { act, group: act.maneuverGroups[groupIndex], groupIndex };
    }
  }
  return undefined;
}

export function findManeuverById(
  doc: ScenarioDocument,
  maneuverId: string,
): { group: ManeuverGroup; maneuver: Maneuver; maneuverIndex: number } | undefined {
  for (const story of doc.storyboard.stories) {
    for (const act of story.acts) {
      for (const group of act.maneuverGroups) {
        const maneuverIndex = group.maneuvers.findIndex((m) => m.id === maneuverId);
        if (maneuverIndex !== -1) return { group, maneuver: group.maneuvers[maneuverIndex], maneuverIndex };
      }
    }
  }
  return undefined;
}

export function findEventById(
  doc: ScenarioDocument,
  eventId: string,
): { maneuver: Maneuver; event: ScenarioEvent; eventIndex: number } | undefined {
  for (const story of doc.storyboard.stories) {
    for (const act of story.acts) {
      for (const group of act.maneuverGroups) {
        for (const maneuver of group.maneuvers) {
          const eventIndex = maneuver.events.findIndex((e) => e.id === eventId);
          if (eventIndex !== -1) return { maneuver, event: maneuver.events[eventIndex], eventIndex };
        }
      }
    }
  }
  return undefined;
}

export function findActionById(
  doc: ScenarioDocument,
  actionId: string,
): { event: ScenarioEvent; action: ScenarioAction; actionIndex: number } | undefined {
  for (const story of doc.storyboard.stories) {
    for (const act of story.acts) {
      for (const group of act.maneuverGroups) {
        for (const maneuver of group.maneuvers) {
          for (const event of maneuver.events) {
            const actionIndex = event.actions.findIndex((a) => a.id === actionId);
            if (actionIndex !== -1) return { event, action: event.actions[actionIndex], actionIndex };
          }
        }
      }
    }
  }
  return undefined;
}

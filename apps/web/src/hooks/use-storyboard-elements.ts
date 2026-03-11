import { useMemo } from 'react';
import type { StoryboardElementType, Storyboard } from '@osce/shared';
import { useScenarioStore } from '../stores/use-scenario-store';

export interface StoryboardElementInfo {
  name: string;
  type: StoryboardElementType;
  path: string;
}

function collectElements(storyboard: Storyboard): StoryboardElementInfo[] {
  const elements: StoryboardElementInfo[] = [];

  for (const story of storyboard.stories) {
    elements.push({ name: story.name, type: 'story', path: story.name });

    for (const act of story.acts) {
      const actPath = `${story.name} > ${act.name}`;
      elements.push({ name: act.name, type: 'act', path: actPath });

      for (const mg of act.maneuverGroups) {
        const mgPath = `${actPath} > ${mg.name}`;
        elements.push({ name: mg.name, type: 'maneuverGroup', path: mgPath });

        for (const maneuver of mg.maneuvers) {
          const mPath = `${mgPath} > ${maneuver.name}`;
          elements.push({ name: maneuver.name, type: 'maneuver', path: mPath });

          for (const event of maneuver.events) {
            const ePath = `${mPath} > ${event.name}`;
            elements.push({ name: event.name, type: 'event', path: ePath });

            for (const action of event.actions) {
              elements.push({
                name: action.name,
                type: 'action',
                path: `${ePath} > ${action.name}`,
              });
            }
          }
        }
      }
    }
  }

  return elements;
}

export function useStoryboardElements(
  filterType?: StoryboardElementType,
): StoryboardElementInfo[] {
  const storyboard = useScenarioStore((s) => s.document.storyboard);

  return useMemo(() => {
    const all = collectElements(storyboard);
    if (!filterType) return all;
    return all.filter((el) => el.type === filterType);
  }, [storyboard, filterType]);
}

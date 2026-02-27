/**
 * Hook to derive timeline data from the scenario document.
 */

import { useMemo, useContext } from 'react';
import type { StoreApi } from 'zustand';
import type { ScenarioStore } from '@osce/scenario-engine';
import type { ScenarioDocument } from '@osce/shared';
import { ScenarioStoreContext } from '../components/NodeEditorProvider.js';
import { useEditorStore } from './use-editor-store.js';
import type { TimelineEventData } from '../components/TimelineEvent.js';

export interface TimelineTrackData {
  entityName: string;
  entityType: string;
  events: TimelineEventData[];
}

function extractTimelineData(doc: ScenarioDocument, selectedIds: string[]): TimelineTrackData[] {
  const entityMap = new Map<string, { type: string; events: TimelineEventData[] }>();

  // Initialize tracks for all entities
  for (const entity of doc.entities) {
    entityMap.set(entity.name, { type: entity.type, events: [] });
  }

  // Walk the storyboard to find events and their associated actors
  for (const story of doc.storyboard.stories) {
    for (const act of story.acts) {
      for (const group of act.maneuverGroups) {
        const actors = group.actors.entityRefs;
        for (const maneuver of group.maneuvers) {
          for (const event of maneuver.events) {
            // Extract start time from trigger if it's a simulationTime condition
            let startTime: number | null = null;
            for (const cg of event.startTrigger.conditionGroups) {
              for (const cond of cg.conditions) {
                if (cond.condition.kind === 'byValue' && cond.condition.valueCondition.type === 'simulationTime') {
                  startTime = cond.condition.valueCondition.value;
                }
              }
            }

            const eventData: TimelineEventData = {
              eventId: event.id,
              eventName: event.name,
              actionTypes: event.actions.map((a) => a.action.type),
              startTime,
              selected: selectedIds.includes(event.id),
            };

            // Add to each actor's track
            for (const actor of actors) {
              const track = entityMap.get(actor);
              if (track) {
                track.events.push(eventData);
              }
            }
          }
        }
      }
    }
  }

  return Array.from(entityMap.entries()).map(([name, data]) => ({
    entityName: name,
    entityType: data.type,
    events: data.events,
  }));
}

export function useTimelineData(): TimelineTrackData[] {
  const scenarioStore = useContext(ScenarioStoreContext) as StoreApi<ScenarioStore> | null;
  const selectedIds = useEditorStore((s) => s.selectedElementIds);

  return useMemo(() => {
    if (!scenarioStore) return [];
    const doc = scenarioStore.getState().document;
    return extractTimelineData(doc, selectedIds);
  }, [scenarioStore, selectedIds]);
}

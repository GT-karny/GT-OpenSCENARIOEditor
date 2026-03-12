/**
 * Hook to collect and resolve all Position references from the scenario storyboard.
 * Bridges Action/Condition positions to 3D rendering markers.
 * Excludes Init TeleportActions (rendered as entities) and Route waypoints (rendered by RouteOverlay).
 */

import { useMemo } from 'react';
import { useStore } from 'zustand';
import type {
  ScenarioDocument,
  OpenDriveDocument,
  Position,
  Trigger,
  PrivateAction,
  GlobalAction,
} from '@osce/shared';
import {
  resolvePositionToWorld,
  type WorldCoords,
  type PositionResolveOptions,
} from '../utils/position-resolver.js';

export interface ScenarioPositionEntry {
  /** Unique key for React rendering (elementId + position role) */
  key: string;
  /** The Position object */
  position: Position;
  /** ID of the owning element (Action or Condition) */
  ownerElementId: string;
  /** Category for visual differentiation */
  category: 'action' | 'condition';
  /** Human-readable short label */
  label: string;
  /** Resolved world coordinates (null if unresolvable) */
  worldCoords: WorldCoords | null;
}

/**
 * Pure function: traverse the storyboard and collect all Position references.
 * Excludes Init section (entity positions) and route waypoints.
 */
export function collectScenarioPositions(
  doc: ScenarioDocument,
  odrDoc: OpenDriveDocument | null,
  options?: PositionResolveOptions,
): ScenarioPositionEntry[] {
  const entries: ScenarioPositionEntry[] = [];
  const storyboard = doc.storyboard;

  // Traverse stories
  for (const story of storyboard.stories) {
    for (const act of story.acts) {
      collectFromTrigger(act.startTrigger, entries, odrDoc, options);
      if (act.stopTrigger) {
        collectFromTrigger(act.stopTrigger, entries, odrDoc, options);
      }

      for (const group of act.maneuverGroups) {
        for (const maneuver of group.maneuvers) {
          for (const event of maneuver.events) {
            // Collect from event actions
            for (const scenarioAction of event.actions) {
              collectFromAction(scenarioAction.id, scenarioAction.action, entries, odrDoc, options);
            }
            // Collect from event start trigger
            collectFromTrigger(event.startTrigger, entries, odrDoc, options);
          }
        }
      }
    }
  }

  // Traverse storyboard stopTrigger
  collectFromTrigger(storyboard.stopTrigger, entries, odrDoc, options);

  return entries;
}

function addEntry(
  entries: ScenarioPositionEntry[],
  elementId: string,
  role: string,
  position: Position,
  category: 'action' | 'condition',
  label: string,
  odrDoc: OpenDriveDocument | null,
  options?: PositionResolveOptions,
): void {
  entries.push({
    key: `${elementId}:${role}`,
    position,
    ownerElementId: elementId,
    category,
    label,
    worldCoords: resolvePositionToWorld(position, odrDoc, options),
  });
}

function collectFromAction(
  actionId: string,
  action: PrivateAction | GlobalAction | { type: string },
  entries: ScenarioPositionEntry[],
  odrDoc: OpenDriveDocument | null,
  options?: PositionResolveOptions,
): void {
  switch (action.type) {
    case 'teleportAction': {
      const a = action as PrivateAction & { type: 'teleportAction' };
      addEntry(entries, actionId, 'position', a.position, 'action', 'Teleport', odrDoc, options);
      break;
    }
    case 'acquirePositionAction': {
      const a = action as PrivateAction & { type: 'acquirePositionAction' };
      addEntry(entries, actionId, 'position', a.position, 'action', 'AcquirePos', odrDoc, options);
      break;
    }
    case 'synchronizeAction': {
      const a = action as PrivateAction & { type: 'synchronizeAction' };
      addEntry(entries, actionId, 'targetPosition', a.targetPosition, 'action', 'Sync Target', odrDoc, options);
      addEntry(entries, actionId, 'targetPositionMaster', a.targetPositionMaster, 'action', 'Sync Master', odrDoc, options);
      break;
    }
    case 'followTrajectoryAction': {
      const a = action as PrivateAction & { type: 'followTrajectoryAction' };
      const shape = a.trajectory.shape;
      if (shape.type === 'polyline') {
        for (let i = 0; i < shape.vertices.length; i++) {
          addEntry(entries, actionId, `vertex-${i}`, shape.vertices[i].position, 'action', `Traj[${i}]`, odrDoc, options);
        }
      } else if (shape.type === 'clothoid' && shape.position) {
        addEntry(entries, actionId, 'clothoid-pos', shape.position, 'action', 'Clothoid', odrDoc, options);
      } else if (shape.type === 'nurbs') {
        for (let i = 0; i < shape.controlPoints.length; i++) {
          addEntry(entries, actionId, `nurbs-${i}`, shape.controlPoints[i].position, 'action', `NURBS[${i}]`, odrDoc, options);
        }
      }
      break;
    }
    case 'routingAction': {
      const a = action as PrivateAction & { type: 'routingAction' };
      if (a.position) {
        addEntry(entries, actionId, 'position', a.position, 'action', 'RouteTarget', odrDoc, options);
      }
      break;
    }
    case 'entityAction': {
      const a = action as GlobalAction & { type: 'entityAction' };
      if (a.position) {
        addEntry(entries, actionId, 'position', a.position, 'action', 'AddEntity', odrDoc, options);
      }
      break;
    }
  }
}

function collectFromTrigger(
  trigger: Trigger,
  entries: ScenarioPositionEntry[],
  odrDoc: OpenDriveDocument | null,
  options?: PositionResolveOptions,
): void {
  for (const group of trigger.conditionGroups) {
    for (const condition of group.conditions) {
      const c = condition.condition;
      if (c.kind === 'byEntity') {
        const ec = c.entityCondition;
        switch (ec.type) {
          case 'distance':
            addEntry(entries, condition.id, 'position', ec.position, 'condition', 'Distance', odrDoc, options);
            break;
          case 'reachPosition':
            addEntry(entries, condition.id, 'position', ec.position, 'condition', 'ReachPos', odrDoc, options);
            break;
          case 'timeToCollision':
            if (ec.target.kind === 'position') {
              addEntry(entries, condition.id, 'position', ec.target.position, 'condition', 'TTC', odrDoc, options);
            }
            break;
        }
      }
    }
  }
}

/**
 * React hook to subscribe to scenario positions from the storyboard.
 */
export function useScenarioPositions(
  store: ReturnType<typeof import('@osce/scenario-engine').createScenarioStore>,
  odrDocument: OpenDriveDocument | null,
  options?: PositionResolveOptions,
): ScenarioPositionEntry[] {
  // Subscribe to storyboard stories and stopTrigger for reactivity
  const stories = useStore(
    store,
    (state: { document: ScenarioDocument }) => state.document.storyboard.stories,
  );
  const stopTrigger = useStore(
    store,
    (state: { document: ScenarioDocument }) => state.document.storyboard.stopTrigger,
  );

  return useMemo(() => {
    const doc = store.getState().document;
    return collectScenarioPositions(doc, odrDocument, options);
  }, [stories, stopTrigger, odrDocument, store, options]);
}

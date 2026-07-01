/**
 * Hook that computes trajectory preview data for the currently selected element.
 *
 * When an Entity, ManeuverGroup, Maneuver, Event, or Action is selected,
 * this hook finds any associated FollowTrajectory actions and resolves
 * their control/vertex positions to world coordinates + curve points for 3D visualization.
 *
 * The preview is read-only (no editing) and is hidden when trajectory-edit mode is active.
 */

import { useMemo, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  OpenDriveDocument,
  ScenarioDocument,
  Trajectory,
  FollowTrajectoryAction,
  PrivateAction,
} from '@osce/shared';
import type { WorldCoords } from '@osce/3d-viewer';
import { resolveTrajectoryVisual } from '../lib/edit-preview-computation';
import { useTrajectoryEditStore } from '../stores/trajectory-edit-store';
import { useEditorStore } from '../stores/editor-store';

export interface TrajectoryPreviewData {
  /** Shape type for rendering hints (e.g. NURBS shows control polygon) */
  shapeType: 'polyline' | 'clothoid' | 'nurbs' | 'clothoidSpline';
  /** Resolved world positions of control points / vertices */
  points: Array<{ x: number; y: number; z: number; h: number }>;
  /** Evaluated curve sample points for smooth line rendering */
  curvePoints: Array<{ x: number; y: number; z: number }>;
}

/**
 * Find all inline trajectories associated with a given entity name in the storyboard.
 */
function findTrajectoriesForEntity(doc: ScenarioDocument, entityName: string): Trajectory[] {
  const trajectories: Trajectory[] = [];
  for (const story of doc.storyboard.stories) {
    for (const act of story.acts) {
      for (const group of act.maneuverGroups) {
        if (!group.actors.entityRefs.includes(entityName)) continue;
        for (const maneuver of group.maneuvers) {
          for (const event of maneuver.events) {
            for (const action of event.actions) {
              const traj = extractTrajectoryFromAction(action.action);
              if (traj) trajectories.push(traj);
            }
          }
        }
      }
    }
  }
  return trajectories;
}

/**
 * Find all inline trajectories reachable from a given element by ID.
 * Works for ManeuverGroup, Maneuver, Event, or Action selection.
 */
function findTrajectoriesForElement(doc: ScenarioDocument, elementId: string): Trajectory[] {
  for (const story of doc.storyboard.stories) {
    for (const act of story.acts) {
      for (const group of act.maneuverGroups) {
        if (group.id === elementId) {
          return collectTrajectoriesFromManeuverGroup(group);
        }
        for (const maneuver of group.maneuvers) {
          if (maneuver.id === elementId) {
            return collectTrajectoriesFromManeuver(maneuver);
          }
          for (const event of maneuver.events) {
            if (event.id === elementId) {
              return collectTrajectoriesFromEvent(event);
            }
            for (const action of event.actions) {
              if (action.id === elementId) {
                const traj = extractTrajectoryFromAction(action.action);
                return traj ? [traj] : [];
              }
            }
          }
        }
      }
    }
  }
  return [];
}

function collectTrajectoriesFromManeuverGroup(
  group: ScenarioDocument['storyboard']['stories'][0]['acts'][0]['maneuverGroups'][0],
): Trajectory[] {
  const trajectories: Trajectory[] = [];
  for (const maneuver of group.maneuvers) {
    trajectories.push(...collectTrajectoriesFromManeuver(maneuver));
  }
  return trajectories;
}

function collectTrajectoriesFromManeuver(
  maneuver: ScenarioDocument['storyboard']['stories'][0]['acts'][0]['maneuverGroups'][0]['maneuvers'][0],
): Trajectory[] {
  const trajectories: Trajectory[] = [];
  for (const event of maneuver.events) {
    trajectories.push(...collectTrajectoriesFromEvent(event));
  }
  return trajectories;
}

function collectTrajectoriesFromEvent(
  event: ScenarioDocument['storyboard']['stories'][0]['acts'][0]['maneuverGroups'][0]['maneuvers'][0]['events'][0],
): Trajectory[] {
  const trajectories: Trajectory[] = [];
  for (const action of event.actions) {
    const traj = extractTrajectoryFromAction(action.action);
    if (traj) trajectories.push(traj);
  }
  return trajectories;
}

function extractTrajectoryFromAction(action: unknown): Trajectory | null {
  const a = action as PrivateAction;
  if (!a || (a as FollowTrajectoryAction).type !== 'followTrajectoryAction') return null;
  // Catalog-referenced trajectories have no inline Trajectory object
  return (a as FollowTrajectoryAction).trajectory ?? null;
}

/**
 * Resolve trajectory positions to world coordinates and compute curve points.
 * Delegates position resolution + curve math to the shared helper.
 */
function resolveTrajectoryPreview(
  trajectory: Trajectory,
  odrDoc: OpenDriveDocument,
  entityPositions?: Map<string, WorldCoords>,
): TrajectoryPreviewData | null {
  const { points, curvePoints } = resolveTrajectoryVisual(trajectory, odrDoc, entityPositions);

  if (points.length === 0 && trajectory.shape.type !== 'clothoidSpline') return null;

  return {
    shapeType: trajectory.shape.type,
    points,
    curvePoints,
  };
}

/**
 * Hook: computes trajectory preview data for the selected element.
 */
export function useTrajectoryPreview(
  scenarioStoreApi: ReturnType<typeof import('../stores/use-scenario-store').useScenarioStoreApi>,
  odrDoc: OpenDriveDocument | null,
  entityPositions?: Map<string, WorldCoords>,
): TrajectoryPreviewData[] {
  const trajectoryEditActive = useTrajectoryEditStore((s) => s.active);

  const doc = useStore(scenarioStoreApi, (s) => s.document);
  const entities = doc.entities;

  const selectedElementIds = useEditorStore(useShallow((s) => s.selection.selectedElementIds));
  const selectedId = selectedElementIds.length === 1 ? selectedElementIds[0] : null;

  // Find trajectories associated with the selection
  const trajectories = useMemo(() => {
    if (!selectedId || trajectoryEditActive) return [];

    // Check if selection is an entity
    const entity = entities.find((e) => e.id === selectedId);
    if (entity) {
      return findTrajectoriesForEntity(doc, entity.name);
    }

    // Otherwise, search by element ID in the storyboard tree
    return findTrajectoriesForElement(doc, selectedId);
  }, [selectedId, trajectoryEditActive, entities, doc]);

  // Compute world positions and curve points for each trajectory
  const [previews, setPreviews] = useState<TrajectoryPreviewData[]>([]);

  useEffect(() => {
    if (!odrDoc || trajectories.length === 0) {
      setPreviews([]);
      return;
    }

    const results: TrajectoryPreviewData[] = [];
    for (const trajectory of trajectories) {
      const preview = resolveTrajectoryPreview(trajectory, odrDoc, entityPositions);
      if (preview) results.push(preview);
    }

    setPreviews(results);
  }, [trajectories, odrDoc, entityPositions]);

  return previews;
}

/**
 * Hook that computes lane-change preview data for the currently selected element.
 *
 * When an Entity, ManeuverGroup, Maneuver, Event, or Action is selected, this
 * hook finds any associated LaneChangeActions (both Init and storyboard),
 * resolves the acting entity's current pose + initial speed, and computes the
 * lateral-transition path for 3D visualization.
 *
 * Actor/target entity references are parameter-resolved (e.g. `$owner`) against
 * the story + top-level parameter declarations, because the parser stores
 * references literally (esmini scenarios frequently drive actors via a `$owner`
 * story parameter).
 *
 * The preview is read-only (no editing) and is hidden when route/trajectory
 * edit modes are active (a lane change is a lateral maneuver, conceptually the
 * same family as the other previews).
 */

import { useMemo, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  OpenDriveDocument,
  ScenarioDocument,
  LaneChangeAction,
  PrivateAction,
  SpeedAction,
  ParameterDeclaration,
} from '@osce/shared';
import type { WorldCoords } from '@osce/3d-viewer';
import { computeLaneChangePath, NOMINAL_SPEED_MPS } from '../lib/lane-change-path-computation';
import type { LaneChangePreviewData } from '@osce/3d-viewer';
import { useRouteEditStore } from '../stores/route-edit-store';
import { useTrajectoryEditStore } from '../stores/trajectory-edit-store';
import { useEditorStore } from '../stores/editor-store';

type Story = ScenarioDocument['storyboard']['stories'][number];
type ManeuverGroup = Story['acts'][number]['maneuverGroups'][number];

/** A lane-change action paired with the parameter-resolved acting entity name. */
interface LaneChangeHit {
  entityName: string;
  action: LaneChangeAction;
}

function asLaneChange(action: unknown): LaneChangeAction | null {
  const a = action as PrivateAction;
  return a && (a as LaneChangeAction).type === 'laneChangeAction' ? (a as LaneChangeAction) : null;
}

function asSpeedAction(action: unknown): SpeedAction | null {
  const a = action as PrivateAction;
  return a && (a as SpeedAction).type === 'speedAction' ? (a as SpeedAction) : null;
}

/**
 * Resolve a possibly-parameterized entity reference (`$owner`, `${owner}`) to a
 * concrete name using the supplied parameter map. Non-parameter references pass
 * through unchanged.
 */
function resolveRef(ref: string, params: Map<string, string>): string {
  if (!ref.startsWith('$')) return ref;
  const name = ref.startsWith('${') && ref.endsWith('}') ? ref.slice(2, -1) : ref.slice(1);
  return params.get(name) ?? ref;
}

/** Build a parameter map from declaration lists (later lists win). */
function buildParamMap(...decls: Array<ParameterDeclaration[] | undefined>): Map<string, string> {
  const map = new Map<string, string>();
  for (const list of decls) {
    if (!list) continue;
    for (const d of list) map.set(d.name, d.value);
  }
  return map;
}

/** Resolve the initial (Init) absolute speed for an entity, if declared. */
function resolveInitSpeed(doc: ScenarioDocument, entityName: string): number | null {
  const init = doc.storyboard.init.entityActions.find((e) => e.entityRef === entityName);
  if (!init) return null;
  for (const pa of init.privateActions) {
    const speed = asSpeedAction(pa.action);
    if (speed && speed.target.kind === 'absolute') {
      return speed.target.value;
    }
  }
  return null;
}

/** Collect lane changes from a maneuver group (for all its resolved actors). */
function collectFromManeuverGroup(group: ManeuverGroup, params: Map<string, string>): LaneChangeHit[] {
  const hits: LaneChangeHit[] = [];
  const actors = group.actors.entityRefs.map((r) => resolveRef(r, params));
  for (const maneuver of group.maneuvers) {
    for (const event of maneuver.events) {
      for (const action of event.actions) {
        const lc = asLaneChange(action.action);
        if (lc) {
          for (const entityName of actors) hits.push({ entityName, action: lc });
        }
      }
    }
  }
  return hits;
}

/** Find lane changes for a specific entity (Init + storyboard). */
function findForEntity(doc: ScenarioDocument, entityName: string): LaneChangeHit[] {
  const hits: LaneChangeHit[] = [];

  // Init private actions.
  const init = doc.storyboard.init.entityActions.find((e) => e.entityRef === entityName);
  if (init) {
    for (const pa of init.privateActions) {
      const lc = asLaneChange(pa.action);
      if (lc) hits.push({ entityName, action: lc });
    }
  }

  // Storyboard: maneuver groups whose resolved actors include the entity.
  for (const story of doc.storyboard.stories) {
    const params = buildParamMap(doc.parameterDeclarations, story.parameterDeclarations);
    for (const act of story.acts) {
      for (const group of act.maneuverGroups) {
        const actors = group.actors.entityRefs.map((r) => resolveRef(r, params));
        if (!actors.includes(entityName)) continue;
        for (const maneuver of group.maneuvers) {
          for (const event of maneuver.events) {
            for (const action of event.actions) {
              const lc = asLaneChange(action.action);
              if (lc) hits.push({ entityName, action: lc });
            }
          }
        }
      }
    }
  }

  return hits;
}

/** Find lane changes reachable from an element id (group/maneuver/event/action). */
function findForElement(doc: ScenarioDocument, elementId: string): LaneChangeHit[] {
  for (const story of doc.storyboard.stories) {
    const params = buildParamMap(doc.parameterDeclarations, story.parameterDeclarations);
    for (const act of story.acts) {
      for (const group of act.maneuverGroups) {
        const actors = group.actors.entityRefs.map((r) => resolveRef(r, params));
        const forActions = (lc: LaneChangeAction) =>
          actors.map((entityName) => ({ entityName, action: lc }));

        if (group.id === elementId) {
          return collectFromManeuverGroup(group, params);
        }
        for (const maneuver of group.maneuvers) {
          if (maneuver.id === elementId) {
            return maneuver.events.flatMap((event) =>
              event.actions.flatMap((action) => {
                const lc = asLaneChange(action.action);
                return lc ? forActions(lc) : [];
              }),
            );
          }
          for (const event of maneuver.events) {
            if (event.id === elementId) {
              return event.actions.flatMap((action) => {
                const lc = asLaneChange(action.action);
                return lc ? forActions(lc) : [];
              });
            }
            for (const action of event.actions) {
              if (action.id === elementId) {
                const lc = asLaneChange(action.action);
                return lc ? forActions(lc) : [];
              }
            }
          }
        }
      }
    }
  }
  return [];
}

/**
 * Resolve a relative-target entityRef on a lane-change action against the
 * scenario parameters so `computeLaneChangePath` can look the reference up in
 * the (real-name-keyed) entity positions map.
 */
function resolveActionTargetRefs(
  action: LaneChangeAction,
  params: Map<string, string>,
): LaneChangeAction {
  if (action.target.kind !== 'relative') return action;
  const resolved = resolveRef(action.target.entityRef, params);
  if (resolved === action.target.entityRef) return action;
  return { ...action, target: { ...action.target, entityRef: resolved } };
}

/**
 * Hook: computes lane-change preview data for the selected element.
 */
export function useLaneChangePreview(
  scenarioStoreApi: ReturnType<typeof import('../stores/use-scenario-store').useScenarioStoreApi>,
  odrDoc: OpenDriveDocument | null,
  entityPositions: Map<string, WorldCoords>,
): LaneChangePreviewData[] {
  const routeEditActive = useRouteEditStore((s) => s.active);
  const trajectoryEditActive = useTrajectoryEditStore((s) => s.active);

  const doc = useStore(scenarioStoreApi, (s) => s.document);
  const entities = doc.entities;

  const selectedElementIds = useEditorStore(useShallow((s) => s.selection.selectedElementIds));
  const selectedId = selectedElementIds.length === 1 ? selectedElementIds[0] : null;

  const hits = useMemo(() => {
    if (!selectedId || routeEditActive || trajectoryEditActive) return [];

    const entity = entities.find((e) => e.id === selectedId);
    if (entity) {
      return findForEntity(doc, entity.name);
    }
    return findForElement(doc, selectedId);
  }, [selectedId, routeEditActive, trajectoryEditActive, entities, doc]);

  const [previews, setPreviews] = useState<LaneChangePreviewData[]>([]);

  useEffect(() => {
    if (!odrDoc || hits.length === 0) {
      setPreviews([]);
      return;
    }

    // Global params suffice for resolving relative target refs (targets rarely
    // use story-scoped params; global covers the common case).
    const globalParams = buildParamMap(doc.parameterDeclarations);

    const results: LaneChangePreviewData[] = [];
    for (const { entityName, action } of hits) {
      const pose = entityPositions.get(entityName);
      if (!pose) continue;
      const speed = resolveInitSpeed(doc, entityName) ?? NOMINAL_SPEED_MPS;
      const resolvedAction = resolveActionTargetRefs(action, globalParams);
      const path = computeLaneChangePath(resolvedAction, pose, odrDoc, entityPositions, speed);
      if (path) results.push({ points: path.points });
    }

    setPreviews(results);
  }, [hits, odrDoc, entityPositions, doc]);

  return previews;
}

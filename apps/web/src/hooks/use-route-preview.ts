/**
 * Hook that computes route preview data for the currently selected element.
 *
 * When an Entity, ManeuverGroup, Maneuver, Event, or Action is selected,
 * this hook finds any associated AssignRoute routing actions and resolves
 * their waypoints to world coordinates + path segments for 3D visualization.
 *
 * The preview is read-only (no editing) and is hidden when route-edit mode is active.
 */

import { useMemo, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import type {
  OpenDriveDocument,
  ScenarioDocument,
  RoutingAction,
  Route,
} from '@osce/shared';
import {
  resolveRouteWaypoints,
  computeRoadFollowingSegmentsAsync,
} from '../lib/route-path-computation';
import type { Point3 } from '../lib/route-path-computation';
import { useRouteEditStore } from '../stores/route-edit-store';
import { useEditorStore } from '../stores/editor-store';
import type { RoadManagerClient } from '../lib/wasm/road-manager-client';

export interface RoutePreviewData {
  waypoints: Array<{ x: number; y: number; z: number; h: number }>;
  pathSegments: Array<Point3[]>;
}

/**
 * Find all inline routes associated with a given entity name in the storyboard.
 */
function findRoutesForEntity(doc: ScenarioDocument, entityName: string): Route[] {
  const routes: Route[] = [];
  for (const story of doc.storyboard.stories) {
    for (const act of story.acts) {
      for (const group of act.maneuverGroups) {
        if (!group.actors.entityRefs.includes(entityName)) continue;
        for (const maneuver of group.maneuvers) {
          for (const event of maneuver.events) {
            for (const action of event.actions) {
              const route = extractRouteFromAction(action.action);
              if (route) routes.push(route);
            }
          }
        }
      }
    }
  }
  return routes;
}

/**
 * Find all inline routes reachable from a given element by ID.
 * Works for ManeuverGroup, Maneuver, Event, or Action selection.
 */
function findRoutesForElement(doc: ScenarioDocument, elementId: string): Route[] {
  for (const story of doc.storyboard.stories) {
    for (const act of story.acts) {
      for (const group of act.maneuverGroups) {
        if (group.id === elementId) {
          return collectRoutesFromManeuverGroup(group);
        }
        for (const maneuver of group.maneuvers) {
          if (maneuver.id === elementId) {
            return collectRoutesFromManeuver(maneuver);
          }
          for (const event of maneuver.events) {
            if (event.id === elementId) {
              return collectRoutesFromEvent(event);
            }
            for (const action of event.actions) {
              if (action.id === elementId) {
                const route = extractRouteFromAction(action.action);
                return route ? [route] : [];
              }
            }
          }
        }
      }
    }
  }
  return [];
}

function collectRoutesFromManeuverGroup(
  group: ScenarioDocument['storyboard']['stories'][0]['acts'][0]['maneuverGroups'][0],
): Route[] {
  const routes: Route[] = [];
  for (const maneuver of group.maneuvers) {
    routes.push(...collectRoutesFromManeuver(maneuver));
  }
  return routes;
}

function collectRoutesFromManeuver(
  maneuver: ScenarioDocument['storyboard']['stories'][0]['acts'][0]['maneuverGroups'][0]['maneuvers'][0],
): Route[] {
  const routes: Route[] = [];
  for (const event of maneuver.events) {
    routes.push(...collectRoutesFromEvent(event));
  }
  return routes;
}

function collectRoutesFromEvent(
  event: ScenarioDocument['storyboard']['stories'][0]['acts'][0]['maneuverGroups'][0]['maneuvers'][0]['events'][0],
): Route[] {
  const routes: Route[] = [];
  for (const action of event.actions) {
    const route = extractRouteFromAction(action.action);
    if (route) routes.push(route);
  }
  return routes;
}

function extractRouteFromAction(action: unknown): Route | null {
  const a = action as RoutingAction;
  if (a?.type !== 'routingAction' || a.routeAction !== 'assignRoute' || !a.route) return null;
  return {
    id: '',
    name: a.route.name,
    closed: a.route.closed,
    waypoints: a.route.waypoints.map((wp) => ({
      position: wp.position,
      routeStrategy: wp.routeStrategy as Route['waypoints'][0]['routeStrategy'],
    })),
  };
}

/**
 * Hook: computes route preview data for the selected element.
 * Uses the same road-following path computation as the route editor.
 */
export function useRoutePreview(
  scenarioStoreApi: ReturnType<typeof import('../stores/use-scenario-store').useScenarioStoreApi>,
  odrDoc: OpenDriveDocument | null,
  rmClient: RoadManagerClient | null = null,
): RoutePreviewData[] {
  const routeEditActive = useRouteEditStore((s) => s.active);

  const doc = useStore(scenarioStoreApi, (s) => s.document);
  const entities = doc.entities;

  const selectedElementIds = useEditorStore((s) => s.selection.selectedElementIds);
  const selectedId = selectedElementIds.length === 1 ? selectedElementIds[0] : null;

  // Find routes associated with the selection
  const routes = useMemo(() => {
    if (!selectedId || routeEditActive) return [];

    // Check if selection is an entity
    const entity = entities.find((e) => e.id === selectedId);
    if (entity) {
      return findRoutesForEntity(doc, entity.name);
    }

    // Otherwise, search by element ID in the storyboard tree
    return findRoutesForElement(doc, selectedId);
  }, [selectedId, routeEditActive, entities, doc]);

  // Compute world positions and path segments for each route (async for WASM)
  const [previews, setPreviews] = useState<RoutePreviewData[]>([]);

  useEffect(() => {
    if (!odrDoc || routes.length === 0) {
      setPreviews([]);
      return;
    }

    let cancelled = false;

    async function compute() {
      const results: RoutePreviewData[] = [];

      for (const route of routes) {
        if (route.waypoints.length === 0) continue;

        const waypoints = resolveRouteWaypoints(route, odrDoc!);

        const pathSegments =
          waypoints.length >= 2
            ? await computeRoadFollowingSegmentsAsync(route, waypoints, odrDoc!, rmClient)
            : [];

        results.push({ waypoints, pathSegments });
      }

      if (!cancelled) {
        setPreviews(results);
      }
    }

    compute();

    return () => {
      cancelled = true;
    };
  }, [routes, odrDoc, rmClient]);

  return previews;
}

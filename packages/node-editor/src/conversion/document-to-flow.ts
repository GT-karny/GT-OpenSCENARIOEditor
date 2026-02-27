/**
 * Converts a ScenarioDocument into React Flow nodes and edges.
 * Walks the document tree depth-first, creating nodes for each element
 * and edges for parent-child relationships.
 */

import type { Node, Edge } from '@xyflow/react';
import type { ScenarioDocument } from '@osce/shared';
import type { OsceNodeData } from '../types/node-types.js';
import {
  createStoryboardNode,
  createInitNode,
  createEntityNode,
  createStoryNode,
  createActNode,
  createManeuverGroupNode,
  createManeuverNode,
  createEventNode,
  createActionNode,
  createTriggerNode,
  createConditionNode,
} from './node-factory.js';
import { createHierarchyEdge, createTriggerEdge, resetEdgeCounter } from './edge-factory.js';

export interface ConversionOptions {
  collapsedNodes: Record<string, boolean>;
  savedPositions: Record<string, { x: number; y: number }>;
  selectedIds: string[];
}

export interface ConversionResult {
  nodes: Node<OsceNodeData>[];
  edges: Edge[];
}

const DEFAULT_POS = { x: 0, y: 0 };

function posFor(id: string, saved: Record<string, { x: number; y: number }>): { x: number; y: number } {
  return saved[id] ?? DEFAULT_POS;
}

export function documentToFlow(
  doc: ScenarioDocument,
  options: ConversionOptions,
): ConversionResult {
  const nodes: Node<OsceNodeData>[] = [];
  const edges: Edge[] = [];
  const { collapsedNodes, savedPositions } = options;

  resetEdgeCounter();

  const sb = doc.storyboard;

  // --- Storyboard root ---
  nodes.push(createStoryboardNode(sb, posFor(sb.id, savedPositions)));

  // --- Init ---
  const init = sb.init;
  nodes.push(createInitNode(init, posFor(init.id, savedPositions)));
  edges.push(createHierarchyEdge(sb.id, init.id));

  // --- Entities (separate cluster) ---
  for (const entity of doc.entities) {
    nodes.push(createEntityNode(entity, posFor(entity.id, savedPositions)));
  }

  // --- Stop Trigger ---
  if (sb.stopTrigger.conditionGroups.length > 0) {
    nodes.push(createTriggerNode(sb.stopTrigger, 'stop', posFor(sb.stopTrigger.id, savedPositions)));
    edges.push(createHierarchyEdge(sb.id, sb.stopTrigger.id));
    addConditionNodes(sb.stopTrigger.id, sb.stopTrigger, nodes, edges, savedPositions);
  }

  // --- Stories ---
  for (const story of sb.stories) {
    const storyCollapsed = collapsedNodes[story.id] ?? false;
    nodes.push(createStoryNode(story, posFor(story.id, savedPositions), storyCollapsed));
    edges.push(createHierarchyEdge(sb.id, story.id));

    if (storyCollapsed) continue;

    // --- Acts ---
    for (const act of story.acts) {
      const actCollapsed = collapsedNodes[act.id] ?? false;
      nodes.push(createActNode(act, posFor(act.id, savedPositions), actCollapsed));
      edges.push(createHierarchyEdge(story.id, act.id));

      // Act start trigger
      if (act.startTrigger.conditionGroups.length > 0) {
        nodes.push(createTriggerNode(act.startTrigger, 'start', posFor(act.startTrigger.id, savedPositions)));
        edges.push(createTriggerEdge(act.startTrigger.id, act.id, 'start'));
        addConditionNodes(act.startTrigger.id, act.startTrigger, nodes, edges, savedPositions);
      }

      // Act stop trigger
      if (act.stopTrigger && act.stopTrigger.conditionGroups.length > 0) {
        nodes.push(createTriggerNode(act.stopTrigger, 'stop', posFor(act.stopTrigger.id, savedPositions)));
        edges.push(createTriggerEdge(act.stopTrigger.id, act.id, 'stop'));
        addConditionNodes(act.stopTrigger.id, act.stopTrigger, nodes, edges, savedPositions);
      }

      if (actCollapsed) continue;

      // --- ManeuverGroups ---
      for (const group of act.maneuverGroups) {
        const groupCollapsed = collapsedNodes[group.id] ?? false;
        nodes.push(createManeuverGroupNode(group, posFor(group.id, savedPositions), groupCollapsed));
        edges.push(createHierarchyEdge(act.id, group.id));

        if (groupCollapsed) continue;

        // --- Maneuvers ---
        for (const maneuver of group.maneuvers) {
          const maneuverCollapsed = collapsedNodes[maneuver.id] ?? false;
          nodes.push(createManeuverNode(maneuver, posFor(maneuver.id, savedPositions), maneuverCollapsed));
          edges.push(createHierarchyEdge(group.id, maneuver.id));

          if (maneuverCollapsed) continue;

          // --- Events ---
          for (const event of maneuver.events) {
            const eventCollapsed = collapsedNodes[event.id] ?? false;
            nodes.push(createEventNode(event, posFor(event.id, savedPositions), eventCollapsed));
            edges.push(createHierarchyEdge(maneuver.id, event.id));

            // Event start trigger
            if (event.startTrigger.conditionGroups.length > 0) {
              nodes.push(createTriggerNode(event.startTrigger, 'start', posFor(event.startTrigger.id, savedPositions)));
              edges.push(createTriggerEdge(event.startTrigger.id, event.id, 'start'));
              addConditionNodes(event.startTrigger.id, event.startTrigger, nodes, edges, savedPositions);
            }

            if (eventCollapsed) continue;

            // --- Actions ---
            for (const action of event.actions) {
              nodes.push(createActionNode(action, posFor(action.id, savedPositions)));
              edges.push(createHierarchyEdge(event.id, action.id));
            }
          }
        }
      }
    }
  }

  return { nodes, edges };
}

function addConditionNodes(
  triggerId: string,
  trigger: { conditionGroups: Array<{ id: string; conditions: Array<unknown> }> },
  nodes: Node<OsceNodeData>[],
  edges: Edge[],
  savedPositions: Record<string, { x: number; y: number }>,
): void {
  for (const group of trigger.conditionGroups) {
    for (const condition of group.conditions) {
      const cond = condition as { id: string; name: string; delay: number; conditionEdge: string; condition: unknown };
      nodes.push(createConditionNode(cond as Parameters<typeof createConditionNode>[0], posFor(cond.id, savedPositions)));
      edges.push(createHierarchyEdge(triggerId, cond.id));
    }
  }
}

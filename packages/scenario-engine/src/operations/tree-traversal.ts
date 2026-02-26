/**
 * Tree traversal operations for ScenarioDocument.
 * Uses duck-typing to discover child-bearing fields on each node.
 */

import type { ScenarioDocument } from '@osce/shared';

interface ChildFieldSpec {
  field: string;
  isArray: boolean;
}

function getChildFields(node: unknown): ChildFieldSpec[] {
  if (node === null || node === undefined || typeof node !== 'object') return [];

  const specs: ChildFieldSpec[] = [];
  const obj = node as Record<string, unknown>;

  // ScenarioDocument level
  if ('storyboard' in obj && obj.storyboard && typeof obj.storyboard === 'object') {
    specs.push({ field: 'storyboard', isArray: false });
  }
  if ('entities' in obj && Array.isArray(obj.entities)) {
    specs.push({ field: 'entities', isArray: true });
  }
  if ('parameterDeclarations' in obj && Array.isArray(obj.parameterDeclarations)) {
    specs.push({ field: 'parameterDeclarations', isArray: true });
  }
  if ('variableDeclarations' in obj && Array.isArray(obj.variableDeclarations)) {
    specs.push({ field: 'variableDeclarations', isArray: true });
  }

  // Storyboard level
  if ('init' in obj && obj.init && typeof obj.init === 'object') {
    specs.push({ field: 'init', isArray: false });
  }
  if ('stories' in obj && Array.isArray(obj.stories)) {
    specs.push({ field: 'stories', isArray: true });
  }

  // Init level
  if ('globalActions' in obj && Array.isArray(obj.globalActions)) {
    specs.push({ field: 'globalActions', isArray: true });
  }
  if ('entityActions' in obj && Array.isArray(obj.entityActions)) {
    specs.push({ field: 'entityActions', isArray: true });
  }
  if ('privateActions' in obj && Array.isArray(obj.privateActions)) {
    specs.push({ field: 'privateActions', isArray: true });
  }

  // Story level
  if ('acts' in obj && Array.isArray(obj.acts)) {
    specs.push({ field: 'acts', isArray: true });
  }

  // Act level
  if ('maneuverGroups' in obj && Array.isArray(obj.maneuverGroups)) {
    specs.push({ field: 'maneuverGroups', isArray: true });
  }

  // ManeuverGroup level
  if ('maneuvers' in obj && Array.isArray(obj.maneuvers)) {
    specs.push({ field: 'maneuvers', isArray: true });
  }

  // Maneuver level
  if ('events' in obj && Array.isArray(obj.events)) {
    specs.push({ field: 'events', isArray: true });
  }

  // Event level
  if ('actions' in obj && Array.isArray(obj.actions)) {
    specs.push({ field: 'actions', isArray: true });
  }

  // Trigger fields
  if ('startTrigger' in obj && obj.startTrigger && typeof obj.startTrigger === 'object') {
    specs.push({ field: 'startTrigger', isArray: false });
  }
  if ('stopTrigger' in obj && obj.stopTrigger && typeof obj.stopTrigger === 'object') {
    specs.push({ field: 'stopTrigger', isArray: false });
  }
  if ('conditionGroups' in obj && Array.isArray(obj.conditionGroups)) {
    specs.push({ field: 'conditionGroups', isArray: true });
  }
  if ('conditions' in obj && Array.isArray(obj.conditions)) {
    specs.push({ field: 'conditions', isArray: true });
  }

  // RoadNetwork
  if ('trafficSignals' in obj && Array.isArray(obj.trafficSignals)) {
    specs.push({ field: 'trafficSignals', isArray: true });
  }
  if ('phases' in obj && Array.isArray(obj.phases)) {
    specs.push({ field: 'phases', isArray: true });
  }

  return specs;
}

function findById(node: unknown, id: string): unknown | undefined {
  if (node === null || node === undefined || typeof node !== 'object') return undefined;

  const obj = node as Record<string, unknown>;
  if (obj.id === id) return node;

  for (const spec of getChildFields(node)) {
    const child = obj[spec.field];
    if (spec.isArray && Array.isArray(child)) {
      for (const item of child) {
        const found = findById(item, id);
        if (found) return found;
      }
    } else if (child && typeof child === 'object') {
      const found = findById(child, id);
      if (found) return found;
    }
  }

  return undefined;
}

function findParent(
  node: unknown,
  id: string,
): { parent: unknown; field: string } | undefined {
  if (node === null || node === undefined || typeof node !== 'object') return undefined;

  const obj = node as Record<string, unknown>;

  for (const spec of getChildFields(node)) {
    const child = obj[spec.field];
    if (spec.isArray && Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === 'object' && (item as Record<string, unknown>).id === id) {
          return { parent: node, field: spec.field };
        }
        const found = findParent(item, id);
        if (found) return found;
      }
    } else if (child && typeof child === 'object') {
      if ((child as Record<string, unknown>).id === id) {
        return { parent: node, field: spec.field };
      }
      const found = findParent(child, id);
      if (found) return found;
    }
  }

  return undefined;
}

export function getElementById(root: ScenarioDocument, id: string): unknown | undefined {
  return findById(root, id);
}

export function getParentOf(
  root: ScenarioDocument,
  id: string,
): { parent: unknown; field: string } | undefined {
  return findParent(root, id);
}

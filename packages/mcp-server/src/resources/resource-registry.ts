/**
 * Resource registry: collects all resource definitions and provides lookup.
 */

import type { createScenarioStore } from '@osce/scenario-engine';
import { getScenarioResources } from './scenario-resources.js';
import { getTemplateResources } from './template-resources.js';

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  read: (store: ReturnType<typeof createScenarioStore>) => string;
}

let _allResources: ResourceDefinition[] | null = null;

export function getAllResources(): ResourceDefinition[] {
  if (!_allResources) {
    _allResources = [...getScenarioResources(), ...getTemplateResources()];
  }
  return _allResources;
}

export function findResource(uri: string): ResourceDefinition | undefined {
  return getAllResources().find((r) => r.uri === uri);
}

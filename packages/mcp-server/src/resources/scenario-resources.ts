/**
 * Scenario-related MCP resources.
 */

import { XoscValidator } from '@osce/openscenario';
import type { ResourceDefinition } from './resource-registry.js';

export function getScenarioResources(): ResourceDefinition[] {
  return [
    {
      uri: 'scenario://current',
      name: 'Current Scenario',
      description: 'The full ScenarioDocument as JSON.',
      mimeType: 'application/json',
      read(store) {
        const doc = store.getState().getScenario();
        return JSON.stringify(doc, null, 2);
      },
    },
    {
      uri: 'scenario://entities',
      name: 'Entities',
      description: 'List of all entities in the current scenario.',
      mimeType: 'application/json',
      read(store) {
        const doc = store.getState().getScenario();
        return JSON.stringify(doc.entities, null, 2);
      },
    },
    {
      uri: 'scenario://storyboard',
      name: 'Storyboard',
      description: 'The storyboard structure (init, stories, stop trigger).',
      mimeType: 'application/json',
      read(store) {
        const doc = store.getState().getScenario();
        return JSON.stringify(doc.storyboard, null, 2);
      },
    },
    {
      uri: 'scenario://validation',
      name: 'Validation Results',
      description: 'Latest validation results for the current scenario.',
      mimeType: 'application/json',
      read(store) {
        const doc = store.getState().getScenario();
        const validator = new XoscValidator();
        const result = validator.validate(doc);
        return JSON.stringify(result, null, 2);
      },
    },
  ];
}

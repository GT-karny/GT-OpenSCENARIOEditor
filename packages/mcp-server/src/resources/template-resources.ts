/**
 * Template-related MCP resources.
 */

import { useCaseComponents } from '@osce/templates';
import type { ResourceDefinition } from './resource-registry.js';

export function getTemplateResources(): ResourceDefinition[] {
  return [
    {
      uri: 'templates://list',
      name: 'Available Templates',
      description: 'List of available use-case templates with parameters.',
      mimeType: 'application/json',
      read() {
        const templates = useCaseComponents.map((uc) => ({
          id: uc.id,
          name: uc.name,
          description: uc.description,
          category: uc.category,
          parameters: uc.parameters.map((p) => ({
            name: p.name,
            type: p.type,
            default: p.default,
            description: p.description,
            unit: p.unit,
          })),
        }));
        return JSON.stringify(templates, null, 2);
      },
    },
  ];
}

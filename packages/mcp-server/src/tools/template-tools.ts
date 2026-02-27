/**
 * Template tools: list and apply use-case templates.
 */

import type { McpToolResult } from '@osce/shared';
import { useCaseComponents, getUseCaseById } from '@osce/templates';
import { applyUseCaseComponent } from '@osce/scenario-engine';
import { successResult, errorResult } from '../utils/response-helpers.js';
import type { ToolDefinition } from './tool-registry.js';

export const templateTools: ToolDefinition[] = [
  {
    name: 'list_templates',
    description:
      'List all available scenario templates (use-case components). ' +
      'Each template generates a complete scenario pattern with entities, init actions, and storyboard elements.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    handler(_args, _store): McpToolResult {
      try {
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
            min: p.min,
            max: p.max,
            enumValues: p.enumValues,
          })),
        }));
        return successResult({ templates, count: templates.length });
      } catch (e) {
        return errorResult(`Failed to list templates: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'apply_template',
    description:
      'Apply a use-case template to the current scenario. ' +
      'Templates generate entities, initial actions, and storyboard elements. ' +
      'Use list_templates to see available templates and their parameters.',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: {
          type: 'string',
          description: 'ID of the template to apply (e.g. "cutIn", "overtaking", "pedestrianCrossing").',
        },
        parameters: {
          type: 'object',
          description: 'Template parameters. Use list_templates to see available parameters and defaults.',
        },
      },
      required: ['templateId'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const templateId = args['templateId'] as string;
        if (!templateId) return errorResult('"templateId" is required. Use list_templates to see available templates.');

        const component = getUseCaseById(templateId);
        if (!component) {
          const available = useCaseComponents.map((uc) => uc.id).join(', ');
          return errorResult(
            `Template "${templateId}" not found. Available templates: ${available}`,
          );
        }

        const params = (args['parameters'] as Record<string, unknown>) ?? {};

        // Fill in defaults for missing parameters
        const fullParams: Record<string, unknown> = {};
        for (const p of component.parameters) {
          fullParams[p.name] = params[p.name] ?? p.default;
        }

        const s = store.getState();
        const context = {
          existingEntities: s.getScenario().entities,
        };

        const result = applyUseCaseComponent(s, component, fullParams, context);

        return successResult({
          templateId,
          entitiesAdded: result.entities.length,
          initActionsAdded: result.initActions.reduce((sum, g) => sum + g.actions.length, 0),
          storiesAdded: result.stories.length,
          paramMapping: result.paramMapping,
          message: `Template "${component.name}" applied successfully.`,
        });
      } catch (e) {
        return errorResult(`Failed to apply template: ${(e as Error).message}`);
      }
    },
  },
];

/**
 * Scenario management tools: create, get state, export, import, validate.
 */

import type { McpToolResult, McpScenarioState } from '@osce/shared';
import { XoscParser, XoscSerializer, XoscValidator } from '@osce/openscenario';
import { successResult, errorResult } from '../utils/response-helpers.js';
import type { ToolDefinition } from './tool-registry.js';

export const scenarioTools: ToolDefinition[] = [
  {
    name: 'create_scenario',
    description:
      'Create a new empty OpenSCENARIO scenario. Optionally specify a template name. ' +
      'This resets the entire scenario state and clears undo history.',
    inputSchema: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          description: 'Template name (optional). Omit for an empty scenario.',
        },
      },
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const s = store.getState();
        const doc = s.createScenario(args['template'] as string | undefined);
        return successResult({
          documentId: doc.id,
          description: doc.fileHeader.description,
          entityCount: doc.entities.length,
          storyCount: doc.storyboard.stories.length,
        });
      } catch (e) {
        return errorResult(`Failed to create scenario: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'get_scenario_state',
    description:
      'Get the current scenario state including a summary and the full ScenarioDocument. ' +
      'Use this to understand what entities, stories, and actions exist.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    handler(_args, store): McpToolResult {
      try {
        const s = store.getState();
        const doc = s.getScenario();
        const validator = new XoscValidator();
        const validation = validator.validate(doc);
        const state: McpScenarioState = {
          documentId: doc.id,
          entityCount: doc.entities.length,
          storyCount: doc.storyboard.stories.length,
          hasRoadNetwork: !!doc.roadNetwork.logicFile,
          validationErrors: validation.errors.length,
          validationWarnings: validation.warnings.length,
        };
        return successResult({ state, document: doc });
      } catch (e) {
        return errorResult(`Failed to get scenario state: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'export_xosc',
    description:
      'Export the current scenario as an OpenSCENARIO XML (.xosc) string. ' +
      'Set formatted=true for pretty-printed XML.',
    inputSchema: {
      type: 'object',
      properties: {
        formatted: {
          type: 'boolean',
          description: 'Pretty-print the XML output (default: true).',
        },
      },
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const s = store.getState();
        const doc = s.getScenario();
        const serializer = new XoscSerializer();
        const formatted = args['formatted'] !== false;
        const xml = formatted ? serializer.serializeFormatted(doc) : serializer.serialize(doc);
        return successResult(xml);
      } catch (e) {
        return errorResult(`Failed to export XOSC: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'import_xosc',
    description:
      'Import an OpenSCENARIO XML string into the editor. ' +
      'This replaces the current scenario. The XML is parsed and validated.',
    inputSchema: {
      type: 'object',
      properties: {
        xml: {
          type: 'string',
          description: 'The OpenSCENARIO XML content to import.',
        },
      },
      required: ['xml'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const xml = args['xml'] as string;
        if (!xml || typeof xml !== 'string') {
          return errorResult('The "xml" parameter is required and must be a string.');
        }
        const parser = new XoscParser();
        const parsed = parser.parse(xml);

        // Reset the store and rebuild from parsed document
        const s = store.getState();
        s.createScenario();

        // Add entities
        for (const entity of parsed.entities) {
          s.addEntity(entity);
        }

        // Add init actions
        for (const entityInit of parsed.storyboard.init.entityActions) {
          for (const initAction of entityInit.privateActions) {
            store.getState().addInitAction(entityInit.entityRef, initAction.action);
          }
        }

        // Add stories (with full hierarchy)
        for (const story of parsed.storyboard.stories) {
          store.getState().addStory(story);
        }

        const doc = store.getState().getScenario();
        return successResult({
          documentId: doc.id,
          entityCount: doc.entities.length,
          storyCount: doc.storyboard.stories.length,
          message: 'XOSC imported successfully.',
        });
      } catch (e) {
        return errorResult(`Failed to import XOSC: ${(e as Error).message}. Check that the XML is valid OpenSCENARIO v1.2.`);
      }
    },
  },

  {
    name: 'validate_scenario',
    description:
      'Validate the current scenario against OpenSCENARIO rules. ' +
      'Returns errors and warnings with their paths and messages.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    handler(_args, store): McpToolResult {
      try {
        const s = store.getState();
        const doc = s.getScenario();
        const validator = new XoscValidator();
        const result = validator.validate(doc);
        return successResult(result);
      } catch (e) {
        return errorResult(`Failed to validate scenario: ${(e as Error).message}`);
      }
    },
  },
];

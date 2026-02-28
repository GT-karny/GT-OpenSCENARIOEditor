/**
 * Init action tools: set initial position and speed for entities.
 */

import type { McpToolResult } from '@osce/shared';
import { successResult, errorResult } from '../utils/response-helpers.js';
import { buildPositionFromInput } from '../utils/entity-builder.js';
import type { ToolDefinition } from './tool-registry.js';

export const initTools: ToolDefinition[] = [
  {
    name: 'set_init_position',
    description:
      'Set the initial position of an entity. Supports multiple input formats:\n' +
      '- World position shorthand: { entityName, x, y, z?, h? }\n' +
      '- Lane position shorthand: { entityName, roadId, laneId, s, offset? }\n' +
      '- Full position object: { entityName, position: { type: "worldPosition", x, y, ... } }\n' +
      'The entity must already exist. Use add_entity first, then set_init_position.',
    inputSchema: {
      type: 'object',
      properties: {
        entityName: {
          type: 'string',
          description: 'Name of the entity to position.',
        },
        position: {
          type: 'object',
          description: 'Full Position object (with "type" field). Alternative to shorthand.',
        },
        x: { type: 'number', description: 'World X coordinate (shorthand for worldPosition).' },
        y: { type: 'number', description: 'World Y coordinate (shorthand for worldPosition).' },
        z: { type: 'number', description: 'World Z coordinate (optional).' },
        h: { type: 'number', description: 'Heading in radians (optional).' },
        roadId: { type: 'string', description: 'Road ID (shorthand for lanePosition).' },
        laneId: { type: 'string', description: 'Lane ID (shorthand for lanePosition).' },
        s: { type: 'number', description: 'S coordinate along the road (shorthand for lanePosition).' },
        offset: { type: 'number', description: 'Lateral offset from lane center (optional).' },
      },
      required: ['entityName'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const entityName = args['entityName'] as string;
        if (!entityName) return errorResult('"entityName" is required.');

        // Verify entity exists
        const doc = store.getState().getScenario();
        const entity = doc.entities.find((e) => e.name === entityName);
        if (!entity) {
          return errorResult(
            `Entity "${entityName}" not found. Use list_entities to see available entities, or add_entity to create one.`,
          );
        }

        const position = buildPositionFromInput(args);
        store.getState().setInitPosition(entityName, position);
        return successResult({
          entityName,
          position,
          message: `Initial position set for "${entityName}".`,
        });
      } catch (e) {
        return errorResult(`Failed to set init position: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'set_init_speed',
    description:
      'Set the initial speed of an entity in m/s. ' +
      'The entity must already exist. Use add_entity first.',
    inputSchema: {
      type: 'object',
      properties: {
        entityName: {
          type: 'string',
          description: 'Name of the entity.',
        },
        speed: {
          type: 'number',
          description: 'Initial speed in m/s (e.g. 13.89 for ~50 km/h).',
        },
      },
      required: ['entityName', 'speed'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const entityName = args['entityName'] as string;
        const speed = args['speed'] as number;
        if (!entityName) return errorResult('"entityName" is required.');
        if (speed === undefined || typeof speed !== 'number') {
          return errorResult('"speed" is required and must be a number (m/s).');
        }

        const doc = store.getState().getScenario();
        const entity = doc.entities.find((e) => e.name === entityName);
        if (!entity) {
          return errorResult(
            `Entity "${entityName}" not found. Use list_entities to see available entities, or add_entity to create one.`,
          );
        }

        store.getState().setInitSpeed(entityName, speed);
        return successResult({
          entityName,
          speed,
          message: `Initial speed set for "${entityName}" to ${speed} m/s.`,
        });
      } catch (e) {
        return errorResult(`Failed to set init speed: ${(e as Error).message}`);
      }
    },
  },
];

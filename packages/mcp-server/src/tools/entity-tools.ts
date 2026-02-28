/**
 * Entity management tools: add, remove, list, update entities.
 */

import type { McpToolResult } from '@osce/shared';
import { successResult, errorResult } from '../utils/response-helpers.js';
import { buildEntityFromInput } from '../utils/entity-builder.js';
import type { ToolDefinition } from './tool-registry.js';

export const entityTools: ToolDefinition[] = [
  {
    name: 'add_entity',
    description:
      'Add a new entity (vehicle, pedestrian, or miscObject) to the scenario. ' +
      'A default definition with sensible dimensions is generated based on the type and category. ' +
      'After adding, use set_init_position to place the entity.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Entity name (e.g. "Ego", "TargetVehicle", "Pedestrian1").',
        },
        type: {
          type: 'string',
          enum: ['vehicle', 'pedestrian', 'miscObject'],
          description: 'Entity type.',
        },
        vehicleCategory: {
          type: 'string',
          enum: ['car', 'truck', 'bus', 'motorbike', 'bicycle', 'van', 'semitrailer', 'trailer', 'train', 'tram'],
          description: 'Vehicle category (only for type="vehicle"). Default: "car".',
        },
        pedestrianCategory: {
          type: 'string',
          enum: ['pedestrian', 'animal', 'wheelchair'],
          description: 'Pedestrian category (only for type="pedestrian"). Default: "pedestrian".',
        },
        miscObjectCategory: {
          type: 'string',
          enum: [
            'barrier', 'building', 'crosswalk', 'gantry', 'none', 'obstacle',
            'parkingSpace', 'patch', 'pole', 'railing', 'roadMark', 'soundBarrier',
            'streetLamp', 'trafficIsland', 'tree', 'vegetation',
          ],
          description: 'MiscObject category (only for type="miscObject"). Default: "obstacle".',
        },
      },
      required: ['name', 'type'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const name = args['name'] as string;
        const type = args['type'] as string;
        if (!name) return errorResult('"name" is required.');
        if (!type) return errorResult('"type" is required. Use "vehicle", "pedestrian", or "miscObject".');

        const partial = buildEntityFromInput({
          name,
          type: type as 'vehicle' | 'pedestrian' | 'miscObject',
          vehicleCategory: args['vehicleCategory'] as string | undefined,
          pedestrianCategory: args['pedestrianCategory'] as string | undefined,
          miscObjectCategory: args['miscObjectCategory'] as string | undefined,
        });

        const s = store.getState();
        const entity = s.addEntity(partial);
        return successResult({
          entityId: entity.id,
          name: entity.name,
          type: entity.type,
          message: `Entity "${entity.name}" added. Use set_init_position to set its starting position.`,
        });
      } catch (e) {
        return errorResult(`Failed to add entity: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'remove_entity',
    description:
      'Remove an entity from the scenario by its ID or name. ' +
      'Use list_entities to see available entities.',
    inputSchema: {
      type: 'object',
      properties: {
        entityId: {
          type: 'string',
          description: 'The unique ID of the entity to remove.',
        },
        entityName: {
          type: 'string',
          description: 'The name of the entity to remove (alternative to entityId).',
        },
      },
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const s = store.getState();
        const doc = s.getScenario();
        let entityId = args['entityId'] as string | undefined;

        if (!entityId && args['entityName']) {
          const found = doc.entities.find((e) => e.name === args['entityName']);
          if (!found) {
            return errorResult(
              `Entity with name "${args['entityName']}" not found. Use list_entities to see available entities.`,
            );
          }
          entityId = found.id;
        }

        if (!entityId) {
          return errorResult('Provide either "entityId" or "entityName".');
        }

        s.removeEntity(entityId);
        return successResult({ removed: entityId, message: 'Entity removed successfully.' });
      } catch (e) {
        return errorResult(`Failed to remove entity: ${(e as Error).message}. Use list_entities to see available entities.`);
      }
    },
  },

  {
    name: 'list_entities',
    description: 'List all entities in the current scenario with their IDs, names, and types.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    handler(_args, store): McpToolResult {
      try {
        const s = store.getState();
        const doc = s.getScenario();
        const entities = doc.entities.map((e) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          definition: e.definition.kind,
        }));
        return successResult({ entities, count: entities.length });
      } catch (e) {
        return errorResult(`Failed to list entities: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'update_entity',
    description:
      'Update properties of an existing entity. ' +
      'Use list_entities to find entity IDs.',
    inputSchema: {
      type: 'object',
      properties: {
        entityId: {
          type: 'string',
          description: 'The unique ID of the entity to update.',
        },
        updates: {
          type: 'object',
          description: 'Partial entity properties to update (e.g. { name: "NewName" }).',
        },
      },
      required: ['entityId', 'updates'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const entityId = args['entityId'] as string;
        const updates = args['updates'] as Record<string, unknown>;
        if (!entityId) return errorResult('"entityId" is required. Use list_entities to find entity IDs.');

        const s = store.getState();
        s.updateEntity(entityId, updates);
        const updated = store.getState().getEntity(entityId);
        return successResult({
          entity: updated,
          message: 'Entity updated successfully.',
        });
      } catch (e) {
        return errorResult(`Failed to update entity: ${(e as Error).message}. Use list_entities to see available entities.`);
      }
    },
  },
];

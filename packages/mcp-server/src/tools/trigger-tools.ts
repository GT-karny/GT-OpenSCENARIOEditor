/**
 * Trigger tools: set start trigger, add simulation time trigger, add distance trigger.
 */

import type {
  McpToolResult,
  Trigger,
  Condition,
  Position,
  ByEntityCondition,
  ByValueCondition,
  Rule,
  StoryboardElementState,
  StoryboardElementType,
} from '@osce/shared';
import { successResult, errorResult } from '../utils/response-helpers.js';
import { buildPositionFromInput } from '../utils/entity-builder.js';
import type { ToolDefinition } from './tool-registry.js';

interface ConditionSpec {
  type: string;
  [key: string]: unknown;
}

function generateId(): string {
  return crypto.randomUUID();
}

function buildConditionFromSpec(spec: ConditionSpec): Condition {
  const base = {
    id: generateId(),
    name: `${spec.type}Condition`,
    delay: 0,
    conditionEdge: 'rising' as const,
  };

  switch (spec.type) {
    case 'simulationTime': {
      const condition: ByValueCondition = {
        kind: 'byValue',
        valueCondition: {
          type: 'simulationTime',
          value: Number(spec['time'] ?? 0),
          rule: (spec['rule'] as Rule) ?? 'greaterThan',
        },
      };
      return { ...base, name: 'SimulationTimeCondition', condition };
    }
    case 'distance': {
      const condition: ByEntityCondition = {
        kind: 'byEntity',
        triggeringEntities: {
          triggeringEntitiesRule: 'any',
          entityRefs: spec['entityRef'] ? [String(spec['entityRef'])] : [],
        },
        entityCondition: {
          type: 'distance',
          value: Number(spec['value'] ?? 0),
          freespace: false,
          rule: (spec['rule'] as Rule) ?? 'lessThan',
          position: spec['position'] as Position,
        },
      };
      return { ...base, name: 'DistanceCondition', condition };
    }
    case 'speed': {
      const condition: ByEntityCondition = {
        kind: 'byEntity',
        triggeringEntities: {
          triggeringEntitiesRule: 'any',
          entityRefs: spec['entityRef'] ? [String(spec['entityRef'])] : [],
        },
        entityCondition: {
          type: 'speed',
          value: Number(spec['value'] ?? 0),
          rule: (spec['rule'] as Rule) ?? 'greaterThan',
        },
      };
      return { ...base, name: 'SpeedCondition', condition };
    }
    case 'storyboardState': {
      const condition: ByValueCondition = {
        kind: 'byValue',
        valueCondition: {
          type: 'storyboardElementState',
          storyboardElementRef: String(spec['elementRef'] ?? ''),
          state: (spec['state'] as StoryboardElementState) ?? 'completeState',
          storyboardElementType: (spec['elementType'] as StoryboardElementType) ?? 'event',
        },
      };
      return { ...base, name: 'StoryboardElementStateCondition', condition };
    }
    default:
      throw new Error(`Unknown condition type: "${spec.type}". Supported: simulationTime, distance, speed, storyboardState.`);
  }
}

function buildTrigger(conditions: Condition[]): Trigger {
  return {
    id: generateId(),
    conditionGroups: [
      {
        id: generateId(),
        conditions,
      },
    ],
  };
}

export const triggerTools: ToolDefinition[] = [
  {
    name: 'set_start_trigger',
    description:
      'Set the start trigger of a storyboard element (Act or Event). ' +
      'Conditions within the same group are AND-combined. ' +
      'Provide an array of condition specifications.',
    inputSchema: {
      type: 'object',
      properties: {
        elementId: {
          type: 'string',
          description: 'ID of the element (Act or Event) to set the start trigger on.',
        },
        conditions: {
          type: 'array',
          description: 'Array of condition specifications.',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['simulationTime', 'distance', 'speed', 'storyboardState'],
                description: 'Condition type.',
              },
            },
            required: ['type'],
          },
        },
      },
      required: ['elementId', 'conditions'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const elementId = args['elementId'] as string;
        const condSpecs = args['conditions'] as ConditionSpec[];
        if (!elementId) return errorResult('"elementId" is required.');
        if (!condSpecs || !Array.isArray(condSpecs) || condSpecs.length === 0) {
          return errorResult('"conditions" is required and must be a non-empty array.');
        }

        const conditions = condSpecs.map(buildConditionFromSpec);
        const trigger = buildTrigger(conditions);

        store.getState().setStartTrigger(elementId, trigger);
        return successResult({
          elementId,
          trigger,
          message: `Start trigger set with ${conditions.length} condition(s).`,
        });
      } catch (e) {
        return errorResult(`Failed to set start trigger: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'add_simulation_time_trigger',
    description:
      'Set a simulation time trigger on an element (Act or Event). ' +
      'The element will start when the simulation time passes the specified value. ' +
      'This is the most common trigger type.',
    inputSchema: {
      type: 'object',
      properties: {
        elementId: {
          type: 'string',
          description: 'ID of the element (Act or Event).',
        },
        time: {
          type: 'number',
          description: 'Simulation time in seconds.',
        },
        rule: {
          type: 'string',
          enum: ['greaterThan', 'equalTo', 'lessThan', 'greaterOrEqual', 'lessOrEqual'],
          description: 'Comparison rule (default: "greaterThan").',
        },
      },
      required: ['elementId', 'time'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const elementId = args['elementId'] as string;
        const time = args['time'] as number;
        if (!elementId) return errorResult('"elementId" is required.');
        if (time === undefined || typeof time !== 'number') {
          return errorResult('"time" is required and must be a number (seconds).');
        }

        const condition = buildConditionFromSpec({
          type: 'simulationTime',
          time,
          rule: args['rule'] ?? 'greaterThan',
        });

        const trigger = buildTrigger([condition]);
        store.getState().setStartTrigger(elementId, trigger);

        return successResult({
          elementId,
          time,
          rule: args['rule'] ?? 'greaterThan',
          message: `Simulation time trigger set at ${time}s.`,
        });
      } catch (e) {
        return errorResult(`Failed to add simulation time trigger: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'add_distance_trigger',
    description:
      'Set a distance-based trigger on an element (Act or Event). ' +
      'The element will start when the triggering entity reaches a certain distance from a position. ' +
      'Supports position shorthand: { x, y } or { roadId, laneId, s }.',
    inputSchema: {
      type: 'object',
      properties: {
        elementId: {
          type: 'string',
          description: 'ID of the element (Act or Event).',
        },
        entityRef: {
          type: 'string',
          description: 'Name of the triggering entity.',
        },
        value: {
          type: 'number',
          description: 'Distance value in meters.',
        },
        rule: {
          type: 'string',
          enum: ['lessThan', 'greaterThan', 'equalTo'],
          description: 'Comparison rule (default: "lessThan").',
        },
        position: {
          type: 'object',
          description: 'Full Position object (alternative to shorthand).',
        },
        x: { type: 'number', description: 'World X coordinate.' },
        y: { type: 'number', description: 'World Y coordinate.' },
        z: { type: 'number' },
        h: { type: 'number' },
        roadId: { type: 'string' },
        laneId: { type: 'string' },
        s: { type: 'number' },
        offset: { type: 'number' },
      },
      required: ['elementId', 'entityRef', 'value'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const elementId = args['elementId'] as string;
        const entityRef = args['entityRef'] as string;
        const value = args['value'] as number;
        if (!elementId) return errorResult('"elementId" is required.');
        if (!entityRef) return errorResult('"entityRef" is required.');
        if (value === undefined || typeof value !== 'number') {
          return errorResult('"value" is required and must be a number (meters).');
        }

        const position = buildPositionFromInput(args);

        const condition = buildConditionFromSpec({
          type: 'distance',
          entityRef,
          value,
          rule: args['rule'] ?? 'lessThan',
          position,
        });

        const trigger = buildTrigger([condition]);
        store.getState().setStartTrigger(elementId, trigger);

        return successResult({
          elementId,
          entityRef,
          value,
          position,
          message: `Distance trigger set (${value}m from position).`,
        });
      } catch (e) {
        return errorResult(`Failed to add distance trigger: ${(e as Error).message}`);
      }
    },
  },
];

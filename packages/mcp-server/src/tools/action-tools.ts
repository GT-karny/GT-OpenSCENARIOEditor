/**
 * Action tools: add speed, lane change, teleport, and generic actions.
 */

import type { McpToolResult, PrivateAction, LaneChangeTarget, TransitionDynamics, DynamicsShape, DynamicsDimension } from '@osce/shared';
import { successResult, errorResult } from '../utils/response-helpers.js';
import { buildPositionFromInput } from '../utils/entity-builder.js';
import type { ToolDefinition } from './tool-registry.js';

function buildTransitionDynamics(
  input?: Record<string, unknown>,
): TransitionDynamics {
  if (!input) {
    return { dynamicsShape: 'linear', dynamicsDimension: 'time', value: 2.0 };
  }
  return {
    dynamicsShape: (input['shape'] as DynamicsShape) ?? 'linear',
    dynamicsDimension: (input['dimension'] as DynamicsDimension) ?? 'time',
    value: (input['value'] as number) ?? 2.0,
  };
}

export const actionTools: ToolDefinition[] = [
  {
    name: 'add_speed_action',
    description:
      'Add a SpeedAction to an event. Changes the entity speed to the target value. ' +
      'The transitionDynamics control how the speed changes (shape, value, dimension).',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of the event to add the action to.',
        },
        targetSpeed: {
          type: 'number',
          description: 'Target speed in m/s.',
        },
        transitionDynamics: {
          type: 'object',
          description: 'Transition dynamics (optional, defaults to linear/time/2.0).',
          properties: {
            shape: {
              type: 'string',
              enum: ['linear', 'cubic', 'sinusoidal', 'step'],
              description: 'Shape of the speed transition.',
            },
            value: {
              type: 'number',
              description: 'Duration/distance/rate value for the transition.',
            },
            dimension: {
              type: 'string',
              enum: ['time', 'distance', 'rate'],
              description: 'Dimension of the transition value.',
            },
          },
        },
      },
      required: ['eventId', 'targetSpeed'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const eventId = args['eventId'] as string;
        const targetSpeed = args['targetSpeed'] as number;
        if (!eventId) return errorResult('"eventId" is required.');
        if (targetSpeed === undefined || typeof targetSpeed !== 'number') {
          return errorResult('"targetSpeed" is required and must be a number (m/s).');
        }

        const dynamics = buildTransitionDynamics(
          args['transitionDynamics'] as Record<string, unknown> | undefined,
        );

        const action: PrivateAction = {
          type: 'speedAction',
          dynamics,
          target: { kind: 'absolute', value: targetSpeed },
        };

        const s = store.getState();
        const added = s.addAction(eventId, { action });
        return successResult({
          actionId: added.id,
          action: added.action,
          message: `Speed action added (target: ${targetSpeed} m/s).`,
        });
      } catch (e) {
        return errorResult(`Failed to add speed action: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'add_lane_change_action',
    description:
      'Add a LaneChangeAction to an event. Changes the entity\'s lane. ' +
      'Set targetType="absolute" (default) for a fixed lane number, or ' +
      'targetType="relative" with entityRef for a lane offset relative to another entity. ' +
      'Example absolute: { eventId, targetLane: -2 }. ' +
      'Example relative: { eventId, targetLane: -1, targetType: "relative", entityRef: "Ego" }.',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of the event to add the action to.',
        },
        targetLane: {
          type: 'number',
          description:
            'Target lane value. For absolute: the lane ID (integer). ' +
            'For relative: the lane offset (integer, negative = left, positive = right).',
        },
        targetType: {
          type: 'string',
          enum: ['absolute', 'relative'],
          description:
            'Whether targetLane is an absolute lane ID or a relative offset. ' +
            'Defaults to "absolute". Use "relative" together with entityRef.',
        },
        entityRef: {
          type: 'string',
          description:
            'Required when targetType is "relative". ' +
            'The entity whose current lane is used as the reference.',
        },
        transitionDynamics: {
          type: 'object',
          description: 'Transition dynamics (optional, defaults to linear/time/2.0).',
          properties: {
            shape: {
              type: 'string',
              enum: ['linear', 'cubic', 'sinusoidal', 'step'],
            },
            value: { type: 'number' },
            dimension: {
              type: 'string',
              enum: ['time', 'distance', 'rate'],
            },
          },
        },
        targetLaneOffset: {
          type: 'number',
          description: 'Lateral offset in the target lane (optional, default 0).',
        },
      },
      required: ['eventId', 'targetLane'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const eventId = args['eventId'] as string;
        const targetLane = args['targetLane'];
        const targetType = (args['targetType'] as 'absolute' | 'relative') ?? 'absolute';
        const entityRef = args['entityRef'] as string | undefined;

        if (!eventId) return errorResult('"eventId" is required.');
        if (targetLane === undefined) return errorResult('"targetLane" is required.');
        if (targetType === 'relative' && !entityRef) {
          return errorResult('"entityRef" is required when targetType is "relative".');
        }

        const dynamics = buildTransitionDynamics(
          args['transitionDynamics'] as Record<string, unknown> | undefined,
        );

        const laneValue = typeof targetLane === 'number' ? targetLane : Number(targetLane);

        const target: LaneChangeTarget =
          targetType === 'relative'
            ? { kind: 'relative', entityRef: entityRef!, value: laneValue }
            : { kind: 'absolute', value: laneValue };

        const action: PrivateAction = {
          type: 'laneChangeAction',
          dynamics,
          target,
          targetLaneOffset: (args['targetLaneOffset'] as number) ?? 0,
        };

        const s = store.getState();
        const added = s.addAction(eventId, { action });
        const targetDesc =
          targetType === 'relative'
            ? `relative offset ${laneValue} from ${entityRef}`
            : `absolute lane ${laneValue}`;
        return successResult({
          actionId: added.id,
          action: added.action,
          message: `Lane change action added (target: ${targetDesc}).`,
        });
      } catch (e) {
        return errorResult(`Failed to add lane change action: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'add_teleport_action',
    description:
      'Add a TeleportAction to an event. Instantly moves the entity to a new position. ' +
      'Supports shorthand: { eventId, x, y, z?, h? } or { eventId, roadId, laneId, s, offset? }.',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of the event to add the action to.',
        },
        position: {
          type: 'object',
          description: 'Full Position object (alternative to shorthand).',
        },
        x: { type: 'number', description: 'World X coordinate.' },
        y: { type: 'number', description: 'World Y coordinate.' },
        z: { type: 'number', description: 'World Z coordinate (optional).' },
        h: { type: 'number', description: 'Heading in radians (optional).' },
        roadId: { type: 'string', description: 'Road ID (for lane position).' },
        laneId: { type: 'string', description: 'Lane ID (for lane position).' },
        s: { type: 'number', description: 'S coordinate (for lane position).' },
        offset: { type: 'number', description: 'Lateral offset (for lane position).' },
      },
      required: ['eventId'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const eventId = args['eventId'] as string;
        if (!eventId) return errorResult('"eventId" is required.');

        const position = buildPositionFromInput(args);
        const action: PrivateAction = { type: 'teleportAction', position };

        const s = store.getState();
        const added = s.addAction(eventId, { action });
        return successResult({
          actionId: added.id,
          action: added.action,
          message: 'Teleport action added.',
        });
      } catch (e) {
        return errorResult(`Failed to add teleport action: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'add_action',
    description:
      'Add a generic PrivateAction to an event. This is the advanced interface — ' +
      'provide the full PrivateAction object directly. Use add_speed_action, ' +
      'add_lane_change_action, or add_teleport_action for simpler interfaces.',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of the event to add the action to.',
        },
        action: {
          type: 'object',
          description:
            'A full PrivateAction object. Must have a "type" field (e.g. "speedAction", "laneChangeAction", "teleportAction", etc.).',
        },
      },
      required: ['eventId', 'action'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const eventId = args['eventId'] as string;
        const action = args['action'] as PrivateAction;
        if (!eventId) return errorResult('"eventId" is required.');
        if (!action || typeof action !== 'object' || !('type' in action)) {
          return errorResult('"action" is required and must be a PrivateAction object with a "type" field.');
        }

        const s = store.getState();
        const added = s.addAction(eventId, { action });
        return successResult({
          actionId: added.id,
          action: added.action,
          message: `Action of type "${action.type}" added.`,
        });
      } catch (e) {
        return errorResult(`Failed to add action: ${(e as Error).message}`);
      }
    },
  },
];

/**
 * Storyboard hierarchy tools: add story, act, maneuver group, event.
 */

import type { McpToolResult } from '@osce/shared';
import { successResult, errorResult } from '../utils/response-helpers.js';
import type { ToolDefinition } from './tool-registry.js';

export const storyboardTools: ToolDefinition[] = [
  {
    name: 'add_story',
    description:
      'Add a new Story to the storyboard. A Story contains Acts, which contain ManeuverGroups. ' +
      'After adding a story, use add_act to add acts to it.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Story name (optional, auto-generated if omitted).',
        },
      },
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const s = store.getState();
        const story = s.addStory({ name: args['name'] as string | undefined });
        return successResult({
          storyId: story.id,
          name: story.name,
          message: `Story "${story.name}" added. Use add_act to add acts.`,
        });
      } catch (e) {
        return errorResult(`Failed to add story: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'add_act',
    description:
      'Add a new Act to a Story. An Act contains ManeuverGroups and has start/stop triggers. ' +
      'After adding, use add_maneuver_group to add maneuver groups.',
    inputSchema: {
      type: 'object',
      properties: {
        storyId: {
          type: 'string',
          description: 'ID of the parent Story. Use get_scenario_state to find story IDs.',
        },
        name: {
          type: 'string',
          description: 'Act name (optional).',
        },
      },
      required: ['storyId'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const storyId = args['storyId'] as string;
        if (!storyId) return errorResult('"storyId" is required. Use get_scenario_state to find story IDs.');

        const s = store.getState();
        const act = s.addAct(storyId, { name: args['name'] as string | undefined });
        return successResult({
          actId: act.id,
          name: act.name,
          startTriggerId: act.startTrigger.id,
          message: `Act "${act.name}" added. Use add_maneuver_group to add maneuver groups, and add_simulation_time_trigger to set when the act starts.`,
        });
      } catch (e) {
        return errorResult(`Failed to add act: ${(e as Error).message}. Verify the storyId is correct.`);
      }
    },
  },

  {
    name: 'add_maneuver_group',
    description:
      'Add a ManeuverGroup to an Act. A ManeuverGroup associates actors (entities) with maneuvers. ' +
      'A default empty Maneuver is automatically created inside the group. ' +
      'Use the returned maneuverId to add events via add_event.',
    inputSchema: {
      type: 'object',
      properties: {
        actId: {
          type: 'string',
          description: 'ID of the parent Act.',
        },
        actors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Entity names that are actors in this maneuver group.',
        },
        name: {
          type: 'string',
          description: 'ManeuverGroup name (optional).',
        },
      },
      required: ['actId', 'actors'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const actId = args['actId'] as string;
        const actors = args['actors'] as string[];
        if (!actId) return errorResult('"actId" is required.');
        if (!actors || !Array.isArray(actors) || actors.length === 0) {
          return errorResult('"actors" is required and must be a non-empty array of entity names.');
        }

        const s = store.getState();
        const group = s.addManeuverGroup(actId, {
          name: args['name'] as string | undefined,
          actors: { selectTriggeringEntities: false, entityRefs: actors },
        });

        // Auto-add one empty maneuver for convenience
        const maneuver = store.getState().addManeuver(group.id, {});

        return successResult({
          maneuverGroupId: group.id,
          name: group.name,
          actors,
          maneuverId: maneuver.id,
          maneuverName: maneuver.name,
          message: `ManeuverGroup "${group.name}" added with a default Maneuver. Use add_event with maneuverId="${maneuver.id}" to add events.`,
        });
      } catch (e) {
        return errorResult(`Failed to add maneuver group: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'add_event',
    description:
      'Add an Event to a Maneuver. Events contain actions and a start trigger. ' +
      'After adding, use add_speed_action, add_lane_change_action, or add_teleport_action ' +
      'to add actions, and add_simulation_time_trigger to set when the event starts.',
    inputSchema: {
      type: 'object',
      properties: {
        maneuverId: {
          type: 'string',
          description: 'ID of the parent Maneuver.',
        },
        name: {
          type: 'string',
          description: 'Event name (optional).',
        },
        priority: {
          type: 'string',
          enum: ['override', 'overwrite', 'skip', 'parallel'],
          description: 'Event priority (default: "override").',
        },
      },
      required: ['maneuverId'],
      additionalProperties: false,
    },
    handler(args, store): McpToolResult {
      try {
        const maneuverId = args['maneuverId'] as string;
        if (!maneuverId) return errorResult('"maneuverId" is required.');

        const s = store.getState();
        const event = s.addEvent(maneuverId, {
          name: args['name'] as string | undefined,
          priority: (args['priority'] as 'override' | 'overwrite' | 'skip' | 'parallel') ?? undefined,
        });

        return successResult({
          eventId: event.id,
          name: event.name,
          priority: event.priority,
          startTriggerId: event.startTrigger.id,
          message: `Event "${event.name}" added. Use add_speed_action/add_lane_change_action/add_teleport_action to add actions, and add_simulation_time_trigger to set the start trigger.`,
        });
      } catch (e) {
        return errorResult(`Failed to add event: ${(e as Error).message}`);
      }
    },
  },
];

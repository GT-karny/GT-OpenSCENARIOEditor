/**
 * MCP Prompts: template-guided workflows for AI agents.
 */

export interface PromptDefinition {
  name: string;
  description: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
  generate: (args: Record<string, string>) => Array<{ role: 'user' | 'assistant'; content: { type: 'text'; text: string } }>;
}

export const promptDefinitions: PromptDefinition[] = [
  {
    name: 'create_cut_in_scenario',
    description:
      'Step-by-step guide to create a cut-in (lane merge) scenario. ' +
      'A target vehicle cuts in front of the ego vehicle.',
    arguments: [
      {
        name: 'egoSpeed',
        description: 'Ego vehicle speed in m/s (default: 33.33 = 120 km/h).',
        required: false,
      },
      {
        name: 'targetSpeed',
        description: 'Target vehicle speed in m/s (default: 27.78 = 100 km/h).',
        required: false,
      },
    ],
    generate(args) {
      const egoSpeed = args['egoSpeed'] ?? '33.33';
      const targetSpeed = args['targetSpeed'] ?? '27.78';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Create a cut-in scenario where a target vehicle merges in front of the ego vehicle.\n` +
              `Ego speed: ${egoSpeed} m/s, Target speed: ${targetSpeed} m/s.\n\n` +
              `Follow these steps:\n` +
              `1. Use create_scenario to start a new empty scenario\n` +
              `2. Or use apply_template with templateId="cutIn" and parameters: ` +
              `{ "egoSpeed": ${egoSpeed}, "cutInSpeed": ${targetSpeed} }\n` +
              `3. Verify with get_scenario_state\n` +
              `4. Export with export_xosc if needed\n\n` +
              `Alternatively, build manually:\n` +
              `1. create_scenario\n` +
              `2. add_entity: Ego (vehicle, car)\n` +
              `3. add_entity: TargetVehicle (vehicle, car)\n` +
              `4. set_init_position for both entities\n` +
              `5. set_init_speed: Ego at ${egoSpeed} m/s, TargetVehicle at ${targetSpeed} m/s\n` +
              `6. add_story → add_act → add_maneuver_group (actors: ["TargetVehicle"])\n` +
              `7. add_event to the maneuver\n` +
              `8. add_lane_change_action with targetLane (relative: -1 or 1)\n` +
              `9. add_simulation_time_trigger to set when the lane change starts\n` +
              `10. validate_scenario to check for errors`,
          },
        },
      ];
    },
  },

  {
    name: 'create_scenario_from_description',
    description:
      'Guide to create a scenario from a natural language description. ' +
      'Analyzes the description and suggests the appropriate tools and sequence.',
    arguments: [
      {
        name: 'description',
        description: 'Natural language description of the desired scenario.',
        required: true,
      },
    ],
    generate(args) {
      const description = args['description'] ?? 'a basic scenario';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Create an OpenSCENARIO based on this description: "${description}"\n\n` +
              `Available tools for building the scenario:\n\n` +
              `**Setup:**\n` +
              `- create_scenario: Start fresh\n` +
              `- apply_template: Use a predefined template (list_templates to see options)\n\n` +
              `**Entities:**\n` +
              `- add_entity: Add vehicles, pedestrians, or objects\n` +
              `- set_init_position: Place entities (supports x,y or roadId,laneId,s)\n` +
              `- set_init_speed: Set initial speeds\n\n` +
              `**Behavior (Storyboard hierarchy):**\n` +
              `- add_story → add_act → add_maneuver_group → add_event\n` +
              `- Actions: add_speed_action, add_lane_change_action, add_teleport_action\n` +
              `- Triggers: add_simulation_time_trigger, add_distance_trigger\n\n` +
              `**Verification:**\n` +
              `- validate_scenario: Check for errors\n` +
              `- export_xosc: Export to OpenSCENARIO XML\n\n` +
              `Please analyze the description and build the scenario step by step. ` +
              `Check if any template matches (list_templates) before building manually.`,
          },
        },
      ];
    },
  },
];

export function findPrompt(name: string): PromptDefinition | undefined {
  return promptDefinitions.find((p) => p.name === name);
}

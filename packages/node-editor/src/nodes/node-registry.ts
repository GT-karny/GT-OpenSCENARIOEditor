/**
 * React Flow nodeTypes registry mapping.
 */

import type { NodeTypes } from '@xyflow/react';
import { StoryboardNode } from './StoryboardNode.js';
import { InitNode } from './InitNode.js';
import { EntityNode } from './EntityNode.js';
import { StoryNode } from './StoryNode.js';
import { ActNode } from './ActNode.js';
import { ManeuverGroupNode } from './ManeuverGroupNode.js';
import { ManeuverNode } from './ManeuverNode.js';
import { EventNode } from './EventNode.js';
import { ActionNode } from './ActionNode.js';
import { TriggerNode } from './TriggerNode.js';
import { ConditionNode } from './ConditionNode.js';

export const osceNodeTypes: NodeTypes = {
  storyboard: StoryboardNode,
  init: InitNode,
  entity: EntityNode,
  story: StoryNode,
  act: ActNode,
  maneuverGroup: ManeuverGroupNode,
  maneuver: ManeuverNode,
  event: EventNode,
  action: ActionNode,
  trigger: TriggerNode,
  condition: ConditionNode,
};

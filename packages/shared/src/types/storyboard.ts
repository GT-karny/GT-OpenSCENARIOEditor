/**
 * Storyboard hierarchy types for OpenSCENARIO.
 * Storyboard → Story → Act → ManeuverGroup → Maneuver → Event → Action
 */

import type { ParameterDeclaration } from './parameters.js';
import type { ScenarioAction, PrivateAction, GlobalAction } from './actions.js';
import type { Trigger } from './triggers.js';

export interface Storyboard {
  id: string;
  init: Init;
  stories: Story[];
  stopTrigger: Trigger;
}

export interface Init {
  id: string;
  globalActions: InitGlobalAction[];
  entityActions: EntityInitActions[];
}

export interface InitGlobalAction {
  id: string;
  action: GlobalAction;
}

export interface EntityInitActions {
  id: string;
  entityRef: string;
  privateActions: InitPrivateAction[];
}

export interface InitPrivateAction {
  id: string;
  action: PrivateAction;
}

export interface Story {
  id: string;
  name: string;
  parameterDeclarations: ParameterDeclaration[];
  acts: Act[];
}

export interface Act {
  id: string;
  name: string;
  maneuverGroups: ManeuverGroup[];
  startTrigger: Trigger;
  stopTrigger?: Trigger;
}

export interface ManeuverGroup {
  id: string;
  name: string;
  maximumExecutionCount: number;
  actors: Actors;
  maneuvers: Maneuver[];
}

export interface Actors {
  selectTriggeringEntities: boolean;
  entityRefs: string[];
}

export interface Maneuver {
  id: string;
  name: string;
  parameterDeclarations: ParameterDeclaration[];
  events: ScenarioEvent[];
}

export type EventPriority = 'override' | 'overwrite' | 'skip' | 'parallel';

export interface ScenarioEvent {
  id: string;
  name: string;
  priority: EventPriority;
  maximumExecutionCount?: number;
  actions: ScenarioAction[];
  startTrigger: Trigger;
}

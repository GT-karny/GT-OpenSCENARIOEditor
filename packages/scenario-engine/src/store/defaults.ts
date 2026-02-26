/**
 * Factory functions for creating default scenario elements.
 * Every object gets a UUID `id` field.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ScenarioDocument,
  FileHeader,
  EditorMetadata,
  ScenarioEntity,
  Storyboard,
  Init,
  Story,
  Act,
  ManeuverGroup,
  Maneuver,
  ScenarioEvent,
  ScenarioAction,
  Trigger,
  ConditionGroup,
  Condition,
  EntityInitActions,
  InitPrivateAction,
  PrivateAction,
} from '@osce/shared';

export function createDefaultDocument(): ScenarioDocument {
  return {
    id: uuidv4(),
    fileHeader: createDefaultFileHeader(),
    parameterDeclarations: [],
    variableDeclarations: [],
    catalogLocations: {},
    roadNetwork: {},
    entities: [],
    storyboard: createDefaultStoryboard(),
    _editor: createDefaultEditorMetadata(),
  };
}

export function createDefaultFileHeader(): FileHeader {
  return {
    revMajor: 1,
    revMinor: 2,
    date: new Date().toISOString().split('T')[0],
    description: '',
    author: '',
  };
}

export function createDefaultEditorMetadata(): EditorMetadata {
  return {
    formatVersion: '1.0.0',
    lastModified: new Date().toISOString(),
    appliedTemplates: [],
    nodePositions: {},
    nodeCollapsed: {},
  };
}

export function createDefaultStoryboard(): Storyboard {
  return {
    id: uuidv4(),
    init: createDefaultInit(),
    stories: [],
    stopTrigger: createDefaultTrigger(),
  };
}

export function createDefaultInit(): Init {
  return {
    id: uuidv4(),
    globalActions: [],
    entityActions: [],
  };
}

export function createDefaultTrigger(): Trigger {
  return {
    id: uuidv4(),
    conditionGroups: [],
  };
}

export function createDefaultConditionGroup(): ConditionGroup {
  return {
    id: uuidv4(),
    conditions: [],
  };
}

export function createStoryFromPartial(partial: Partial<Story>): Story {
  return {
    id: partial.id ?? uuidv4(),
    name: partial.name ?? 'NewStory',
    parameterDeclarations: partial.parameterDeclarations ?? [],
    acts: partial.acts ?? [],
  };
}

export function createActFromPartial(partial: Partial<Act>): Act {
  return {
    id: partial.id ?? uuidv4(),
    name: partial.name ?? 'NewAct',
    maneuverGroups: partial.maneuverGroups ?? [],
    startTrigger: partial.startTrigger ?? createDefaultTrigger(),
    stopTrigger: partial.stopTrigger,
  };
}

export function createManeuverGroupFromPartial(partial: Partial<ManeuverGroup>): ManeuverGroup {
  return {
    id: partial.id ?? uuidv4(),
    name: partial.name ?? 'NewManeuverGroup',
    maximumExecutionCount: partial.maximumExecutionCount ?? 1,
    actors: partial.actors ?? { selectTriggeringEntities: false, entityRefs: [] },
    maneuvers: partial.maneuvers ?? [],
  };
}

export function createManeuverFromPartial(partial: Partial<Maneuver>): Maneuver {
  return {
    id: partial.id ?? uuidv4(),
    name: partial.name ?? 'NewManeuver',
    parameterDeclarations: partial.parameterDeclarations ?? [],
    events: partial.events ?? [],
  };
}

export function createEventFromPartial(partial: Partial<ScenarioEvent>): ScenarioEvent {
  return {
    id: partial.id ?? uuidv4(),
    name: partial.name ?? 'NewEvent',
    priority: partial.priority ?? 'override',
    maximumExecutionCount: partial.maximumExecutionCount,
    actions: partial.actions ?? [],
    startTrigger: partial.startTrigger ?? createDefaultTrigger(),
  };
}

export function createActionFromPartial(partial: Partial<ScenarioAction>): ScenarioAction {
  return {
    id: partial.id ?? uuidv4(),
    name: partial.name ?? 'NewAction',
    action: partial.action ?? { type: 'speedAction', dynamics: { dynamicsShape: 'step', dynamicsDimension: 'time', value: 0 }, target: { kind: 'absolute', value: 0 } },
  };
}

export function createConditionFromPartial(partial: Partial<Condition>): Condition {
  return {
    id: partial.id ?? uuidv4(),
    name: partial.name ?? 'NewCondition',
    delay: partial.delay ?? 0,
    conditionEdge: partial.conditionEdge ?? 'rising',
    condition: partial.condition ?? {
      kind: 'byValue',
      valueCondition: { type: 'simulationTime', value: 0, rule: 'greaterThan' },
    },
  };
}

export function createEntityFromPartial(partial: Partial<ScenarioEntity>): ScenarioEntity {
  return {
    id: partial.id ?? uuidv4(),
    name: partial.name ?? 'NewEntity',
    type: partial.type ?? 'vehicle',
    definition: partial.definition ?? {
      kind: 'vehicle',
      name: partial.name ?? 'NewEntity',
      vehicleCategory: 'car',
      parameterDeclarations: [],
      performance: { maxSpeed: 69.444, maxAcceleration: 10, maxDeceleration: 10 },
      boundingBox: {
        center: { x: 1.4, y: 0, z: 0.9 },
        dimensions: { width: 2.0, length: 4.5, height: 1.8 },
      },
      axles: {
        frontAxle: { maxSteering: 0.5, wheelDiameter: 0.6, trackWidth: 1.8, positionX: 3.1, positionZ: 0.3 },
        rearAxle: { maxSteering: 0, wheelDiameter: 0.6, trackWidth: 1.8, positionX: 0, positionZ: 0.3 },
        additionalAxles: [],
      },
      properties: [],
    },
    controller: partial.controller,
  };
}

export function createEntityInitActions(entityRef: string): EntityInitActions {
  return {
    id: uuidv4(),
    entityRef,
    privateActions: [],
  };
}

export function createInitPrivateAction(action: PrivateAction): InitPrivateAction {
  return {
    id: uuidv4(),
    action,
  };
}

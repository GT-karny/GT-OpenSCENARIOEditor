/**
 * IScenarioService - CRUD operations on the scenario document.
 * This is the primary interface for all scenario manipulation.
 */

import type { ScenarioDocument } from '../types/scenario.js';
import type { ScenarioEntity } from '../types/entities.js';
import type {
  Story, Act, ManeuverGroup, Maneuver, ScenarioEvent,
} from '../types/storyboard.js';
import type { ScenarioAction, PrivateAction } from '../types/actions.js';
import type { Trigger, ConditionGroup, Condition } from '../types/triggers.js';
import type { Position } from '../types/positions.js';

export interface IScenarioService {
  // --- Document operations ---
  createScenario(template?: string): ScenarioDocument;
  getScenario(): ScenarioDocument;

  // --- Entity operations ---
  addEntity(entity: Partial<ScenarioEntity>): ScenarioEntity;
  removeEntity(entityId: string): void;
  updateEntity(entityId: string, updates: Partial<ScenarioEntity>): void;
  getEntity(entityId: string): ScenarioEntity | undefined;

  // --- Storyboard operations ---
  addStory(story: Partial<Story>): Story;
  removeStory(storyId: string): void;
  addAct(storyId: string, act: Partial<Act>): Act;
  removeAct(actId: string): void;
  addManeuverGroup(actId: string, group: Partial<ManeuverGroup>): ManeuverGroup;
  removeManeuverGroup(groupId: string): void;
  addManeuver(groupId: string, maneuver: Partial<Maneuver>): Maneuver;
  removeManeuver(maneuverId: string): void;
  addEvent(maneuverId: string, event: Partial<ScenarioEvent>): ScenarioEvent;
  removeEvent(eventId: string): void;
  addAction(eventId: string, action: Partial<ScenarioAction>): ScenarioAction;
  removeAction(actionId: string): void;

  // --- Trigger operations ---
  setStartTrigger(elementId: string, trigger: Trigger): void;
  setStopTrigger(elementId: string, trigger: Trigger): void;
  addConditionGroup(triggerId: string): ConditionGroup;
  removeConditionGroup(groupId: string): void;
  addCondition(groupId: string, condition: Partial<Condition>): Condition;
  removeCondition(conditionId: string): void;

  // --- Init operations ---
  addInitAction(entityName: string, action: PrivateAction): void;
  removeInitAction(actionId: string): void;
  setInitPosition(entityName: string, position: Position): void;
  setInitSpeed(entityName: string, speed: number): void;

  // --- Query operations ---
  getElementById(id: string): unknown | undefined;
  getParentOf(id: string): { parent: unknown; field: string } | undefined;

  // --- Undo/Redo ---
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

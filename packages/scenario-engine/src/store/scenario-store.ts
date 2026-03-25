/**
 * Zustand store implementing IScenarioService.
 * All mutations go through the Command pattern for undo/redo.
 */

import { createStore } from 'zustand/vanilla';
import type {
  ScenarioDocument,
  ScenarioEntity,
  ParameterDeclaration,
  VariableDeclaration,
  FileHeader,
  RoadNetwork,
  CatalogLocations,
  Story,
  Act,
  ManeuverGroup,
  Maneuver,
  ScenarioEvent,
  ScenarioAction,
  Trigger,
  ConditionGroup,
  Condition,
  PrivateAction,
  Position,
  IScenarioService,
} from '@osce/shared';
import type { ScenarioState } from './store-types.js';
import { createDefaultDocument } from './defaults.js';
import { CommandHistory } from '../commands/command-history.js';
import {
  AddEntityCommand,
  RemoveEntityCommand,
  UpdateEntityCommand,
} from '../commands/entity-commands.js';
import type { EntityCleanupOption } from '../commands/entity-commands.js';
import {
  AddParameterCommand, RemoveParameterCommand, UpdateParameterCommand,
  RenameParameterCommand, SetParameterBindingCommand, RemoveParameterBindingCommand,
} from '../commands/parameter-commands.js';
import {
  AddVariableCommand, RemoveVariableCommand, UpdateVariableCommand,
  RenameVariableCommand,
} from '../commands/variable-commands.js';
import { AddStoryCommand, RemoveStoryCommand } from '../commands/story-commands.js';
import { AddActCommand, RemoveActCommand } from '../commands/act-commands.js';
import { AddManeuverGroupCommand, RemoveManeuverGroupCommand } from '../commands/maneuver-group-commands.js';
import { AddManeuverCommand, RemoveManeuverCommand } from '../commands/maneuver-commands.js';
import { AddEventCommand, RemoveEventCommand, ReorderEventCommand } from '../commands/event-commands.js';
import { AddActionCommand, RemoveActionCommand } from '../commands/action-commands.js';
import {
  SetStartTriggerCommand,
  SetStopTriggerCommand,
  AddConditionGroupCommand,
  RemoveConditionGroupCommand,
  AddConditionCommand,
  RemoveConditionCommand,
} from '../commands/trigger-commands.js';
import {
  AddInitActionCommand,
  RemoveInitActionCommand,
  SetInitPositionCommand,
  SetInitSpeedCommand,
} from '../commands/init-commands.js';
import {
  UpdateStoryCommand,
  UpdateActCommand,
  UpdateManeuverGroupCommand,
  UpdateManeuverCommand,
  UpdateEventCommand,
  UpdateActionCommand,
  UpdateConditionCommand,
} from '../commands/update-commands.js';
import {
  UpdateFileHeaderCommand,
  UpdateRoadNetworkCommand,
  UpdateCatalogLocationsCommand,
} from '../commands/scenario-commands.js';
import { getElementById as _getElementById, getParentOf as _getParentOf } from '../operations/tree-traversal.js';

export interface ScenarioStore extends ScenarioState, IScenarioService {
  getCommandHistory(): CommandHistory;

  // Override to accept optional cleanup option
  removeEntity(entityId: string, cleanupOption?: EntityCleanupOption): void;

  // Update operations (beyond IScenarioService)
  updateStory(storyId: string, updates: Partial<Story>): void;
  updateAct(actId: string, updates: Partial<Act>): void;
  updateManeuverGroup(groupId: string, updates: Partial<ManeuverGroup>): void;
  updateManeuver(maneuverId: string, updates: Partial<Maneuver>): void;
  updateEvent(eventId: string, updates: Partial<ScenarioEvent>): void;
  updateAction(actionId: string, updates: Partial<ScenarioAction>): void;
  updateCondition(conditionId: string, updates: Partial<Condition>): void;

  // Reorder operations
  reorderEvent(eventId: string, newIndex: number): void;

  // Scenario-level property updates
  updateFileHeader(updates: Partial<FileHeader>): void;
  updateRoadNetwork(updates: Partial<RoadNetwork>): void;
  updateCatalogLocations(updates: Partial<CatalogLocations>): void;
}

// Guard against concurrent parameter/variable rename operations
let _renameInProgress = false;

export function createScenarioStore() {
  const commandHistory = new CommandHistory();

  const store = createStore<ScenarioStore>()((set, get) => {
    const getDoc = (): ScenarioDocument => get().document;
    const setDoc = (doc: ScenarioDocument): void => {
      set({
        document: doc,
        undoAvailable: commandHistory.canUndo(),
        redoAvailable: commandHistory.canRedo(),
      });
    };
    const syncUndoRedo = (): void => {
      set({
        undoAvailable: commandHistory.canUndo(),
        redoAvailable: commandHistory.canRedo(),
      });
    };

    return {
      // --- State ---
      document: createDefaultDocument(),
      undoAvailable: false,
      redoAvailable: false,

      // --- Command History ---
      getCommandHistory: () => commandHistory,

      // --- Document operations ---
      createScenario: (_template?: string): ScenarioDocument => {
        commandHistory.clear();
        const doc = createDefaultDocument();
        set({ document: doc, undoAvailable: false, redoAvailable: false });
        return doc;
      },

      getScenario: (): ScenarioDocument => get().document,

      // --- Parameter operations ---
      addParameter: (partial: Partial<ParameterDeclaration>): ParameterDeclaration => {
        const cmd = new AddParameterCommand(partial, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedParameter();
      },

      removeParameter: (paramId: string): void => {
        const cmd = new RemoveParameterCommand(paramId, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateParameter: (paramId: string, updates: Partial<ParameterDeclaration>): void => {
        const cmd = new UpdateParameterCommand(paramId, updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      renameParameter: (paramId: string, newName: string): void => {
        if (_renameInProgress) return;
        _renameInProgress = true;
        try {
          const cmd = new RenameParameterCommand(paramId, newName, getDoc, setDoc);
          commandHistory.execute(cmd);
          syncUndoRedo();
        } finally {
          _renameInProgress = false;
        }
      },

      // --- Variable operations ---
      addVariable: (partial: Partial<VariableDeclaration>): VariableDeclaration => {
        const cmd = new AddVariableCommand(partial, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedVariable();
      },

      removeVariable: (varId: string): void => {
        const cmd = new RemoveVariableCommand(varId, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateVariable: (varId: string, updates: Partial<VariableDeclaration>): void => {
        const cmd = new UpdateVariableCommand(varId, updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      renameVariable: (varId: string, newName: string): void => {
        if (_renameInProgress) return;
        _renameInProgress = true;
        try {
          const cmd = new RenameVariableCommand(varId, newName, getDoc, setDoc);
          commandHistory.execute(cmd);
          syncUndoRedo();
        } finally {
          _renameInProgress = false;
        }
      },

      // --- Parameter binding operations ---
      setParameterBinding: (elementId: string, fieldName: string, paramRef: string): void => {
        const cmd = new SetParameterBindingCommand(elementId, fieldName, paramRef, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      removeParameterBinding: (elementId: string, fieldName: string): void => {
        const cmd = new RemoveParameterBindingCommand(elementId, fieldName, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Entity operations ---
      addEntity: (partial: Partial<ScenarioEntity>): ScenarioEntity => {
        const cmd = new AddEntityCommand(partial, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedEntity();
      },

      removeEntity: (entityId: string, cleanupOption?: EntityCleanupOption): void => {
        const cmd = new RemoveEntityCommand(entityId, getDoc, setDoc, cleanupOption);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateEntity: (entityId: string, updates: Partial<ScenarioEntity>): void => {
        const cmd = new UpdateEntityCommand(entityId, updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      getEntity: (entityId: string): ScenarioEntity | undefined => {
        return get().document.entities.find((e) => e.id === entityId);
      },

      // --- Story operations ---
      addStory: (partial: Partial<Story>): Story => {
        const cmd = new AddStoryCommand(partial, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedStory();
      },

      removeStory: (storyId: string): void => {
        const cmd = new RemoveStoryCommand(storyId, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateStory: (storyId: string, updates: Partial<Story>): void => {
        const cmd = new UpdateStoryCommand(storyId, updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Act operations ---
      addAct: (storyId: string, partial: Partial<Act>): Act => {
        const cmd = new AddActCommand(storyId, partial, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedAct();
      },

      removeAct: (actId: string): void => {
        const cmd = new RemoveActCommand(actId, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateAct: (actId: string, updates: Partial<Act>): void => {
        const cmd = new UpdateActCommand(actId, updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- ManeuverGroup operations ---
      addManeuverGroup: (actId: string, partial: Partial<ManeuverGroup>): ManeuverGroup => {
        const cmd = new AddManeuverGroupCommand(actId, partial, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedGroup();
      },

      removeManeuverGroup: (groupId: string): void => {
        const cmd = new RemoveManeuverGroupCommand(groupId, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateManeuverGroup: (groupId: string, updates: Partial<ManeuverGroup>): void => {
        const cmd = new UpdateManeuverGroupCommand(groupId, updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Maneuver operations ---
      addManeuver: (groupId: string, partial: Partial<Maneuver>): Maneuver => {
        const cmd = new AddManeuverCommand(groupId, partial, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedManeuver();
      },

      removeManeuver: (maneuverId: string): void => {
        const cmd = new RemoveManeuverCommand(maneuverId, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateManeuver: (maneuverId: string, updates: Partial<Maneuver>): void => {
        const cmd = new UpdateManeuverCommand(maneuverId, updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Event operations ---
      addEvent: (maneuverId: string, partial: Partial<ScenarioEvent>): ScenarioEvent => {
        const cmd = new AddEventCommand(maneuverId, partial, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedEvent();
      },

      removeEvent: (eventId: string): void => {
        const cmd = new RemoveEventCommand(eventId, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateEvent: (eventId: string, updates: Partial<ScenarioEvent>): void => {
        const cmd = new UpdateEventCommand(eventId, updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      reorderEvent: (eventId: string, newIndex: number): void => {
        const cmd = new ReorderEventCommand(eventId, newIndex, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Action operations ---
      addAction: (eventId: string, partial: Partial<ScenarioAction>): ScenarioAction => {
        const cmd = new AddActionCommand(eventId, partial, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedAction();
      },

      removeAction: (actionId: string): void => {
        const cmd = new RemoveActionCommand(actionId, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateAction: (actionId: string, updates: Partial<ScenarioAction>): void => {
        const cmd = new UpdateActionCommand(actionId, updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Trigger operations ---
      setStartTrigger: (elementId: string, trigger: Trigger): void => {
        const cmd = new SetStartTriggerCommand(elementId, trigger, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      setStopTrigger: (elementId: string, trigger: Trigger): void => {
        const cmd = new SetStopTriggerCommand(elementId, trigger, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      addConditionGroup: (triggerId: string): ConditionGroup => {
        const cmd = new AddConditionGroupCommand(triggerId, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedGroup();
      },

      removeConditionGroup: (groupId: string): void => {
        const cmd = new RemoveConditionGroupCommand(groupId, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      addCondition: (groupId: string, partial: Partial<Condition>): Condition => {
        const cmd = new AddConditionCommand(groupId, partial, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedCondition();
      },

      removeCondition: (conditionId: string): void => {
        const cmd = new RemoveConditionCommand(conditionId, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateCondition: (conditionId: string, updates: Partial<Condition>): void => {
        const cmd = new UpdateConditionCommand(conditionId, updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Scenario-level property operations ---
      updateFileHeader: (updates: Partial<FileHeader>): void => {
        const cmd = new UpdateFileHeaderCommand(updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateRoadNetwork: (updates: Partial<RoadNetwork>): void => {
        const cmd = new UpdateRoadNetworkCommand(updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateCatalogLocations: (updates: Partial<CatalogLocations>): void => {
        const cmd = new UpdateCatalogLocationsCommand(updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Init operations ---
      addInitAction: (entityName: string, action: PrivateAction): void => {
        const cmd = new AddInitActionCommand(entityName, action, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      removeInitAction: (actionId: string): void => {
        const cmd = new RemoveInitActionCommand(actionId, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      setInitPosition: (entityName: string, position: Position): void => {
        const cmd = new SetInitPositionCommand(entityName, position, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      setInitSpeed: (entityName: string, speed: number): void => {
        const cmd = new SetInitSpeedCommand(entityName, speed, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Query operations ---
      getElementById: (id: string): unknown | undefined => {
        return _getElementById(get().document, id);
      },

      getParentOf: (id: string): { parent: unknown; field: string } | undefined => {
        return _getParentOf(get().document, id);
      },

      // --- Undo/Redo ---
      undo: (): void => {
        commandHistory.undo();
        syncUndoRedo();
      },

      redo: (): void => {
        commandHistory.redo();
        syncUndoRedo();
      },

      canUndo: (): boolean => commandHistory.canUndo(),
      canRedo: (): boolean => commandHistory.canRedo(),
    };
  });

  return store;
}

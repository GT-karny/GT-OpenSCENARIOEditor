/**
 * Zustand store for the OpenDRIVE engine.
 * All mutations go through the Command pattern for undo/redo.
 */

import { createStore } from 'zustand/vanilla';
import type {
  OpenDriveDocument,
  OdrRoad,
  OdrRoadLinkElement,
  OdrLane,
  OdrHeader,
  OdrSignal,
  OdrRoadObject,
  OdrController,
  OdrJunction,
  OdrJunctionConnection,
  OdrGeometryUpdate,
  ICommand,
} from '@osce/shared';
import type { OpenDriveState } from './store-types.js';
import { createDefaultDocument } from './defaults.js';
import { CommandHistory, CompoundCommand } from '@osce/scenario-engine';
import { AddRoadCommand, RemoveRoadCommand, UpdateRoadCommand } from '../commands/road-commands.js';
import { UpdateHeaderCommand } from '../commands/header-commands.js';
import { SetRoadLinkCommand } from '../commands/road-link-commands.js';
import {
  AddLaneCommand,
  RemoveLaneCommand,
  UpdateLaneCommand,
} from '../commands/lane-commands.js';
import {
  AddJunctionCommand,
  RemoveJunctionCommand,
  UpdateJunctionCommand,
  AddJunctionConnectionCommand,
  RemoveJunctionConnectionCommand,
} from '../commands/junction-commands.js';
import { AddGeometryCommand, RemoveGeometryCommand } from '../commands/geometry-commands.js';
import { AddObjectCommand, RemoveObjectCommand } from '../commands/object-commands.js';
import {
  AddSignalCommand,
  RemoveSignalCommand,
  UpdateSignalCommand,
} from '../commands/signal-commands.js';
import {
  AddControllerCommand,
  RemoveControllerCommand,
  UpdateControllerCommand,
} from '../commands/controller-commands.js';

export interface OpenDriveStore extends OpenDriveState {
  // Command history
  getCommandHistory(): CommandHistory;

  // Document operations
  loadDocument(doc: OpenDriveDocument): void;
  createDocument(): OpenDriveDocument;
  getDocument(): OpenDriveDocument;

  // Road operations
  addRoad(partial: Partial<OdrRoad>): OdrRoad;
  removeRoad(roadId: string): void;
  updateRoad(roadId: string, updates: Partial<OdrRoad>): void;
  setRoadLink(
    roadId: string,
    linkType: 'predecessor' | 'successor',
    link: OdrRoadLinkElement | undefined,
  ): void;

  // Geometry (planView) operations
  addGeometry(roadId: string, geometry: OdrGeometryUpdate): void;
  removeGeometry(roadId: string, index: number): void;

  // Lane operations
  addLane(
    roadId: string,
    sectionIdx: number,
    side: 'left' | 'right',
    partial: Partial<OdrLane>,
  ): void;
  removeLane(roadId: string, sectionIdx: number, side: 'left' | 'right', laneId: number): void;
  updateLane(
    roadId: string,
    sectionIdx: number,
    side: 'left' | 'right' | 'center',
    laneId: number,
    updates: Partial<OdrLane>,
  ): void;

  // Junction operations
  addJunction(partial: Partial<OdrJunction>): OdrJunction;
  removeJunction(junctionId: string): void;
  updateJunction(junctionId: string, updates: Partial<OdrJunction>): void;
  addJunctionConnection(
    junctionId: string,
    partial: Partial<OdrJunctionConnection>,
  ): OdrJunctionConnection;
  removeJunctionConnection(junctionId: string, connectionId: string): void;

  // Object operations
  addObject(roadId: string, partial: Partial<OdrRoadObject>): OdrRoadObject;
  removeObject(roadId: string, objectId: string): void;

  // Signal operations
  addSignal(roadId: string, partial: Partial<OdrSignal>): OdrSignal;
  removeSignal(roadId: string, signalId: string): void;
  updateSignal(roadId: string, signalId: string, updates: Partial<OdrSignal>): void;

  // Controller operations
  addController(partial: Partial<OdrController>): OdrController;
  removeController(controllerId: string): void;
  updateController(controllerId: string, updates: Partial<OdrController>): void;

  // Header operations
  updateHeader(updates: Partial<OdrHeader>): void;

  // Batch operations (group multiple mutations into a single undo step)
  beginBatch(description: string): void;
  endBatch(): void;

  // Undo/Redo
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;

  // Dirty tracking
  consumeDirtyRoadIds(): Set<string>;
  consumeDirtyJunctionIds(): Set<string>;
  consumeDirtyControllerIds(): Set<string>;
}

export function createOpenDriveStore() {
  const commandHistory = new CommandHistory();

  // Batch state: used by beginBatch/endBatch to collapse multiple commands
  let batchActive = false;
  let batchDescription = '';
  let batchUndoStackSize = 0;

  const store = createStore<OpenDriveStore>()((set, get) => {
    const getDoc = (): OpenDriveDocument => get().document;
    const setDoc = (doc: OpenDriveDocument): void => {
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
    const markDirtyRoad = (roadId: string): void => {
      set((state) => {
        const next = new Set(state.dirtyRoadIds);
        next.add(roadId);
        return { dirtyRoadIds: next };
      });
    };
    const markDirtyJunction = (junctionId: string): void => {
      set((state) => {
        const next = new Set(state.dirtyJunctionIds);
        next.add(junctionId);
        return { dirtyJunctionIds: next };
      });
    };
    const markDirtyController = (controllerId: string): void => {
      set((state) => {
        const next = new Set(state.dirtyControllerIds);
        next.add(controllerId);
        return { dirtyControllerIds: next };
      });
    };

    return {
      // --- State ---
      document: createDefaultDocument(),
      undoAvailable: false,
      redoAvailable: false,
      dirtyRoadIds: new Set<string>(),
      dirtyJunctionIds: new Set<string>(),
      dirtyControllerIds: new Set<string>(),

      // --- Command History ---
      getCommandHistory: () => commandHistory,

      // --- Document operations ---
      loadDocument: (doc: OpenDriveDocument): void => {
        commandHistory.clear();
        set({
          document: doc,
          undoAvailable: false,
          redoAvailable: false,
          dirtyRoadIds: new Set<string>(),
          dirtyJunctionIds: new Set<string>(),
          dirtyControllerIds: new Set<string>(),
        });
      },

      createDocument: (): OpenDriveDocument => {
        commandHistory.clear();
        const doc = createDefaultDocument();
        set({
          document: doc,
          undoAvailable: false,
          redoAvailable: false,
          dirtyRoadIds: new Set<string>(),
          dirtyJunctionIds: new Set<string>(),
          dirtyControllerIds: new Set<string>(),
        });
        return doc;
      },

      getDocument: (): OpenDriveDocument => get().document,

      // --- Road operations ---
      addRoad: (partial: Partial<OdrRoad>): OdrRoad => {
        const cmd = new AddRoadCommand(partial, getDoc, setDoc, markDirtyRoad);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedRoad();
      },

      removeRoad: (roadId: string): void => {
        const cmd = new RemoveRoadCommand(roadId, getDoc, setDoc, markDirtyRoad);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateRoad: (roadId: string, updates: Partial<OdrRoad>): void => {
        const cmd = new UpdateRoadCommand(roadId, updates, getDoc, setDoc, markDirtyRoad);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      setRoadLink: (
        roadId: string,
        linkType: 'predecessor' | 'successor',
        link: OdrRoadLinkElement | undefined,
      ): void => {
        // Preserve the prior diagnostic for callers passing a missing road id.
        if (getDoc().roads.findIndex((r) => r.id === roadId) === -1) {
          console.warn(
            `[opendrive-store] setRoadLink: road "${roadId}" not found in document (${linkType} link)`,
          );
          return;
        }
        const cmd = new SetRoadLinkCommand(roadId, linkType, link, getDoc, setDoc, markDirtyRoad);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Geometry (planView) operations ---
      addGeometry: (roadId: string, geometry: OdrGeometryUpdate): void => {
        const cmd = new AddGeometryCommand(roadId, geometry, getDoc, setDoc, markDirtyRoad);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      removeGeometry: (roadId: string, index: number): void => {
        const cmd = new RemoveGeometryCommand(roadId, index, getDoc, setDoc, markDirtyRoad);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Lane operations ---
      addLane: (
        roadId: string,
        sectionIdx: number,
        side: 'left' | 'right',
        partial: Partial<OdrLane>,
      ): void => {
        const cmd = new AddLaneCommand(
          roadId,
          sectionIdx,
          side,
          partial,
          getDoc,
          setDoc,
          markDirtyRoad,
        );
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      removeLane: (
        roadId: string,
        sectionIdx: number,
        side: 'left' | 'right',
        laneId: number,
      ): void => {
        const cmd = new RemoveLaneCommand(
          roadId,
          sectionIdx,
          side,
          laneId,
          getDoc,
          setDoc,
          markDirtyRoad,
        );
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateLane: (
        roadId: string,
        sectionIdx: number,
        side: 'left' | 'right' | 'center',
        laneId: number,
        updates: Partial<OdrLane>,
      ): void => {
        const cmd = new UpdateLaneCommand(
          roadId,
          sectionIdx,
          side,
          laneId,
          updates,
          getDoc,
          setDoc,
          markDirtyRoad,
        );
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Junction operations ---
      addJunction: (partial: Partial<OdrJunction>): OdrJunction => {
        const cmd = new AddJunctionCommand(partial, getDoc, setDoc, markDirtyJunction);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedJunction();
      },

      removeJunction: (junctionId: string): void => {
        const cmd = new RemoveJunctionCommand(junctionId, getDoc, setDoc, markDirtyJunction);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateJunction: (junctionId: string, updates: Partial<OdrJunction>): void => {
        const cmd = new UpdateJunctionCommand(
          junctionId,
          updates,
          getDoc,
          setDoc,
          markDirtyJunction,
        );
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      addJunctionConnection: (
        junctionId: string,
        partial: Partial<OdrJunctionConnection>,
      ): OdrJunctionConnection => {
        const cmd = new AddJunctionConnectionCommand(
          junctionId,
          partial,
          getDoc,
          setDoc,
          markDirtyJunction,
        );
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedConnection();
      },

      removeJunctionConnection: (junctionId: string, connectionId: string): void => {
        const cmd = new RemoveJunctionConnectionCommand(
          junctionId,
          connectionId,
          getDoc,
          setDoc,
          markDirtyJunction,
        );
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Object operations ---
      addObject: (roadId: string, partial: Partial<OdrRoadObject>): OdrRoadObject => {
        const cmd = new AddObjectCommand(roadId, partial, getDoc, setDoc, markDirtyRoad);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedObject();
      },

      removeObject: (roadId: string, objectId: string): void => {
        const cmd = new RemoveObjectCommand(roadId, objectId, getDoc, setDoc, markDirtyRoad);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Signal operations ---
      addSignal: (roadId: string, partial: Partial<OdrSignal>): OdrSignal => {
        const cmd = new AddSignalCommand(roadId, partial, getDoc, setDoc, markDirtyRoad);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedSignal();
      },

      removeSignal: (roadId: string, signalId: string): void => {
        const cmd = new RemoveSignalCommand(roadId, signalId, getDoc, setDoc, markDirtyRoad);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateSignal: (roadId: string, signalId: string, updates: Partial<OdrSignal>): void => {
        const cmd = new UpdateSignalCommand(
          roadId,
          signalId,
          updates,
          getDoc,
          setDoc,
          markDirtyRoad,
        );
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Controller operations ---
      addController: (partial: Partial<OdrController>): OdrController => {
        const cmd = new AddControllerCommand(partial, getDoc, setDoc, markDirtyController);
        commandHistory.execute(cmd);
        syncUndoRedo();
        return cmd.getCreatedController();
      },

      removeController: (controllerId: string): void => {
        const cmd = new RemoveControllerCommand(controllerId, getDoc, setDoc, markDirtyController);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      updateController: (controllerId: string, updates: Partial<OdrController>): void => {
        const cmd = new UpdateControllerCommand(
          controllerId,
          updates,
          getDoc,
          setDoc,
          markDirtyController,
        );
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Header operations ---
      updateHeader: (updates: Partial<OdrHeader>): void => {
        const cmd = new UpdateHeaderCommand(updates, getDoc, setDoc);
        commandHistory.execute(cmd);
        syncUndoRedo();
      },

      // --- Batch operations ---
      beginBatch: (description: string): void => {
        batchActive = true;
        batchDescription = description;
        batchUndoStackSize = commandHistory.getUndoStack().length;
      },

      endBatch: (): void => {
        if (!batchActive) return;
        batchActive = false;

        const undoStack = commandHistory.getUndoStack();
        const commandsAdded = undoStack.length - batchUndoStackSize;

        // Nothing was recorded during the batch — leave the history untouched.
        if (commandsAdded <= 0) {
          batchDescription = '';
          return;
        }

        // Collapse the member commands added during the batch into a single
        // CompoundCommand. Because the members are real commands, the collapsed
        // entry's execute() (redo) and undo() both work: redo re-runs each
        // member in order, undo reverses them.
        const members: ICommand[] = undoStack.slice(undoStack.length - commandsAdded);
        const compound = new CompoundCommand(batchDescription, members);
        commandHistory.collapseUndo(commandsAdded, compound);
        syncUndoRedo();

        batchDescription = '';
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

      // --- Dirty tracking ---
      consumeDirtyRoadIds: (): Set<string> => {
        const dirty = get().dirtyRoadIds;
        set({ dirtyRoadIds: new Set<string>() });
        return dirty;
      },

      consumeDirtyJunctionIds: (): Set<string> => {
        const dirty = get().dirtyJunctionIds;
        set({ dirtyJunctionIds: new Set<string>() });
        return dirty;
      },

      consumeDirtyControllerIds: (): Set<string> => {
        const dirty = get().dirtyControllerIds;
        set({ dirtyControllerIds: new Set<string>() });
        return dirty;
      },
    };
  });

  return store;
}

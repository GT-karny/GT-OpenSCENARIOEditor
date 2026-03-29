/**
 * Zustand store for the OpenDRIVE engine.
 * All mutations go through the Command pattern for undo/redo.
 */

import { createStore } from 'zustand/vanilla';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { nextNumericId } from '../utils/id-generator.js';
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
} from '@osce/shared';
import type { OpenDriveState } from './store-types.js';
import { createDefaultDocument, createSignalFromDefaults, createControllerFromDefaults, createJunctionFromDefaults, createJunctionConnectionFromDefaults } from './defaults.js';
import { CommandHistory } from '../commands/command-history.js';
import { AddRoadCommand, RemoveRoadCommand, UpdateRoadCommand } from '../commands/road-commands.js';
import { UpdateHeaderCommand } from '../commands/header-commands.js';
import { findRoadIndex } from '../operations/road-operations.js';

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
    side: 'left' | 'right',
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
}

export function createOpenDriveStore() {
  const commandHistory = new CommandHistory();

  // Batch state: used by beginBatch/endBatch to collapse multiple commands
  let batchSnapshot: OpenDriveDocument | null = null;
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

    return {
      // --- State ---
      document: createDefaultDocument(),
      undoAvailable: false,
      redoAvailable: false,
      dirtyRoadIds: new Set<string>(),
      dirtyJunctionIds: new Set<string>(),

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
        const doc = getDoc();
        const roadIdx = findRoadIndex(doc, roadId);
        if (roadIdx === -1) {
          console.warn(
            `[opendrive-store] setRoadLink: road "${roadId}" not found in document (${linkType} link)`,
          );
          return;
        }

        const prevDoc = structuredClone(doc);
        setDoc(
          produce(doc, (draft) => {
            const road = draft.roads[roadIdx];
            if (!road.link) road.link = {};
            if (link) {
              road.link[linkType] = { ...link };
            } else {
              delete road.link[linkType];
              if (!road.link.predecessor && !road.link.successor) {
                road.link = undefined;
              }
            }
          }),
        );
        markDirtyRoad(roadId);

        commandHistory.execute({
          id: uuidv4(),
          description: `Set ${linkType} link on road ${roadId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
            markDirtyRoad(roadId);
          },
        });
        syncUndoRedo();
      },

      // --- Lane operations (inline commands for simplicity) ---
      addLane: (
        roadId: string,
        sectionIdx: number,
        side: 'left' | 'right',
        partial: Partial<OdrLane>,
      ): void => {
        const doc = getDoc();
        const roadIdx = findRoadIndex(doc, roadId);
        if (roadIdx === -1) return;
        const section = doc.roads[roadIdx].lanes[sectionIdx];
        if (!section) return;

        const lanes = side === 'left' ? section.leftLanes : section.rightLanes;
        const sign = side === 'left' ? 1 : -1;
        const newId = partial.id ?? sign * (lanes.length + 1);
        const newLane: OdrLane = {
          id: newId,
          type: partial.type ?? 'driving',
          level: partial.level,
          width: partial.width ?? [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
          roadMarks: partial.roadMarks ?? [{ sOffset: 0, type: 'solid', color: 'standard' }],
          link: partial.link,
          speed: partial.speed,
          height: partial.height,
        };

        const prevDoc = structuredClone(doc);
        setDoc(
          produce(doc, (draft) => {
            const target = side === 'left'
              ? draft.roads[roadIdx].lanes[sectionIdx].leftLanes
              : draft.roads[roadIdx].lanes[sectionIdx].rightLanes;
            target.push(newLane);
          }),
        );
        markDirtyRoad(roadId);

        // Register as inline command for undo
        commandHistory.execute({
          id: uuidv4(),
          description: `Add lane ${newId} to road ${roadId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
            markDirtyRoad(roadId);
          },
        });
        syncUndoRedo();
      },

      removeLane: (
        roadId: string,
        sectionIdx: number,
        side: 'left' | 'right',
        laneId: number,
      ): void => {
        const doc = getDoc();
        const roadIdx = findRoadIndex(doc, roadId);
        if (roadIdx === -1) return;

        const prevDoc = structuredClone(doc);
        setDoc(
          produce(doc, (draft) => {
            const target = side === 'left'
              ? draft.roads[roadIdx].lanes[sectionIdx].leftLanes
              : draft.roads[roadIdx].lanes[sectionIdx].rightLanes;
            const idx = target.findIndex((l) => l.id === laneId);
            if (idx !== -1) target.splice(idx, 1);
          }),
        );
        markDirtyRoad(roadId);

        commandHistory.execute({
          id: uuidv4(),
          description: `Remove lane ${laneId} from road ${roadId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
            markDirtyRoad(roadId);
          },
        });
        syncUndoRedo();
      },

      updateLane: (
        roadId: string,
        sectionIdx: number,
        side: 'left' | 'right',
        laneId: number,
        updates: Partial<OdrLane>,
      ): void => {
        const doc = getDoc();
        const roadIdx = findRoadIndex(doc, roadId);
        if (roadIdx === -1) return;

        const prevDoc = structuredClone(doc);
        setDoc(
          produce(doc, (draft) => {
            const target = side === 'left'
              ? draft.roads[roadIdx].lanes[sectionIdx].leftLanes
              : draft.roads[roadIdx].lanes[sectionIdx].rightLanes;
            const lane = target.find((l) => l.id === laneId);
            if (lane) Object.assign(lane, updates);
          }),
        );
        markDirtyRoad(roadId);

        commandHistory.execute({
          id: uuidv4(),
          description: `Update lane ${laneId} on road ${roadId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
            markDirtyRoad(roadId);
          },
        });
        syncUndoRedo();
      },

      // --- Junction operations ---
      addJunction: (partial: Partial<OdrJunction>): OdrJunction => {
        const junction = createJunctionFromDefaults(
          partial.id ?? nextNumericId(getDoc().junctions.map((j) => j.id)),
          partial.name ?? '',
        );
        if (partial.type) junction.type = partial.type;
        if (partial.connections) junction.connections = partial.connections;

        const prevDoc = structuredClone(getDoc());
        setDoc(
          produce(getDoc(), (draft) => {
            draft.junctions.push(junction);
          }),
        );
        markDirtyJunction(junction.id);

        commandHistory.execute({
          id: uuidv4(),
          description: `Add junction: ${junction.name}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
            markDirtyJunction(junction.id);
          },
        });
        syncUndoRedo();
        return junction;
      },

      removeJunction: (junctionId: string): void => {
        const prevDoc = structuredClone(getDoc());
        setDoc(
          produce(getDoc(), (draft) => {
            const idx = draft.junctions.findIndex((j) => j.id === junctionId);
            if (idx !== -1) draft.junctions.splice(idx, 1);
          }),
        );
        markDirtyJunction(junctionId);

        commandHistory.execute({
          id: uuidv4(),
          description: `Remove junction: ${junctionId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
            markDirtyJunction(junctionId);
          },
        });
        syncUndoRedo();
      },

      updateJunction: (junctionId: string, updates: Partial<OdrJunction>): void => {
        const doc = getDoc();
        const idx = doc.junctions.findIndex((j) => j.id === junctionId);
        if (idx === -1) return;
        const prevJunction = structuredClone(doc.junctions[idx]);
        setDoc(
          produce(doc, (draft) => {
            Object.assign(draft.junctions[idx], updates);
          }),
        );
        markDirtyJunction(junctionId);

        commandHistory.execute({
          id: uuidv4(),
          description: `Update junction: ${junctionId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(
              produce(getDoc(), (draft) => {
                const i = draft.junctions.findIndex((j) => j.id === junctionId);
                if (i !== -1) draft.junctions[i] = prevJunction;
              }),
            );
            markDirtyJunction(junctionId);
          },
        });
        syncUndoRedo();
      },

      addJunctionConnection: (
        junctionId: string,
        partial: Partial<OdrJunctionConnection>,
      ): OdrJunctionConnection => {
        const allConnIds = getDoc().junctions.flatMap((j) => j.connections.map((c) => c.id));
        const connection = createJunctionConnectionFromDefaults(
          partial.id ?? nextNumericId(allConnIds),
          partial.incomingRoad ?? '',
          partial.connectingRoad ?? '',
        );
        if (partial.contactPoint) connection.contactPoint = partial.contactPoint;
        if (partial.laneLinks) connection.laneLinks = partial.laneLinks;

        const prevDoc = structuredClone(getDoc());
        setDoc(
          produce(getDoc(), (draft) => {
            const junction = draft.junctions.find((j) => j.id === junctionId);
            if (junction) junction.connections.push(connection);
          }),
        );
        markDirtyJunction(junctionId);

        commandHistory.execute({
          id: uuidv4(),
          description: `Add connection to junction: ${junctionId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
            markDirtyJunction(junctionId);
          },
        });
        syncUndoRedo();
        return connection;
      },

      // --- Object operations ---
      addObject: (roadId: string, partial: Partial<OdrRoadObject>): OdrRoadObject => {
        const allObjectIds = getDoc().roads.flatMap((r) => r.objects.map((o) => o.id));
        const objectId = partial.id ?? nextNumericId(allObjectIds);
        const obj: OdrRoadObject = {
          s: 0,
          t: 0,
          ...partial,
          id: objectId,
        };

        const prevDoc = structuredClone(getDoc());
        setDoc(
          produce(getDoc(), (draft) => {
            const roadIdx = findRoadIndex(draft, roadId);
            if (roadIdx !== -1) draft.roads[roadIdx].objects.push(obj);
          }),
        );
        markDirtyRoad(roadId);

        commandHistory.execute({
          id: uuidv4(),
          description: `Add object ${obj.id} to road ${roadId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
            markDirtyRoad(roadId);
          },
        });
        syncUndoRedo();
        return obj;
      },

      removeObject: (roadId: string, objectId: string): void => {
        const prevDoc = structuredClone(getDoc());
        setDoc(
          produce(getDoc(), (draft) => {
            const roadIdx = findRoadIndex(draft, roadId);
            if (roadIdx !== -1) {
              const idx = draft.roads[roadIdx].objects.findIndex((o) => o.id === objectId);
              if (idx !== -1) draft.roads[roadIdx].objects.splice(idx, 1);
            }
          }),
        );
        markDirtyRoad(roadId);

        commandHistory.execute({
          id: uuidv4(),
          description: `Remove object ${objectId} from road ${roadId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
            markDirtyRoad(roadId);
          },
        });
        syncUndoRedo();
      },

      // --- Signal operations ---
      addSignal: (roadId: string, partial: Partial<OdrSignal>): OdrSignal => {
        const allSignalIds = getDoc().roads.flatMap((r) => r.signals.map((s) => s.id));
        const signalId = partial.id ?? nextNumericId(allSignalIds);
        const signal: OdrSignal = {
          ...createSignalFromDefaults(signalId),
          ...partial,
          id: signalId,
        };

        const prevDoc = structuredClone(getDoc());
        setDoc(
          produce(getDoc(), (draft) => {
            const roadIdx = findRoadIndex(draft, roadId);
            if (roadIdx !== -1) draft.roads[roadIdx].signals.push(signal);
          }),
        );
        markDirtyRoad(roadId);

        commandHistory.execute({
          id: uuidv4(),
          description: `Add signal ${signal.id} to road ${roadId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
            markDirtyRoad(roadId);
          },
        });
        syncUndoRedo();
        return signal;
      },

      removeSignal: (roadId: string, signalId: string): void => {
        const prevDoc = structuredClone(getDoc());
        setDoc(
          produce(getDoc(), (draft) => {
            const roadIdx = findRoadIndex(draft, roadId);
            if (roadIdx !== -1) {
              const idx = draft.roads[roadIdx].signals.findIndex((s) => s.id === signalId);
              if (idx !== -1) draft.roads[roadIdx].signals.splice(idx, 1);
            }
          }),
        );
        markDirtyRoad(roadId);

        commandHistory.execute({
          id: uuidv4(),
          description: `Remove signal ${signalId} from road ${roadId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
            markDirtyRoad(roadId);
          },
        });
        syncUndoRedo();
      },

      updateSignal: (roadId: string, signalId: string, updates: Partial<OdrSignal>): void => {
        const prevDoc = structuredClone(getDoc());
        setDoc(
          produce(getDoc(), (draft) => {
            const roadIdx = findRoadIndex(draft, roadId);
            if (roadIdx !== -1) {
              const signal = draft.roads[roadIdx].signals.find((s) => s.id === signalId);
              if (signal) Object.assign(signal, updates);
            }
          }),
        );
        markDirtyRoad(roadId);

        commandHistory.execute({
          id: uuidv4(),
          description: `Update signal ${signalId} on road ${roadId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
            markDirtyRoad(roadId);
          },
        });
        syncUndoRedo();
      },

      // --- Controller operations ---
      addController: (partial: Partial<OdrController>): OdrController => {
        const controller = createControllerFromDefaults(
          partial.id ?? nextNumericId(getDoc().controllers.map((c) => c.id)),
          partial.name ?? '',
        );
        if (partial.sequence !== undefined) controller.sequence = partial.sequence;
        if (partial.controls) controller.controls = partial.controls;

        const prevDoc = structuredClone(getDoc());
        setDoc(
          produce(getDoc(), (draft) => {
            draft.controllers.push(controller);
          }),
        );

        commandHistory.execute({
          id: uuidv4(),
          description: `Add controller: ${controller.name}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
          },
        });
        syncUndoRedo();
        return controller;
      },

      removeController: (controllerId: string): void => {
        const prevDoc = structuredClone(getDoc());
        setDoc(
          produce(getDoc(), (draft) => {
            const idx = draft.controllers.findIndex((c) => c.id === controllerId);
            if (idx !== -1) draft.controllers.splice(idx, 1);
          }),
        );

        commandHistory.execute({
          id: uuidv4(),
          description: `Remove controller: ${controllerId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
          },
        });
        syncUndoRedo();
      },

      updateController: (controllerId: string, updates: Partial<OdrController>): void => {
        const prevDoc = structuredClone(getDoc());
        setDoc(
          produce(getDoc(), (draft) => {
            const controller = draft.controllers.find((c) => c.id === controllerId);
            if (controller) Object.assign(controller, updates);
          }),
        );

        commandHistory.execute({
          id: uuidv4(),
          description: `Update controller: ${controllerId}`,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(prevDoc);
          },
        });
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
        batchDescription = description;
        batchSnapshot = structuredClone(getDoc());
        batchUndoStackSize = commandHistory.getUndoStack().length;
      },

      endBatch: (): void => {
        if (!batchSnapshot) return;

        const snapshot = batchSnapshot;
        const commandsAdded =
          commandHistory.getUndoStack().length - batchUndoStackSize;

        // Collapse all individual commands added during the batch
        // into a single undo entry that restores the pre-batch snapshot.
        commandHistory.collapseUndo(commandsAdded, {
          id: uuidv4(),
          description: batchDescription,
          execute: () => { /* already executed */ },
          undo: () => {
            setDoc(snapshot);
          },
        });
        syncUndoRedo();

        batchSnapshot = null;
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
    };
  });

  return store;
}

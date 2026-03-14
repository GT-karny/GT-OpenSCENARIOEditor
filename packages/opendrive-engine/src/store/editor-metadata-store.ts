/**
 * Zustand vanilla store for editor-specific metadata.
 *
 * This store manages virtual roads and junction metadata that are NOT part
 * of the OpenDRIVE standard. It works alongside the OpenDriveStore.
 */

import { createStore } from 'zustand/vanilla';
import type {
  EditorMetadata,
  VirtualRoad,
  JunctionMetadata,
  JunctionSettings,
  LaneRoutingConfig,
} from './editor-metadata-types.js';
import { createDefaultEditorMetadata } from './editor-metadata-types.js';

export interface EditorMetadataState {
  metadata: EditorMetadata;
}

export interface EditorMetadataStore extends EditorMetadataState {
  // Document operations
  loadMetadata(metadata: EditorMetadata): void;
  resetMetadata(): void;
  getMetadata(): EditorMetadata;

  // Virtual road operations
  addVirtualRoad(virtualRoad: VirtualRoad): void;
  removeVirtualRoad(virtualRoadId: string): void;
  updateVirtualRoadSegments(virtualRoadId: string, segmentRoadIds: string[]): void;
  findVirtualRoadBySegment(roadId: string): VirtualRoad | undefined;

  // Junction metadata operations
  addJunctionMetadata(meta: JunctionMetadata): void;
  removeJunctionMetadata(junctionId: string): void;
  getJunctionMetadata(junctionId: string): JunctionMetadata | undefined;
  updateJunctionMetadata(junctionId: string, updates: Partial<JunctionMetadata>): void;

  // Settings
  updateSettings(updates: Partial<JunctionSettings>): void;
  updateLaneRouting(updates: Partial<LaneRoutingConfig>): void;
}

export function createEditorMetadataStore() {
  return createStore<EditorMetadataStore>()((set, get) => ({
    metadata: createDefaultEditorMetadata(),

    // --- Document operations ---
    loadMetadata: (metadata: EditorMetadata): void => {
      set({ metadata });
    },

    resetMetadata: (): void => {
      set({ metadata: createDefaultEditorMetadata() });
    },

    getMetadata: (): EditorMetadata => get().metadata,

    // --- Virtual road operations ---
    addVirtualRoad: (virtualRoad: VirtualRoad): void => {
      set((state) => ({
        metadata: {
          ...state.metadata,
          virtualRoads: [...state.metadata.virtualRoads, virtualRoad],
        },
      }));
    },

    removeVirtualRoad: (virtualRoadId: string): void => {
      set((state) => ({
        metadata: {
          ...state.metadata,
          virtualRoads: state.metadata.virtualRoads.filter(
            (vr) => vr.virtualRoadId !== virtualRoadId,
          ),
        },
      }));
    },

    updateVirtualRoadSegments: (virtualRoadId: string, segmentRoadIds: string[]): void => {
      set((state) => ({
        metadata: {
          ...state.metadata,
          virtualRoads: state.metadata.virtualRoads.map((vr) =>
            vr.virtualRoadId === virtualRoadId ? { ...vr, segmentRoadIds } : vr,
          ),
        },
      }));
    },

    findVirtualRoadBySegment: (roadId: string): VirtualRoad | undefined => {
      return get().metadata.virtualRoads.find((vr) => vr.segmentRoadIds.includes(roadId));
    },

    // --- Junction metadata operations ---
    addJunctionMetadata: (meta: JunctionMetadata): void => {
      set((state) => ({
        metadata: {
          ...state.metadata,
          junctionMetadata: [...state.metadata.junctionMetadata, meta],
        },
      }));
    },

    removeJunctionMetadata: (junctionId: string): void => {
      set((state) => ({
        metadata: {
          ...state.metadata,
          junctionMetadata: state.metadata.junctionMetadata.filter(
            (m) => m.junctionId !== junctionId,
          ),
        },
      }));
    },

    getJunctionMetadata: (junctionId: string): JunctionMetadata | undefined => {
      return get().metadata.junctionMetadata.find((m) => m.junctionId === junctionId);
    },

    updateJunctionMetadata: (junctionId: string, updates: Partial<JunctionMetadata>): void => {
      set((state) => ({
        metadata: {
          ...state.metadata,
          junctionMetadata: state.metadata.junctionMetadata.map((m) =>
            m.junctionId === junctionId ? { ...m, ...updates } : m,
          ),
        },
      }));
    },

    // --- Settings ---
    updateSettings: (updates: Partial<JunctionSettings>): void => {
      set((state) => ({
        metadata: {
          ...state.metadata,
          settings: { ...state.metadata.settings, ...updates },
        },
      }));
    },

    updateLaneRouting: (updates: Partial<LaneRoutingConfig>): void => {
      set((state) => ({
        metadata: {
          ...state.metadata,
          settings: {
            ...state.metadata.settings,
            laneRouting: { ...state.metadata.settings.laneRouting, ...updates },
          },
        },
      }));
    },
  }));
}

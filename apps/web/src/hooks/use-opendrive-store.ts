/**
 * React-compatible Zustand hooks for the OpenDRIVE editor.
 * - useOpenDriveStore / useOpenDriveStoreApi: vanilla store wrapper (opendrive-engine)
 * - useOdrSidebarStore: sidebar UI state (selection, search)
 * - useOdrRoads / useOdrJunctions / useOdrSignals: derived data selectors
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { createOpenDriveStore } from '@osce/opendrive-engine';
import type { OpenDriveStore } from '@osce/opendrive-engine';
import type { OpenDriveDocument, OdrRoad, OdrJunction, OdrSignal } from '@osce/shared';
import { useEditorStore } from '../stores/editor-store';

// ---- OpenDrive Engine Store (vanilla store wrapper) ----

let storeInstance: ReturnType<typeof createOpenDriveStore> | null = null;

export function getOpenDriveStoreApi() {
  if (!storeInstance) {
    storeInstance = createOpenDriveStore();
  }
  return storeInstance;
}

/** Get the raw vanilla store API (for non-React usage or subscriptions) */
export function useOpenDriveStoreApi() {
  return useMemo(() => getOpenDriveStoreApi(), []);
}

/** React hook to select state from the OpenDrive store */
export function useOpenDriveStore<T>(selector: (state: OpenDriveStore) => T): T {
  const api = getOpenDriveStoreApi();
  return useStore(api, selector);
}

// ---- Sidebar UI State ----

interface OdrSidebarSelection {
  type: 'road' | 'junction' | 'signal' | null;
  id: string | null;
  roadId?: string;
}

export type RoadToolMode = 'select' | 'road-create';

export interface RoadCreationState {
  phase: 'idle' | 'startPlaced';
  startX: number;
  startY: number;
  startHdg: number;
  startSnap?: { roadId: string; contactPoint: 'start' | 'end' };
  selectedPreset: string;
  /** Live cursor position during creation (updated on mouse move) */
  cursorX: number;
  cursorY: number;
}

const DEFAULT_ROAD_CREATION: RoadCreationState = {
  phase: 'idle',
  startX: 0,
  startY: 0,
  startHdg: 0,
  selectedPreset: '2-lane',
  cursorX: 0,
  cursorY: 0,
};

interface OpenDriveSidebarState {
  selection: OdrSidebarSelection;
  setSelection: (sel: OdrSidebarSelection) => void;
  clearSelection: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Road editing toolbar
  activeTool: RoadToolMode;
  setActiveTool: (tool: RoadToolMode) => void;

  // Road creation state machine
  roadCreation: RoadCreationState;
  setRoadCreationStart: (
    x: number,
    y: number,
    hdg: number,
    snap?: { roadId: string; contactPoint: 'start' | 'end' },
  ) => void;
  resetRoadCreation: () => void;
  setSelectedPreset: (name: string) => void;
  setRoadCreationCursor: (x: number, y: number) => void;
}

export const useOdrSidebarStore = create<OpenDriveSidebarState>()((set) => ({
  selection: { type: null, id: null },
  setSelection: (sel) => set({ selection: sel }),
  clearSelection: () => set({ selection: { type: null, id: null } }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Road editing toolbar
  activeTool: 'select' as RoadToolMode,
  setActiveTool: (tool) =>
    set((state) => ({
      activeTool: tool,
      // Reset creation state when switching tools
      roadCreation: tool !== 'road-create' ? DEFAULT_ROAD_CREATION : state.roadCreation,
    })),

  // Road creation state machine
  roadCreation: DEFAULT_ROAD_CREATION,
  setRoadCreationStart: (x, y, hdg, snap) =>
    set((state) => ({
      roadCreation: {
        ...state.roadCreation,
        phase: 'startPlaced' as const,
        startX: x,
        startY: y,
        startHdg: hdg,
        startSnap: snap,
      },
    })),
  resetRoadCreation: () =>
    set((state) => ({
      roadCreation: { ...DEFAULT_ROAD_CREATION, selectedPreset: state.roadCreation.selectedPreset },
    })),
  setSelectedPreset: (name) =>
    set((state) => ({
      roadCreation: { ...state.roadCreation, selectedPreset: name },
    })),
  setRoadCreationCursor: (x, y) =>
    set((state) => ({
      roadCreation: { ...state.roadCreation, cursorX: x, cursorY: y },
    })),
}));

// ---- Derived Data Selectors ----

const EMPTY_ROADS: OdrRoad[] = [];
const EMPTY_JUNCTIONS: OdrJunction[] = [];

export function useOdrRoads(): OdrRoad[] {
  return useEditorStore(useShallow((s) => s.roadNetwork?.roads ?? EMPTY_ROADS));
}

export function useOdrJunctions(): OdrJunction[] {
  return useEditorStore(useShallow((s) => s.roadNetwork?.junctions ?? EMPTY_JUNCTIONS));
}

export function useOdrSignals(): Array<OdrSignal & { roadId: string; roadName: string }> {
  const roads = useOdrRoads();
  return useMemo(() => {
    const result: Array<OdrSignal & { roadId: string; roadName: string }> = [];
    for (const road of roads) {
      for (const signal of road.signals) {
        result.push({
          ...signal,
          roadId: road.id,
          roadName: road.name || `Road ${road.id}`,
        });
      }
    }
    return result;
  }, [roads]);
}

export function useOdrDocument(): OpenDriveDocument | null {
  return useEditorStore((s) => s.roadNetwork);
}

export function countRoadLanes(road: OdrRoad): number {
  if (road.lanes.length === 0) return 0;
  const section = road.lanes[0];
  return section.leftLanes.length + section.rightLanes.length;
}

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

export type RoadToolMode = 'select' | 'road-create' | 'lane-edit';

export type LaneEditSubMode = 'select' | 'split' | 'taper';
export type TaperDirection = 'narrow-to-wide' | 'wide-to-narrow';
export type TaperPosition = 'outer' | 'inner';

export interface TaperCreationState {
  phase: 'idle' | 'start-picked' | 'end-picked' | 'lane-extend';
  startS: number;
  endS: number;
  side: 'left' | 'right';
}

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

export interface LaneEditHoverInfo {
  roadId: string;
  sectionIdx: number;
  laneId: number;
  s: number;
  side: 'left' | 'right';
  /** Screen-space coordinates for tooltip positioning */
  screenX: number;
  screenY: number;
}

export interface GhostPreviewInfo {
  roadId: string;
  sectionIdx: number;
  side: 'left' | 'right';
  /** 'outer' = outside of outermost lane, 'inner' = between existing lanes */
  position: 'outer' | 'inner';
  insertAfterLaneId?: number;
}

export interface LaneEditState {
  activeRoadId: string | null;
  selectedSectionIndices: number[];
  hoveredLane: LaneEditHoverInfo | null;
  ghostPreview: GhostPreviewInfo | null;
  taperLength: number;
  useLaneOffset: boolean;
  subMode: LaneEditSubMode;
  taperDirection: TaperDirection;
  taperPosition: TaperPosition;
  taperCreation: TaperCreationState;
}

const DEFAULT_TAPER_CREATION: TaperCreationState = {
  phase: 'idle',
  startS: 0,
  endS: 0,
  side: 'right',
};

const DEFAULT_LANE_EDIT: LaneEditState = {
  activeRoadId: null,
  selectedSectionIndices: [],
  hoveredLane: null,
  ghostPreview: null,
  taperLength: 30,
  useLaneOffset: false,
  subMode: 'select',
  taperDirection: 'narrow-to-wide',
  taperPosition: 'outer' as TaperPosition,
  taperCreation: DEFAULT_TAPER_CREATION,
};

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

  // Lane edit state
  laneEdit: LaneEditState;
  resetLaneEdit: () => void;
  setLaneEditRoad: (roadId: string | null) => void;
  setLaneEditHover: (hover: LaneEditHoverInfo | null) => void;
  setLaneEditGhostPreview: (ghost: GhostPreviewInfo | null) => void;
  setSelectedSections: (indices: number[]) => void;
  toggleSectionSelection: (index: number) => void;
  setTaperLength: (length: number) => void;
  setUseLaneOffset: (use: boolean) => void;
  setLaneEditSubMode: (mode: LaneEditSubMode) => void;
  setTaperDirection: (dir: TaperDirection) => void;
  setTaperPosition: (pos: TaperPosition) => void;
  setTaperCreation: (state: Partial<TaperCreationState>) => void;
  resetTaperCreation: () => void;
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
      // Reset lane edit state when switching away from lane-edit
      laneEdit: tool !== 'lane-edit' ? DEFAULT_LANE_EDIT : state.laneEdit,
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

  // Lane edit state
  laneEdit: DEFAULT_LANE_EDIT,
  resetLaneEdit: () => set({ laneEdit: DEFAULT_LANE_EDIT }),
  setLaneEditRoad: (roadId) =>
    set((state) => ({
      laneEdit: {
        ...DEFAULT_LANE_EDIT,
        activeRoadId: roadId,
        taperLength: state.laneEdit.taperLength,
        useLaneOffset: state.laneEdit.useLaneOffset,
        subMode: state.laneEdit.subMode,
        taperDirection: state.laneEdit.taperDirection,
        taperPosition: state.laneEdit.taperPosition,
        taperCreation: state.laneEdit.taperCreation,
      },
    })),
  setLaneEditHover: (hover) =>
    set((state) => ({ laneEdit: { ...state.laneEdit, hoveredLane: hover } })),
  setLaneEditGhostPreview: (ghost) =>
    set((state) => ({ laneEdit: { ...state.laneEdit, ghostPreview: ghost } })),
  setSelectedSections: (indices) =>
    set((state) => ({ laneEdit: { ...state.laneEdit, selectedSectionIndices: indices } })),
  toggleSectionSelection: (index) =>
    set((state) => {
      const current = state.laneEdit.selectedSectionIndices;
      const next = current.includes(index)
        ? current.filter((i) => i !== index)
        : [...current, index];
      return { laneEdit: { ...state.laneEdit, selectedSectionIndices: next } };
    }),
  setTaperLength: (length) =>
    set((state) => ({ laneEdit: { ...state.laneEdit, taperLength: length } })),
  setUseLaneOffset: (use) =>
    set((state) => ({ laneEdit: { ...state.laneEdit, useLaneOffset: use } })),
  setLaneEditSubMode: (mode) =>
    set((state) => ({
      laneEdit: { ...state.laneEdit, subMode: mode, taperCreation: DEFAULT_TAPER_CREATION },
    })),
  setTaperDirection: (dir) =>
    set((state) => ({ laneEdit: { ...state.laneEdit, taperDirection: dir } })),
  setTaperPosition: (pos) =>
    set((state) => ({ laneEdit: { ...state.laneEdit, taperPosition: pos } })),
  setTaperCreation: (partial) =>
    set((state) => ({
      laneEdit: { ...state.laneEdit, taperCreation: { ...state.laneEdit.taperCreation, ...partial } },
    })),
  resetTaperCreation: () =>
    set((state) => ({ laneEdit: { ...state.laneEdit, taperCreation: DEFAULT_TAPER_CREATION } })),
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

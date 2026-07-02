/**
 * Lane-editing tools for the road-network editor.
 *
 * Owns the lane-edit store state/setters used by the viewer, the lane and
 * road-section context menus, and the full set of lane operations: hover/click
 * add, context-menu add/delete, section split + boundary drag, and taper
 * creation. Section-index lookups go through {@link findLaneSectionIndexAtS}
 * and taper direction resolution through {@link resolveTaperSDirection}.
 */

import { useCallback, useState } from 'react';
import type { StoreApi } from 'zustand';
import type { OdrRoad } from '@osce/shared';
import type { OpenDriveStore } from '@osce/opendrive-engine';
import {
  addLaneToSection,
  removeLaneFromSection,
  splitLaneSectionAt,
  moveSectionBoundary,
  createTaperAtRange,
  resolveTaperSDirection,
} from '@osce/opendrive-engine';
import { findLaneSectionIndexAtS } from '@osce/opendrive';
import { useOdrSidebarStore } from '../use-opendrive-store';

interface UseLaneToolsParams {
  odrStoreApi: StoreApi<OpenDriveStore>;
  roads: readonly OdrRoad[];
  /** Update the property-editor lane selection when a lane context menu opens. */
  setSelectedLaneId: (laneId: number | null) => void;
  setSelectedLaneSectionIdx: (idx: number | null) => void;
}

export interface LaneContextMenuState {
  roadId: string;
  sectionIdx: number;
  laneId: number;
  side: 'left' | 'right';
  screenX: number;
  screenY: number;
}

export interface RoadSectionContextMenuState {
  roadId: string;
  s: number;
  sectionIdx: number;
  screenX: number;
  screenY: number;
}

export interface UseLaneToolsResult {
  laneContextMenu: LaneContextMenuState | null;
  setLaneContextMenu: (menu: LaneContextMenuState | null) => void;
  roadSectionContextMenu: RoadSectionContextMenuState | null;
  setRoadSectionContextMenu: (menu: RoadSectionContextMenuState | null) => void;
  handleLaneHover: (
    info: {
      roadId: string;
      sectionIdx: number;
      laneId: number;
      s: number;
      side: 'left' | 'right';
      screenX: number;
      screenY: number;
    } | null,
  ) => void;
  handleLaneClick: (info: {
    roadId: string;
    sectionIdx: number;
    laneId: number;
    s: number;
    side: 'left' | 'right';
  }) => void;
  handleLaneContextMenu: (
    info: { roadId: string; sectionIdx: number; laneId: number; side: 'left' | 'right' },
    screenX: number,
    screenY: number,
  ) => void;
  handleRoadSurfaceContextMenu: (
    roadId: string,
    s: number,
    screenX: number,
    screenY: number,
  ) => void;
  handleAddLaneLeft: () => void;
  handleAddLaneRight: () => void;
  handleDeleteLane: () => void;
  handleSplitSection: () => void;
  handleSectionBoundaryDragEnd: (roadId: string, sectionIdx: number, newS: number) => void;
  handleSplitClick: (roadId: string, sectionIdx: number, s: number) => void;
  handleTaperClick: (roadId: string, s: number, side: 'left' | 'right') => void;
}

export function useLaneTools({
  odrStoreApi,
  roads,
  setSelectedLaneId,
  setSelectedLaneSectionIdx,
}: UseLaneToolsParams): UseLaneToolsResult {
  const laneEdit = useOdrSidebarStore((s) => s.laneEdit);
  const setLaneEditHover = useOdrSidebarStore((s) => s.setLaneEditHover);
  const setLaneEditRoad = useOdrSidebarStore((s) => s.setLaneEditRoad);
  const setSelectedSections = useOdrSidebarStore((s) => s.setSelectedSections);
  const setTaperCreation = useOdrSidebarStore((s) => s.setTaperCreation);
  const resetTaperCreation = useOdrSidebarStore((s) => s.resetTaperCreation);

  const taperCreation = laneEdit.taperCreation;
  const taperDirection = laneEdit.taperDirection;
  const taperPosition = laneEdit.taperPosition;

  const [laneContextMenu, setLaneContextMenu] = useState<LaneContextMenuState | null>(null);
  const [roadSectionContextMenu, setRoadSectionContextMenu] =
    useState<RoadSectionContextMenuState | null>(null);

  const handleLaneHover = useCallback(
    (
      info: {
        roadId: string;
        sectionIdx: number;
        laneId: number;
        s: number;
        side: 'left' | 'right';
        screenX: number;
        screenY: number;
      } | null,
    ) => {
      if (!info) {
        setLaneEditHover(null);
        return;
      }
      setLaneEditHover({
        roadId: info.roadId,
        sectionIdx: info.sectionIdx,
        laneId: info.laneId,
        s: info.s,
        side: info.side,
        screenX: info.screenX,
        screenY: info.screenY,
      });
      // Auto-select road when hovering
      if (!laneEdit.activeRoadId || laneEdit.activeRoadId !== info.roadId) {
        setLaneEditRoad(info.roadId);
      }
      // Auto-select section
      if (!laneEdit.selectedSectionIndices.includes(info.sectionIdx)) {
        setSelectedSections([info.sectionIdx]);
      }
    },
    [
      setLaneEditHover,
      setLaneEditRoad,
      laneEdit.activeRoadId,
      laneEdit.selectedSectionIndices,
      setSelectedSections,
    ],
  );

  const handleLaneClick = useCallback(
    (info: {
      roadId: string;
      sectionIdx: number;
      laneId: number;
      s: number;
      side: 'left' | 'right';
    }) => {
      // Add lane at clicked position
      const store = odrStoreApi.getState();
      addLaneToSection(store, info.roadId, info.sectionIdx, info.side, {
        taperLength: laneEdit.taperLength,
        useLaneOffset: laneEdit.useLaneOffset,
      });
      // Store sync is automatic via subscription
    },
    [odrStoreApi, laneEdit.taperLength, laneEdit.useLaneOffset],
  );

  const handleLaneContextMenu = useCallback(
    (
      info: { roadId: string; sectionIdx: number; laneId: number; side: 'left' | 'right' },
      screenX: number,
      screenY: number,
    ) => {
      setLaneContextMenu({
        roadId: info.roadId,
        sectionIdx: info.sectionIdx,
        laneId: info.laneId,
        side: info.side,
        screenX,
        screenY,
      });
      // Also update lane selection for the property editor
      setSelectedLaneId(info.laneId);
      setSelectedLaneSectionIdx(info.sectionIdx);
    },
    [setSelectedLaneId, setSelectedLaneSectionIdx],
  );

  const handleRoadSurfaceContextMenu = useCallback(
    (roadId: string, s: number, screenX: number, screenY: number) => {
      const road = roads.find((r) => r.id === roadId);
      if (!road) return;
      const sectionIdx = findLaneSectionIndexAtS(road.lanes, s);
      setRoadSectionContextMenu({ roadId, s, sectionIdx, screenX, screenY });
    },
    [roads],
  );

  const handleAddLaneLeft = useCallback(() => {
    if (!laneContextMenu) return;
    const store = odrStoreApi.getState();
    addLaneToSection(store, laneContextMenu.roadId, laneContextMenu.sectionIdx, 'left', {
      taperLength: laneEdit.taperLength,
    });
    // Store sync is automatic via subscription
    setLaneContextMenu(null);
  }, [odrStoreApi, laneContextMenu, laneEdit.taperLength]);

  const handleAddLaneRight = useCallback(() => {
    if (!laneContextMenu) return;
    const store = odrStoreApi.getState();
    addLaneToSection(store, laneContextMenu.roadId, laneContextMenu.sectionIdx, 'right', {
      taperLength: laneEdit.taperLength,
    });
    // Store sync is automatic via subscription
    setLaneContextMenu(null);
  }, [odrStoreApi, laneContextMenu, laneEdit.taperLength]);

  const handleDeleteLane = useCallback(() => {
    if (!laneContextMenu) return;
    const store = odrStoreApi.getState();
    removeLaneFromSection(
      store,
      laneContextMenu.roadId,
      laneContextMenu.sectionIdx,
      laneContextMenu.side,
      laneContextMenu.laneId,
      { taperLength: laneEdit.taperLength },
    );
    // Store sync is automatic via subscription
    setLaneContextMenu(null);
  }, [odrStoreApi, laneContextMenu, laneEdit.taperLength]);

  const handleSplitSection = useCallback(() => {
    if (!roadSectionContextMenu) return;
    const store = odrStoreApi.getState();
    splitLaneSectionAt(
      store,
      roadSectionContextMenu.roadId,
      roadSectionContextMenu.sectionIdx,
      roadSectionContextMenu.s,
    );
    // Store sync is automatic via subscription
    setRoadSectionContextMenu(null);
  }, [odrStoreApi, roadSectionContextMenu]);

  const handleSectionBoundaryDragEnd = useCallback(
    (roadId: string, sectionIdx: number, newS: number) => {
      const store = odrStoreApi.getState();
      moveSectionBoundary(store, roadId, sectionIdx, newS);
      // Store sync is automatic via subscription
    },
    [odrStoreApi],
  );

  const handleSplitClick = useCallback(
    (roadId: string, sectionIdx: number, s: number) => {
      const store = odrStoreApi.getState();
      splitLaneSectionAt(store, roadId, sectionIdx, s);
    },
    [odrStoreApi],
  );

  const handleTaperClick = useCallback(
    (roadId: string, s: number, side: 'left' | 'right') => {
      if (taperCreation.phase === 'idle') {
        // First click: pick the taper start point
        setTaperCreation({ phase: 'start-picked', startS: s, side });
      } else if (taperCreation.phase === 'start-picked') {
        // Second click: pick the taper end point, then create the taper
        const startS = Math.min(taperCreation.startS, s);
        const endS = Math.max(taperCreation.startS, s);
        if (endS - startS < 1) return;

        // Left lanes travel opposite to s-direction, so the driver-perspective
        // taper direction is flipped to road (increasing-s) coordinates. Pass
        // 'RHT' explicitly; LHT wiring lands in a later wave.
        const effectiveDirection = resolveTaperSDirection(
          taperCreation.side,
          taperDirection,
          'RHT',
        );

        const store = odrStoreApi.getState();
        createTaperAtRange(
          store,
          roadId,
          startS,
          endS,
          taperCreation.side,
          effectiveDirection,
          taperPosition,
          laneEdit.useLaneOffset,
        );
        resetTaperCreation();
      }
    },
    [
      odrStoreApi,
      taperCreation,
      taperDirection,
      taperPosition,
      laneEdit.useLaneOffset,
      setTaperCreation,
      resetTaperCreation,
    ],
  );

  return {
    laneContextMenu,
    setLaneContextMenu,
    roadSectionContextMenu,
    setRoadSectionContextMenu,
    handleLaneHover,
    handleLaneClick,
    handleLaneContextMenu,
    handleRoadSurfaceContextMenu,
    handleAddLaneLeft,
    handleAddLaneRight,
    handleDeleteLane,
    handleSplitSection,
    handleSectionBoundaryDragEnd,
    handleSplitClick,
    handleTaperClick,
  };
}

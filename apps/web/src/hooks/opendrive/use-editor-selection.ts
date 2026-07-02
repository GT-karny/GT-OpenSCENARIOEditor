/**
 * Selection state for the road-network editor.
 *
 * Derives the sidebar-selection ids (road/junction/signal), resolves the
 * selected road and its active lane section from the current s-position, and
 * owns the local lane/geometry/tab/hover selection state along with the
 * road-change reset effects. Extracted from RoadNetworkEditorLayout so the
 * component stays thin.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OdrRoad } from '@osce/shared';
import { findLaneSectionIndexAtS } from '@osce/opendrive';
import { useOdrSidebarStore } from '../use-opendrive-store';

export type CenterTab = 'crossSection' | 'elevation' | 'laneLinks';

interface UseEditorSelectionParams {
  roads: readonly OdrRoad[];
}

export interface UseEditorSelectionResult {
  // Sidebar-derived ids
  selectedRoadId: string | null;
  selectedJunctionId: string | null;
  selectedSignalId: string | null;
  selectedSignalKey: string | null;
  // Resolved road + active section
  selectedRoad: OdrRoad | null;
  activeLaneSectionIdx: number;
  activeLaneSection: OdrRoad['lanes'][number] | null;
  dsFromSectionStart: number;
  // Local selection state
  selectedLaneId: number | null;
  setSelectedLaneId: (laneId: number | null) => void;
  selectedLaneSectionIdx: number | null;
  setSelectedLaneSectionIdx: (idx: number | null) => void;
  centerTab: CenterTab;
  setCenterTab: (tab: CenterTab) => void;
  sPosition: number;
  setSPosition: (s: number) => void;
  hoveredRoadId: string | null;
  hoveredRoadName: string | null;
  handleLaneSelect: (laneId: number) => void;
  handleSignalSelect: (key: string) => void;
  handleRoadSelect: (roadId: string) => void;
  handleRoadHover: (roadId: string | null) => void;
}

export function useEditorSelection({
  roads,
}: UseEditorSelectionParams): UseEditorSelectionResult {
  const sidebarSelection = useOdrSidebarStore((s) => s.selection);

  const selectedRoadId = useMemo(() => {
    if (sidebarSelection.type === 'road') return sidebarSelection.id;
    if (sidebarSelection.type === 'signal') return sidebarSelection.roadId ?? null;
    return null;
  }, [sidebarSelection]);

  const selectedJunctionId = sidebarSelection.type === 'junction' ? sidebarSelection.id : null;
  const selectedSignalId = sidebarSelection.type === 'signal' ? sidebarSelection.id : null;

  // Signal key for 3D viewer selection (roadId:signalId format)
  const selectedSignalKey = useMemo(() => {
    if (sidebarSelection.type !== 'signal' || !sidebarSelection.id || !sidebarSelection.roadId)
      return null;
    return `${sidebarSelection.roadId}:${sidebarSelection.id}`;
  }, [sidebarSelection]);

  // Handle signal click in 3D viewer
  const handleSignalSelect = useCallback((key: string) => {
    const idx = key.indexOf(':');
    if (idx < 0) return;
    const roadId = key.slice(0, idx);
    const signalId = key.slice(idx + 1);
    useOdrSidebarStore.getState().setSelection({ type: 'signal', id: signalId, roadId });
  }, []);

  // Lane-level selection (local state, reset when road changes)
  const [selectedLaneId, setSelectedLaneId] = useState<number | null>(null);
  const [selectedLaneSectionIdx, setSelectedLaneSectionIdx] = useState<number | null>(null);

  const [centerTab, setCenterTab] = useState<CenterTab>('crossSection');
  const [sPosition, setSPosition] = useState(0);

  // Reset lane selection + s-position when road changes
  useEffect(() => {
    setSelectedLaneId(null);
    setSelectedLaneSectionIdx(null);
    setSPosition(0);
  }, [selectedRoadId]);

  const selectedRoad = useMemo(
    () => roads.find((r) => r.id === selectedRoadId) ?? null,
    [roads, selectedRoadId],
  );

  // Compute active lane section index for current s-position
  const activeLaneSectionIdx = useMemo(() => {
    if (!selectedRoad) return 0;
    return findLaneSectionIndexAtS(selectedRoad.lanes, sPosition);
  }, [selectedRoad, sPosition]);

  const activeLaneSection = selectedRoad?.lanes[activeLaneSectionIdx] ?? null;
  const dsFromSectionStart = activeLaneSection ? sPosition - activeLaneSection.s : 0;

  // When s-position slider changes sections, sync the property editor section
  useEffect(() => {
    setSelectedLaneSectionIdx(null);
  }, [activeLaneSectionIdx]);

  const handleLaneSelect = useCallback(
    (laneId: number) => {
      setSelectedLaneId(laneId);
      // Use current cross-section's section index
      setSelectedLaneSectionIdx(activeLaneSectionIdx);
    },
    [activeLaneSectionIdx],
  );

  // --- Road hover in select mode ---
  const [hoveredRoadId, setHoveredRoadId] = useState<string | null>(null);

  const handleRoadHover = useCallback((roadId: string | null) => {
    setHoveredRoadId(roadId);
  }, []);

  const hoveredRoadName = useMemo(() => {
    if (!hoveredRoadId) return null;
    const road = roads.find((r) => r.id === hoveredRoadId);
    if (!road) return null;
    return road.name || `Road ${road.id}`;
  }, [hoveredRoadId, roads]);

  // --- Road click selection from 3D viewer ---
  const handleRoadSelect = useCallback((roadId: string) => {
    useOdrSidebarStore.getState().setSelection({ type: 'road', id: roadId });
  }, []);

  return {
    selectedRoadId,
    selectedJunctionId,
    selectedSignalId,
    selectedSignalKey,
    selectedRoad,
    activeLaneSectionIdx,
    activeLaneSection,
    dsFromSectionStart,
    selectedLaneId,
    setSelectedLaneId,
    selectedLaneSectionIdx,
    setSelectedLaneSectionIdx,
    centerTab,
    setCenterTab,
    sPosition,
    setSPosition,
    hoveredRoadId,
    hoveredRoadName,
    handleLaneSelect,
    handleSignalSelect,
    handleRoadSelect,
    handleRoadHover,
  };
}

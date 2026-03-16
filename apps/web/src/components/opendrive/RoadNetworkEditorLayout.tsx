import { useState, useCallback, useEffect, useMemo } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { OdrRoad, OdrRoadLinkElement, OdrLane, OdrSignal, OdrJunction, OdrHeader, OpenDriveDocument } from '@osce/shared';
import { createRoadFromPartial, syncLaneLinksForDirectConnections, clearLaneLinks } from '@osce/opendrive-engine';
import { ScenarioViewer } from '@osce/3d-viewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { ErrorBoundary } from '../ErrorBoundary';
import { OdrPropertyEditor } from './property/OdrPropertyEditor';
import { OdrSidebar } from './sidebar/OdrSidebar';
import { CrossSectionView } from './cross-section/CrossSectionView';
import { CrossSectionToolbar } from './cross-section/CrossSectionToolbar';
import { ElevationGraphEditor } from './elevation/ElevationGraphEditor';
import { RoadEndpointContextMenu } from './RoadEndpointContextMenu';
import { JunctionContextMenu } from './JunctionContextMenu';
import { LaneLinkEditor } from './lane-link/LaneLinkEditor';
import { RoadNetworkToolbar } from './toolbar/RoadNetworkToolbar';
import { RoadStylePanel } from './toolbar/RoadStylePanel';
import { useAutoJunctionDetection } from '../../hooks/use-auto-junction-detection';
import { evaluateReferenceLineAtS } from '@osce/opendrive';
import {
  generateConnectingRoads,
  computeRoadEndpoint,
  createDefaultLaneRoutingConfig,
  DEFAULT_PRESETS,
} from '@osce/opendrive-engine';
import { computeAutoArc, computeGeometryEndpoint } from '@osce/3d-viewer';
import { ValidationPanel } from '../panels/ValidationPanel';
import { useEditorStore } from '../../stores/editor-store';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import {
  useOpenDriveStore,
  useOpenDriveStoreApi,
  useOdrSidebarStore,
} from '../../hooks/use-opendrive-store';
import { editorMetadataStoreApi } from '../../stores/editor-metadata-store-instance';

function ResizeHandle() {
  return (
    <PanelResizeHandle className="w-[1px] divider-glow-v hover:w-[3px] transition-all data-[resize-handle-active]:w-[3px]" />
  );
}

function ResizeHandleH() {
  return (
    <PanelResizeHandle className="h-[1px] divider-glow hover:h-[3px] transition-all data-[resize-handle-active]:h-[3px]" />
  );
}

export function RoadNetworkEditorLayout() {
  const roadNetwork = useEditorStore((s) => s.roadNetwork);
  const scenarioStoreApi = useScenarioStoreApi();
  const odrStoreApi = useOpenDriveStoreApi();
  const odrDocument = useOpenDriveStore((s) => s.document);
  const preferences = useEditorStore((s) => s.preferences);

  // Sync roadNetwork from editorStore → openDriveStore on mode entry
  useEffect(() => {
    if (roadNetwork) {
      const store = odrStoreApi.getState();
      store.loadDocument(roadNetwork);

      // Ensure lane-level links exist for all direct road-to-road connections.
      // Imported xodr files (especially from third-party tools) may omit these.
      const allRoadIds = roadNetwork.roads.map((r) => r.id);
      syncLaneLinksForDirectConnections(store, allRoadIds);
    }
  }, []); // Only on mount

  // Sync openDriveStore → editorStore.roadNetwork reactively + dirty tracking
  useEffect(() => {
    let prevDoc = odrStoreApi.getState().document;
    const unsub = odrStoreApi.subscribe((state: { document: OpenDriveDocument }) => {
      useEditorStore.getState().setRoadNetwork(state.document);
      if (state.document !== prevDoc) {
        prevDoc = state.document;
        useEditorStore.getState().setRoadNetworkDirty(true);
      }
    });
    return unsub;
  }, [odrStoreApi]);

  // --- Selection from sidebar store ---
  const sidebarSelection = useOdrSidebarStore((s) => s.selection);

  const selectedRoadId = useMemo(() => {
    if (sidebarSelection.type === 'road') return sidebarSelection.id;
    if (sidebarSelection.type === 'signal') return sidebarSelection.roadId ?? null;
    return null;
  }, [sidebarSelection]);

  const selectedJunctionId =
    sidebarSelection.type === 'junction' ? sidebarSelection.id : null;
  const selectedSignalId =
    sidebarSelection.type === 'signal' ? sidebarSelection.id : null;

  // Lane-level selection (local state, reset when road changes)
  const [selectedLaneId, setSelectedLaneId] = useState<number | null>(null);
  const [selectedGeometryIndex, setSelectedGeometryIndex] = useState<number | null>(null);
  const [selectedGeometryIndices, setSelectedGeometryIndices] = useState<Set<number>>(new Set());

  // Reset lane/geometry selection when road changes
  useEffect(() => {
    setSelectedLaneId(null);
    setSelectedGeometryIndex(null);
    setSelectedGeometryIndices(new Set());
  }, [selectedRoadId]);

  const [centerTab, setCenterTab] = useState<'crossSection' | 'elevation' | 'laneLinks'>('crossSection');
  const [sPosition, setSPosition] = useState(0);

  // Road editing toolbar state from store
  const activeTool = useOdrSidebarStore((s) => s.activeTool);
  const roadCreation = useOdrSidebarStore((s) => s.roadCreation);
  const roadCreationMode = activeTool === 'road-create';

  // Auto-junction detection on road geometry changes
  const { checkForIntersections } = useAutoJunctionDetection({
    enabled: true,
    odrStoreApi,
    editorMetadataStoreApi,
  });

  // Reset s-position when road changes
  useEffect(() => {
    setSPosition(0);
  }, [selectedRoadId]);

  const selectedRoad = useMemo(
    () => odrDocument.roads.find((r) => r.id === selectedRoadId) ?? null,
    [odrDocument.roads, selectedRoadId],
  );

  // Compute active lane section index for current s-position
  const activeLaneSectionIdx = useMemo(() => {
    if (!selectedRoad) return 0;
    let idx = 0;
    for (let i = 0; i < selectedRoad.lanes.length; i++) {
      if (selectedRoad.lanes[i].s <= sPosition) idx = i;
      else break;
    }
    return idx;
  }, [selectedRoad, sPosition]);

  const activeLaneSection = selectedRoad?.lanes[activeLaneSectionIdx] ?? null;
  const dsFromSectionStart = activeLaneSection ? sPosition - activeLaneSection.s : 0;

  const handleLaneSelect = useCallback((laneId: number) => {
    setSelectedLaneId(laneId);
  }, []);

  const handleGeometrySelect = useCallback(
    (_roadId: string, geometryIndex: number) => {
      setSelectedGeometryIndex(geometryIndex);
      setSelectedGeometryIndices(new Set([geometryIndex]));
    },
    [],
  );

  const handleGeometryShiftClick = useCallback(
    (_roadId: string, geometryIndex: number) => {
      setSelectedGeometryIndices((prev) => {
        const next = new Set(prev);
        if (next.has(geometryIndex)) {
          next.delete(geometryIndex);
        } else {
          next.add(geometryIndex);
        }
        // Update primary selection to the last toggled item
        if (next.size > 0) {
          setSelectedGeometryIndex(geometryIndex);
        } else {
          setSelectedGeometryIndex(null);
        }
        return next;
      });
    },
    [],
  );

  const handleDeleteSelectedGeometry = useCallback(() => {
    if (!selectedRoadId || selectedGeometryIndices.size === 0) return;
    const road = odrDocument.roads.find((r) => r.id === selectedRoadId);
    if (!road || road.planView.length <= 1) return;

    // Filter out selected indices, preserving at least one geometry
    const remaining = road.planView.filter((_, i) => !selectedGeometryIndices.has(i));
    if (remaining.length === 0) return;

    // Recalculate s values
    let s = 0;
    const updatedPlanView = remaining.map((g) => {
      const updated = { ...g, s };
      s += g.length;
      return updated;
    });

    odrStoreApi.getState().updateRoad(selectedRoadId, { planView: updatedPlanView });
    setSelectedGeometryIndex(null);
    setSelectedGeometryIndices(new Set());
  }, [selectedRoadId, selectedGeometryIndices, odrDocument.roads, odrStoreApi]);

  // Delete/Backspace to remove selected geometry segments
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        handleDeleteSelectedGeometry();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDeleteSelectedGeometry]);

  // Escape key: cancel creation or switch back to select tool
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      const store = useOdrSidebarStore.getState();
      if (store.activeTool === 'road-create') {
        if (store.roadCreation.phase === 'startPlaced') {
          // Cancel current creation (back to idle)
          store.resetRoadCreation();
        } else {
          // Switch back to select tool
          store.setActiveTool('select');
        }
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleGeometryDragEnd = useCallback(
    (roadId: string, geometryIndex: number, newX: number, newY: number) => {
      const road = odrDocument.roads.find((r) => r.id === roadId);
      if (!road) return;
      const updatedPlanView = [...road.planView];
      const geo = updatedPlanView[geometryIndex];
      if (geo) {
        updatedPlanView[geometryIndex] = { ...geo, x: newX, y: newY };
        odrStoreApi.getState().updateRoad(roadId, { planView: updatedPlanView });
        checkForIntersections(odrStoreApi.getState().document);
      }
    },
    [odrDocument.roads, odrStoreApi, checkForIntersections],
  );

  const handleHeadingDragEnd = useCallback(
    (roadId: string, geometryIndex: number, newHdg: number) => {
      const road = odrDocument.roads.find((r) => r.id === roadId);
      if (!road) return;
      const updatedPlanView = [...road.planView];
      const geo = updatedPlanView[geometryIndex];
      if (geo) {
        updatedPlanView[geometryIndex] = { ...geo, hdg: newHdg };
        odrStoreApi.getState().updateRoad(roadId, { planView: updatedPlanView });
        checkForIntersections(odrStoreApi.getState().document);
      }
    },
    [odrDocument.roads, odrStoreApi, checkForIntersections],
  );

  const handleCurvatureDragEnd = useCallback(
    (roadId: string, geometryIndex: number, newCurvature: number) => {
      const road = odrDocument.roads.find((r) => r.id === roadId);
      if (!road) return;
      const updatedPlanView = [...road.planView];
      const geo = updatedPlanView[geometryIndex];
      if (geo) {
        updatedPlanView[geometryIndex] = { ...geo, curvature: newCurvature };
        odrStoreApi.getState().updateRoad(roadId, { planView: updatedPlanView });
        checkForIntersections(odrStoreApi.getState().document);
      }
    },
    [odrDocument.roads, odrStoreApi, checkForIntersections],
  );

  const handleEndpointDragEnd = useCallback(
    (
      roadId: string,
      geometryIndex: number,
      updates: { hdg?: number; length: number; curvature?: number; type?: 'line' | 'arc' },
    ) => {
      const road = odrDocument.roads.find((r) => r.id === roadId);
      if (!road) return;
      const updatedPlanView = [...road.planView];
      const geo = updatedPlanView[geometryIndex];
      if (geo) {
        const patch: Record<string, unknown> = { length: updates.length };
        if (updates.hdg !== undefined) patch.hdg = updates.hdg;
        if (updates.curvature !== undefined) patch.curvature = updates.curvature;
        if (updates.type !== undefined) patch.type = updates.type;
        updatedPlanView[geometryIndex] = { ...geo, ...patch };

        // Recalculate s values after length change
        let s = 0;
        const recalculated = updatedPlanView.map((g) => {
          const updated = { ...g, s };
          s += g.length;
          return updated;
        });

        // Total road length = sum of all geometry lengths
        const totalLength = recalculated.reduce((sum, g) => sum + g.length, 0);
        odrStoreApi.getState().updateRoad(roadId, { planView: recalculated, length: totalLength });
        checkForIntersections(odrStoreApi.getState().document);
      }
    },
    [odrDocument.roads, odrStoreApi, checkForIntersections],
  );

  const handleStartpointDragEnd = useCallback(
    (
      roadId: string,
      geometryIndex: number,
      updates: { x: number; y: number; hdg: number; length: number; curvature?: number; type?: 'line' | 'arc' },
    ) => {
      const road = odrDocument.roads.find((r) => r.id === roadId);
      if (!road) return;
      const updatedPlanView = [...road.planView];
      const geo = updatedPlanView[geometryIndex];
      if (geo) {
        const patch: Record<string, unknown> = {
          x: updates.x,
          y: updates.y,
          hdg: updates.hdg,
          length: updates.length,
        };
        if (updates.curvature !== undefined) patch.curvature = updates.curvature;
        if (updates.type !== undefined) patch.type = updates.type;
        updatedPlanView[geometryIndex] = { ...geo, ...patch };

        // Recalculate s values after length change
        let s = 0;
        const recalculated = updatedPlanView.map((g) => {
          const updated = { ...g, s };
          s += g.length;
          return updated;
        });

        const totalLength = recalculated.reduce((sum, g) => sum + g.length, 0);
        odrStoreApi.getState().updateRoad(roadId, { planView: recalculated, length: totalLength });
        checkForIntersections(odrStoreApi.getState().document);
      }
    },
    [odrDocument.roads, odrStoreApi, checkForIntersections],
  );

  // --- Road link set (bidirectional) ---
  const handleRoadLinkSet = useCallback(
    (
      roadId: string,
      linkType: 'predecessor' | 'successor',
      targetRoadId: string,
      targetContactPoint: 'start' | 'end',
    ) => {
      const store = odrStoreApi.getState();

      // Defensive: skip if target road no longer exists (e.g. split by auto-junction)
      if (!store.document.roads.some((r) => r.id === targetRoadId)) {
        console.warn(`[handleRoadLinkSet] Target road ${targetRoadId} not found, skipping link`);
        return;
      }

      // Set link on the source road
      const sourceLink: OdrRoadLinkElement = {
        elementType: 'road',
        elementId: targetRoadId,
        contactPoint: targetContactPoint,
      };
      store.setRoadLink(roadId, linkType, sourceLink);

      // Set reverse link on the target road
      const reverseType: 'predecessor' | 'successor' =
        targetContactPoint === 'start' ? 'predecessor' : 'successor';
      const sourceContactPoint: 'start' | 'end' =
        linkType === 'predecessor' ? 'start' : 'end';
      const targetLink: OdrRoadLinkElement = {
        elementType: 'road',
        elementId: roadId,
        contactPoint: sourceContactPoint,
      };
      store.setRoadLink(targetRoadId, reverseType, targetLink);

      // Sync lane-level links (OpenDRIVE spec requires explicit lane predecessor/successor)
      syncLaneLinksForDirectConnections(store, [roadId, targetRoadId]);
    },
    [odrStoreApi],
  );

  // --- Road creation: start point placement ---
  const handleCreationStartPlace = useCallback(
    (
      x: number,
      y: number,
      hdg: number,
      snap?: { roadId: string; contactPoint: 'start' | 'end' },
    ) => {
      useOdrSidebarStore.getState().setRoadCreationStart(x, y, hdg, snap);
    },
    [],
  );

  // --- Road creation: cursor move (for ghost preview + numeric display) ---
  const handleCreationCursorMove = useCallback(
    (x: number, y: number) => {
      useOdrSidebarStore.getState().setRoadCreationCursor(x, y);
    },
    [],
  );

  // --- Road creation lanes from selected preset ---
  const creationLanes = useMemo(() => {
    const presetName = roadCreation.selectedPreset;
    const preset = DEFAULT_PRESETS.find((p) => p.name === presetName);
    const template = createRoadFromPartial({}, preset);
    return template.lanes;
  }, [roadCreation.selectedPreset]);

  // --- Road creation from 2-point click ---
  const handleRoadCreate = useCallback(
    (
      startX: number,
      startY: number,
      startHdg: number,
      endX: number,
      endY: number,
      _curvature: number,
      snapInfo?: { roadId: string; contactPoint: 'start' | 'end' },
    ) => {
      const chord = Math.hypot(endX - startX, endY - startY);
      if (chord < 0.5) return;

      const startSnap = useOdrSidebarStore.getState().roadCreation.startSnap;
      const headingConstrained = !!startSnap;

      // Compute arc/line geometry from start heading and endpoint
      const arc = computeAutoArc(startX, startY, startHdg, endX, endY, headingConstrained);

      const presetName = useOdrSidebarStore.getState().roadCreation.selectedPreset;
      const preset = DEFAULT_PRESETS.find((p) => p.name === presetName);
      const template = createRoadFromPartial({}, preset);

      const newRoad = odrStoreApi.getState().addRoad({
        name: `Road ${odrDocument.roads.length + 1}`,
        planView: [{
          s: 0,
          x: startX,
          y: startY,
          hdg: arc.hdg,
          length: arc.arcLength,
          type: arc.type,
          ...(arc.type === 'arc' ? { curvature: arc.curvature } : {}),
        }],
        lanes: template.lanes,
      });

      // Link to snapped start endpoint
      if (startSnap) {
        handleRoadLinkSet(newRoad.id, 'predecessor', startSnap.roadId, startSnap.contactPoint);
      }

      // Link to snapped end endpoint
      if (snapInfo) {
        handleRoadLinkSet(newRoad.id, 'successor', snapInfo.roadId, snapInfo.contactPoint);
      }

      // Chaining: if end point is NOT snapped, auto-set next start to this road's endpoint
      if (snapInfo) {
        // End snapped to existing road → complete, reset to idle
        useOdrSidebarStore.getState().resetRoadCreation();
      } else {
        // Chain: compute new road's endpoint, use as next start
        const endpoint = computeGeometryEndpoint(
          startX, startY, arc.hdg, arc.arcLength,
          arc.type === 'arc' ? arc.curvature : 0,
        );
        useOdrSidebarStore.getState().setRoadCreationStart(
          endpoint.x, endpoint.y, endpoint.hdg,
          { roadId: newRoad.id, contactPoint: 'end' },
        );
        useOdrSidebarStore.getState().setRoadCreationCursor(endpoint.x, endpoint.y);
      }

      checkForIntersections(odrStoreApi.getState().document);

      // Fix stale chain state: if the chained road was split by auto-junction,
      // update the start snap to reference the correct segment road.
      const chainState = useOdrSidebarStore.getState().roadCreation;
      if (chainState.phase === 'startPlaced' && chainState.startSnap) {
        const freshDoc = odrStoreApi.getState().document;
        const snapRoadExists = freshDoc.roads.some((r) => r.id === chainState.startSnap!.roadId);
        if (!snapRoadExists) {
          const metaStore = editorMetadataStoreApi.getState();
          // The stale roadId is now a virtualRoadId after splitting
          const vr = metaStore.findVirtualRoadBySegment(chainState.startSnap.roadId)
            ?? metaStore.metadata.virtualRoads.find(
              (v) => v.virtualRoadId === chainState.startSnap!.roadId,
            );
          if (vr && vr.segmentRoadIds.length > 0) {
            // contactPoint='end' → last segment, contactPoint='start' → first segment
            const segId = chainState.startSnap.contactPoint === 'end'
              ? vr.segmentRoadIds[vr.segmentRoadIds.length - 1]
              : vr.segmentRoadIds[0];
            if (segId && freshDoc.roads.some((r) => r.id === segId)) {
              useOdrSidebarStore.getState().setRoadCreationStart(
                chainState.startX, chainState.startY, chainState.startHdg,
                { roadId: segId, contactPoint: chainState.startSnap.contactPoint },
              );
            }
          }
        }
      }
    },
    [odrStoreApi, odrDocument.roads.length, handleRoadLinkSet, checkForIntersections],
  );

  // Whether the start heading is constrained (snapped or chained)
  const hasStartConstraint = roadCreation.phase === 'startPlaced' && !!roadCreation.startSnap;

  // --- Road creation cursor info for toolbar display ---
  const cursorInfo = useMemo(() => {
    if (roadCreation.phase !== 'startPlaced') return null;
    const dx = roadCreation.cursorX - roadCreation.startX;
    const dy = roadCreation.cursorY - roadCreation.startY;
    const length = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return {
      x: roadCreation.cursorX,
      y: roadCreation.cursorY,
      length,
      angle: ((angle % 360) + 360) % 360,
    };
  }, [roadCreation]);

  // --- Endpoint context menu ---
  const [endpointContextMenu, setEndpointContextMenu] = useState<{
    roadId: string;
    contactPoint: 'start' | 'end';
    screenX: number;
    screenY: number;
  } | null>(null);

  const handleEndpointContextMenu = useCallback(
    (roadId: string, contactPoint: 'start' | 'end', screenX: number, screenY: number) => {
      setEndpointContextMenu({ roadId, contactPoint, screenX, screenY });
    },
    [],
  );

  const handleEndpointContextMenuClose = useCallback(() => {
    setEndpointContextMenu(null);
  }, []);

  const handleAddRoadFromEndpoint = useCallback(
    (roadId: string, contactPoint: 'start' | 'end') => {
      const road = odrDocument.roads.find((r) => r.id === roadId);
      if (!road || road.planView.length === 0) return;

      let x: number, y: number, hdg: number;
      if (contactPoint === 'end') {
        // Get end position and heading of the road
        const last = road.planView[road.planView.length - 1];
        if (last.type === 'arc' && last.curvature !== undefined && Math.abs(last.curvature) > 1e-10) {
          const c = last.curvature;
          const endHdg = last.hdg + c * last.length;
          const r = 1 / c;
          x = last.x + r * (Math.sin(endHdg) - Math.sin(last.hdg));
          y = last.y + r * (-Math.cos(endHdg) + Math.cos(last.hdg));
          hdg = endHdg;
        } else {
          x = last.x + Math.cos(last.hdg) * last.length;
          y = last.y + Math.sin(last.hdg) * last.length;
          hdg = last.hdg;
        }
      } else {
        // Start position
        const first = road.planView[0];
        x = first.x;
        y = first.y;
        hdg = first.hdg + Math.PI; // Reverse direction for predecessor
      }

      const template = createRoadFromPartial({});
      const newRoad = odrStoreApi.getState().addRoad({
        name: `Road ${odrDocument.roads.length + 1}`,
        planView: [{ s: 0, x, y, hdg, length: 100, type: 'line' as const }],
        lanes: template.lanes,
      });

      // Set bidirectional links
      if (contactPoint === 'end') {
        // Existing road's end → new road's start
        handleRoadLinkSet(roadId, 'successor', newRoad.id, 'start');
      } else {
        // Existing road's start → new road's end
        handleRoadLinkSet(roadId, 'predecessor', newRoad.id, 'end');
      }

      useOdrSidebarStore.getState().setSelection({ type: 'road', id: newRoad.id });
      setEndpointContextMenu(null);
    },
    [odrDocument.roads, odrStoreApi, handleRoadLinkSet],
  );

  const handleDisconnectEndpoint = useCallback(
    (roadId: string, contactPoint: 'start' | 'end') => {
      const store = odrStoreApi.getState();
      const road = odrDocument.roads.find((r) => r.id === roadId);
      if (!road?.link) return;

      const linkType: 'predecessor' | 'successor' =
        contactPoint === 'start' ? 'predecessor' : 'successor';
      const existingLink = road.link[linkType];

      if (existingLink) {
        // Clear the link on the source road
        store.setRoadLink(roadId, linkType, undefined);
        clearLaneLinks(store, roadId, linkType);

        // Clear the reverse link on the target road
        if (existingLink.contactPoint) {
          const reverseType: 'predecessor' | 'successor' =
            existingLink.contactPoint === 'start' ? 'predecessor' : 'successor';
          store.setRoadLink(existingLink.elementId, reverseType, undefined);
          clearLaneLinks(store, existingLink.elementId, reverseType);
        }
      }
      setEndpointContextMenu(null);
    },
    [odrStoreApi, odrDocument.roads],
  );

  // --- Road click selection from 3D viewer ---
  const handleRoadSelect = useCallback(
    (roadId: string) => {
      useOdrSidebarStore.getState().setSelection({ type: 'road', id: roadId });
    },
    [],
  );

  // --- Junction click selection ---
  const handleJunctionClick = useCallback(
    (junctionId: string) => {
      useOdrSidebarStore.getState().setSelection({ type: 'junction', id: junctionId });
    },
    [],
  );

  // --- Junction context menu ---
  const [junctionContextMenu, setJunctionContextMenu] = useState<{
    junctionId: string;
    screenX: number;
    screenY: number;
  } | null>(null);

  const handleJunctionContextMenu = useCallback(
    (junctionId: string, event: { nativeEvent: MouseEvent }) => {
      event.nativeEvent.preventDefault();
      setJunctionContextMenu({
        junctionId,
        screenX: event.nativeEvent.clientX,
        screenY: event.nativeEvent.clientY,
      });
    },
    [],
  );

  const handleJunctionContextMenuClose = useCallback(() => {
    setJunctionContextMenu(null);
  }, []);

  const handleDeleteJunction = useCallback(
    (junctionId: string) => {
      odrStoreApi.getState().removeJunction(junctionId);
      setJunctionContextMenu(null);
      // Deselect if deleted junction was selected
      if (selectedJunctionId === junctionId) {
        useOdrSidebarStore.getState().setSelection({ type: null, id: null });
      }
    },
    [odrStoreApi, selectedJunctionId],
  );

  const handleRegenerateConnections = useCallback(
    (junctionId: string) => {
      const store = odrStoreApi.getState();
      const doc = store.document;
      const junction = doc.junctions.find((j) => j.id === junctionId);
      if (!junction) {
        setJunctionContextMenu(null);
        return;
      }

      // Remove existing connecting roads
      const existingConnRoadIds = junction.connections.map((c) => c.connectingRoad);
      for (const connRoadId of existingConnRoadIds) {
        if (doc.roads.some((r) => r.id === connRoadId)) {
          store.removeRoad(connRoadId);
        }
      }

      // Gather unique incoming road IDs and their contact points
      const incomingEntries = new Map<string, 'start' | 'end'>();
      for (const conn of junction.connections) {
        if (!incomingEntries.has(conn.incomingRoad)) {
          incomingEntries.set(conn.incomingRoad, conn.contactPoint);
        }
      }

      // Build endpoints from incoming roads
      const freshDoc = store.document;
      const endpoints = [];
      for (const [roadId, contactPoint] of incomingEntries) {
        const road = freshDoc.roads.find((r) => r.id === roadId);
        if (road) {
          endpoints.push(computeRoadEndpoint(road, contactPoint, evaluateReferenceLineAtS));
        }
      }

      if (endpoints.length < 2) {
        // Not enough roads to regenerate — clear connections
        store.updateJunction(junctionId, { connections: [] });
        setJunctionContextMenu(null);
        return;
      }

      // Generate new connecting roads
      const routingConfig = createDefaultLaneRoutingConfig();
      const result = generateConnectingRoads(endpoints, junctionId, routingConfig, store.document);

      // Add new connecting roads
      for (const connRoad of result.roads) {
        store.addRoad({ ...connRoad, junction: junctionId });
      }

      // Update junction connections
      store.updateJunction(junctionId, { connections: result.connections });

      setJunctionContextMenu(null);
    },
    [odrStoreApi],
  );

  const handleAddJunctionConnection = useCallback(
    (junctionId: string) => {
      // Add an empty connection placeholder that user can configure via property editor
      odrStoreApi.getState().addJunctionConnection(junctionId, {});
      setJunctionContextMenu(null);
    },
    [odrStoreApi],
  );

  // --- Road link unset (on gizmo drag away from snap) ---
  const handleRoadLinkUnset = useCallback(
    (roadId: string, linkType: 'predecessor' | 'successor') => {
      const store = odrStoreApi.getState();
      const road = odrDocument.roads.find((r) => r.id === roadId);
      if (!road?.link) return;

      const existingLink = road.link[linkType];
      if (existingLink) {
        // Clear the link on the source road
        store.setRoadLink(roadId, linkType, undefined);
        clearLaneLinks(store, roadId, linkType);

        // Clear the reverse link on the target road
        if (existingLink.contactPoint) {
          const reverseType: 'predecessor' | 'successor' =
            existingLink.contactPoint === 'start' ? 'predecessor' : 'successor';
          store.setRoadLink(existingLink.elementId, reverseType, undefined);
          clearLaneLinks(store, existingLink.elementId, reverseType);
        }
      }
    },
    [odrStoreApi, odrDocument.roads],
  );

  // --- Store-connected callbacks for property editor ---
  const handleUpdateRoad = useCallback(
    (roadId: string, updates: Partial<OdrRoad>) => {
      odrStoreApi.getState().updateRoad(roadId, updates);
    },
    [odrStoreApi],
  );

  const handleUpdateLane = useCallback(
    (roadId: string, sectionIdx: number, laneId: number, updates: Partial<OdrLane>) => {
      const side = laneId > 0 ? 'left' : 'right';
      odrStoreApi
        .getState()
        .updateLane(roadId, sectionIdx, side as 'left' | 'right', laneId, updates);
    },
    [odrStoreApi],
  );

  const handleUpdateSignal = useCallback(
    (roadId: string, signalId: string, updates: Partial<OdrSignal>) => {
      odrStoreApi.getState().updateSignal(roadId, signalId, updates);
    },
    [odrStoreApi],
  );

  const handleUpdateJunction = useCallback(
    (junctionId: string, updates: Partial<OdrJunction>) => {
      odrStoreApi.getState().updateJunction(junctionId, updates);
    },
    [odrStoreApi],
  );

  const handleUpdateHeader = useCallback(
    (updates: Partial<OdrHeader>) => {
      odrStoreApi.getState().updateHeader(updates);
    },
    [odrStoreApi],
  );

  return (
    <PanelGroup direction="horizontal" className="flex-1">
      {/* Left: OdrSidebar */}
      <Panel defaultSize={20} minSize={12} maxSize={30}>
        <div className="h-full bg-[var(--color-bg-deep)] enter-l">
          <OdrSidebar />
        </div>
      </Panel>

      <ResizeHandle />

      {/* Center: 3D Viewer (top) + Cross-Section/Elevation (bottom) */}
      <Panel defaultSize={55} minSize={30}>
        <PanelGroup direction="vertical">
          {/* 3D Viewer */}
          <Panel defaultSize={55} minSize={20}>
            <div className="flex flex-col h-full bg-[var(--color-bg-deep)] enter d5">
              <RoadNetworkToolbar cursorInfo={cursorInfo} />
              <div className="flex-1 min-h-0">
              <ErrorBoundary fallbackTitle="3D Viewer Error">
                <ScenarioViewer
                  scenarioStore={scenarioStoreApi}
                  openDriveDocument={odrDocument}
                  selectedEntityId={null}
                  hoveredEntityName={null}
                  onEntitySelect={() => {}}
                  onEntityFocus={() => {}}
                  preferences={{
                    showGrid3D: preferences.showGrid3D,
                    showLaneIds: preferences.showLaneIds,
                    showRoadIds: preferences.showRoadIds,
                  }}
                  showPerf={false}
                  className="h-full w-full"
                  roadEditMode
                  roadEditSelectedRoadId={selectedRoadId}
                  roadEditSelectedGeometryIndex={selectedGeometryIndex}
                  onRoadGeometryDragEnd={handleGeometryDragEnd}
                  onRoadStartpointDragEnd={handleStartpointDragEnd}
                  onRoadGeometrySelect={handleGeometrySelect}
                  roadCreationModeActive={roadCreationMode}
                  roadCreationPhase={roadCreation.phase}
                  roadCreationStartX={roadCreation.startX}
                  roadCreationStartY={roadCreation.startY}
                  roadCreationStartHdg={roadCreation.startHdg}
                  roadCreationCursorX={roadCreation.cursorX}
                  roadCreationCursorY={roadCreation.cursorY}
                  roadCreationLanes={creationLanes}
                  onRoadCreationStartPlace={handleCreationStartPlace}
                  onRoadCreate={handleRoadCreate}
                  onRoadCreationCursorMove={handleCreationCursorMove}
                  onRoadHeadingDragEnd={handleHeadingDragEnd}
                  onRoadCurvatureDragEnd={handleCurvatureDragEnd}
                  onRoadEndpointDragEnd={handleEndpointDragEnd}
                  onRoadGeometryShiftClick={handleGeometryShiftClick}
                  roadEditSelectedGeometryIndices={selectedGeometryIndices}
                  onRoadLinkSet={handleRoadLinkSet}
                  onRoadLinkUnset={handleRoadLinkUnset}
                  onRoadEndpointContextMenu={handleEndpointContextMenu}
                  roadCreationHasStartConstraint={hasStartConstraint}
                  roadSelectModeActive={activeTool === 'select'}
                  onRoadSelect={handleRoadSelect}
                  selectedJunctionId={selectedJunctionId}
                  onJunctionClick={handleJunctionClick}
                  onJunctionContextMenu={handleJunctionContextMenu}
                />
              </ErrorBoundary>
              </div>
              {endpointContextMenu && (
                <RoadEndpointContextMenu
                  position={{ x: endpointContextMenu.screenX, y: endpointContextMenu.screenY }}
                  roadId={endpointContextMenu.roadId}
                  contactPoint={endpointContextMenu.contactPoint}
                  hasLink={(() => {
                    const road = odrDocument.roads.find((r) => r.id === endpointContextMenu.roadId);
                    if (!road?.link) return false;
                    return endpointContextMenu.contactPoint === 'start'
                      ? !!road.link.predecessor
                      : !!road.link.successor;
                  })()}
                  onAddRoad={handleAddRoadFromEndpoint}
                  onDisconnect={handleDisconnectEndpoint}
                  onClose={handleEndpointContextMenuClose}
                />
              )}
              {junctionContextMenu && (
                <JunctionContextMenu
                  position={{ x: junctionContextMenu.screenX, y: junctionContextMenu.screenY }}
                  junctionId={junctionContextMenu.junctionId}
                  onDelete={handleDeleteJunction}
                  onRegenerateConnections={handleRegenerateConnections}
                  onAddConnection={handleAddJunctionConnection}
                  onClose={handleJunctionContextMenuClose}
                />
              )}
            </div>
          </Panel>

          <ResizeHandleH />

          {/* Cross-Section / Elevation editor area */}
          <Panel defaultSize={45} minSize={15}>
            <div className="flex flex-col h-full bg-[var(--color-bg-deep)]">
              {/* Tab bar + content */}
              <Tabs
                value={centerTab}
                onValueChange={(v) => setCenterTab(v as 'crossSection' | 'elevation' | 'laneLinks')}
                className="flex flex-col flex-1 min-h-0"
              >
                <TabsList className="bg-[var(--color-glass-1)] backdrop-blur-[28px] rounded-none p-0">
                  <TabsTrigger value="crossSection" className="apex-tab flex-1">
                    Cross Section
                  </TabsTrigger>
                  <TabsTrigger value="elevation" className="apex-tab flex-1">
                    Elevation
                  </TabsTrigger>
                  <TabsTrigger value="laneLinks" className="apex-tab flex-1">
                    Lane Links
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="crossSection" className="flex-1 overflow-hidden mt-0">
                  {selectedRoad && activeLaneSection ? (
                    <div className="flex flex-col h-full">
                      <CrossSectionToolbar
                        sPosition={sPosition}
                        roadLength={selectedRoad.length}
                        onSPositionChange={setSPosition}
                        laneSections={selectedRoad.lanes}
                        activeLaneSectionIndex={activeLaneSectionIdx}
                        selectedLaneId={selectedLaneId}
                      />
                      <div className="flex-1 min-h-0">
                        <CrossSectionView
                          laneSection={activeLaneSection}
                          dsFromSectionStart={dsFromSectionStart}
                          superelevation={selectedRoad.lateralProfile}
                          sPosition={sPosition}
                          selectedLaneId={selectedLaneId}
                          onLaneSelect={handleLaneSelect}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-[var(--color-text-muted)]">
                      Select a road to view cross section
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="elevation" className="flex-1 overflow-hidden mt-0">
                  {selectedRoad ? (
                    <ElevationGraphEditor
                      elevations={selectedRoad.elevationProfile}
                      roadLength={selectedRoad.length}
                      sPosition={sPosition}
                      onSPositionChange={setSPosition}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-[var(--color-text-muted)]">
                      Select a road to view elevation
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="laneLinks" className="flex-1 overflow-hidden mt-0">
                  {selectedJunctionId &&
                  odrDocument.junctions.find((j) => j.id === selectedJunctionId) ? (
                    <LaneLinkEditor
                      junction={odrDocument.junctions.find((j) => j.id === selectedJunctionId)!}
                      document={odrDocument}
                      onUpdate={handleUpdateJunction}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-[var(--color-text-muted)]">
                      Select a junction to edit lane links
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </Panel>
        </PanelGroup>
      </Panel>

      <ResizeHandle />

      {/* Right: Property Editor + Validation */}
      <Panel defaultSize={25} minSize={12} maxSize={35}>
        <div className="h-full bg-[var(--color-bg-deep)] enter-r">
          <Tabs defaultValue="properties" className="flex flex-col h-full">
            <TabsList className="bg-[var(--color-glass-1)] backdrop-blur-[28px] rounded-none p-0">
              <TabsTrigger value="properties" className="apex-tab flex-1">
                Properties
              </TabsTrigger>
              <TabsTrigger value="validation" className="apex-tab flex-1">
                Validation
              </TabsTrigger>
            </TabsList>
            <TabsContent value="properties" className="flex-1 overflow-hidden mt-0">
              {roadCreationMode ? (
                <RoadStylePanel />
              ) : (
                <OdrPropertyEditor
                  document={odrDocument}
                  selectedRoadId={selectedRoadId}
                  selectedJunctionId={selectedJunctionId}
                  selectedSignalId={selectedSignalId}
                  selectedLaneId={selectedLaneId}
                  selectedGeometryIndex={selectedGeometryIndex}
                  onUpdateRoad={handleUpdateRoad}
                  onUpdateLane={handleUpdateLane}
                  onUpdateSignal={handleUpdateSignal}
                  onUpdateJunction={handleUpdateJunction}
                  onUpdateHeader={handleUpdateHeader}
                />
              )}
            </TabsContent>
            <TabsContent value="validation" className="flex-1 overflow-hidden mt-0">
              <ValidationPanel />
            </TabsContent>
          </Tabs>
        </div>
      </Panel>
    </PanelGroup>
  );
}

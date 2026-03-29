import { useState, useCallback, useEffect, useMemo } from 'react';
import { useStore } from 'zustand';
import { createPortal } from 'react-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { OdrRoad, OdrRoadLinkElement, OdrLane, OdrSignal, OdrJunction, OdrHeader, OpenDriveDocument } from '@osce/shared';
import {
  createRoadFromPartial,
  syncLaneLinksForDirectConnections,
  clearLaneLinks,
  addLaneToSection,
  removeLaneFromSection,
  splitLaneSectionAt,
  moveSectionBoundary,
  changeLaneWidth,
  createTaperAtRange,
  getPresetById,
  presetToSignalPartial,
  createAssemblyFromPlacement,
  findAssemblyForSignal,
  addHeadToAssembly,
  updateAssembly,
  getAssemblyPresetById,
} from '@osce/opendrive-engine';
import { ScenarioViewer } from '@osce/3d-viewer';
import type { PoleAssemblyInfo } from '@osce/3d-viewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { ErrorBoundary } from '../ErrorBoundary';
import { OdrPropertyEditor } from './property/OdrPropertyEditor';
import { OdrSidebar } from './sidebar/OdrSidebar';
import { CrossSectionView } from './cross-section/CrossSectionView';
import { CrossSectionToolbar } from './cross-section/CrossSectionToolbar';
import { ElevationGraphEditor } from './elevation/ElevationGraphEditor';
import { RoadEndpointContextMenu } from './RoadEndpointContextMenu';
import { JunctionContextMenu } from './JunctionContextMenu';
import { LaneContextMenu } from './LaneContextMenu';
import { RoadSectionContextMenu } from './RoadSectionContextMenu';
import { OdrLaneSectionPropertyEditor } from './property/OdrLaneSectionPropertyEditor';
import { LaneLinkEditor } from './lane-link/LaneLinkEditor';
import { RoadNetworkToolbar } from './toolbar/RoadNetworkToolbar';
import { RoadStylePanel } from './toolbar/RoadStylePanel';
import { SignalPlaceToolPanel } from './toolbar/SignalPlaceToolPanel';
import { JunctionRoutingPanel } from './junction/JunctionRoutingPanel';
import { useAutoJunctionDetection } from '../../hooks/use-auto-junction-detection';
import { evaluateReferenceLineAtS, evaluateElevation, stToXyz, computePolePlacementT } from '@osce/opendrive';
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
import type { SignalPlaceGhost } from '../../hooks/use-opendrive-store';
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

  // Sync roadNetwork from editorStore → openDriveStore on mode entry and file changes.
  // Reference comparison prevents infinite loops: the reverse subscription (below)
  // sets editorStore.roadNetwork to the same object reference as odrStore.document,
  // so subsequent renders will see document === roadNetwork and skip the load.
  useEffect(() => {
    if (roadNetwork) {
      if (odrStoreApi.getState().document !== roadNetwork) {
        odrStoreApi.getState().loadDocument(roadNetwork);

        // Ensure lane-level links exist for all direct road-to-road connections.
        // Imported xodr files (especially from third-party tools) may omit these.
        const allRoadIds = roadNetwork.roads.map((r) => r.id);
        syncLaneLinksForDirectConnections(odrStoreApi.getState(), allRoadIds);
      }
    }
  }, [roadNetwork, odrStoreApi]);

  // Sync openDriveStore → editorStore.roadNetwork reactively + dirty tracking
  useEffect(() => {
    let mounted = true;
    let prevDoc = odrStoreApi.getState().document;
    const unsub = odrStoreApi.subscribe((state: { document: OpenDriveDocument }) => {
      if (!mounted) return;
      useEditorStore.getState().setRoadNetwork(state.document);
      if (state.document !== prevDoc) {
        prevDoc = state.document;
        useEditorStore.getState().setRoadNetworkDirty(true);
      }
    });
    return () => {
      mounted = false;
      unsub();
    };
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

  // Signal key for 3D viewer selection (roadId:signalId format)
  const selectedSignalKey = useMemo(() => {
    if (sidebarSelection.type !== 'signal' || !sidebarSelection.id || !sidebarSelection.roadId) return null;
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
  const [selectedGeometryIndex, setSelectedGeometryIndex] = useState<number | null>(null);
  const [selectedGeometryIndices, setSelectedGeometryIndices] = useState<Set<number>>(new Set());

  // Reset lane/geometry selection when road changes
  useEffect(() => {
    setSelectedLaneId(null);
    setSelectedLaneSectionIdx(null);
    setSelectedGeometryIndex(null);
    setSelectedGeometryIndices(new Set());
  }, [selectedRoadId]);

  const [centerTab, setCenterTab] = useState<'crossSection' | 'elevation' | 'laneLinks'>('crossSection');
  const [sPosition, setSPosition] = useState(0);

  // Road editing toolbar state from store
  const activeTool = useOdrSidebarStore((s) => s.activeTool);
  const roadCreation = useOdrSidebarStore((s) => s.roadCreation);
  const roadCreationMode = activeTool === 'road-create';
  const laneEditMode = activeTool === 'lane-edit';
  const laneEdit = useOdrSidebarStore((s) => s.laneEdit);
  const setLaneEditHover = useOdrSidebarStore((s) => s.setLaneEditHover);
  const setLaneEditRoad = useOdrSidebarStore((s) => s.setLaneEditRoad);
  const setTaperLength = useOdrSidebarStore((s) => s.setTaperLength);
  const setUseLaneOffset = useOdrSidebarStore((s) => s.setUseLaneOffset);
  const setSelectedSections = useOdrSidebarStore((s) => s.setSelectedSections);
  const laneEditSubMode = laneEdit.subMode;
  const taperCreation = laneEdit.taperCreation;
  const setTaperCreation = useOdrSidebarStore((s) => s.setTaperCreation);
  const resetTaperCreation = useOdrSidebarStore((s) => s.resetTaperCreation);

  // Junction create state
  const junctionCreateMode = activeTool === 'junction-create';
  const junctionCreate = useOdrSidebarStore((s) => s.junctionCreate);

  // Signal place state
  const signalPlaceMode = activeTool === 'signal-place';
  const signalPlace = useOdrSidebarStore((s) => s.signalPlace);
  const setSignalPlaceGhost = useOdrSidebarStore((s) => s.setSignalPlaceGhost);

  // Build assemblyMap for 3D arm pole rendering
  const signalAssemblies = useStore(
    editorMetadataStoreApi,
    (s) => s.metadata.signalAssemblies,
  );
  const signalAssemblyMap = useMemo(() => {
    const assemblies = signalAssemblies;
    if (!assemblies || assemblies.length === 0) return undefined;
    const map = new Map<string, PoleAssemblyInfo>();
    for (const asm of assemblies) {
      let armAngle = asm.armAngle;

      // Compute armAngle from road geometry if not set (e.g., xodr import)
      if (armAngle == null && asm.poleType === 'arm' && asm.poleObjectId) {
        const road = odrDocument.roads.find((r) => r.id === asm.roadId);
        if (road) {
          const poleObj = road.objects.find((o) => o.id === asm.poleObjectId);
          const signal = road.signals.find((s) => asm.signalIds.includes(s.id));
          if (poleObj && signal) {
            const pose = evaluateReferenceLineAtS(road.planView, signal.s);
            const z = evaluateElevation(road.elevationProfile, signal.s);
            const poleWorld = stToXyz(pose, poleObj.t, z);
            const headWorld = stToXyz(pose, signal.t, z);
            armAngle = Math.atan2(headWorld.y - poleWorld.y, headWorld.x - poleWorld.x);
          }
        }
      }

      const info: PoleAssemblyInfo = {
        assemblyId: asm.assemblyId,
        poleType: asm.poleType,
        armLength: asm.armLength,
        armAngle,
        signalIds: asm.signalIds,
      };
      for (const sid of asm.signalIds) {
        map.set(sid, info);
      }
    }
    return map;
  }, [signalAssemblies, odrDocument]);

  // Compute road endpoints for the junction routing panel
  const junctionEndpoints = useMemo(() => {
    if (!junctionCreateMode || junctionCreate.selectedEndpoints.length < 2) return [];
    return junctionCreate.selectedEndpoints
      .map((ep) => {
        const road = odrDocument.roads.find((r) => r.id === ep.roadId);
        if (!road) return null;
        return computeRoadEndpoint(road, ep.contactPoint, evaluateReferenceLineAtS);
      })
      .filter((ep): ep is NonNullable<typeof ep> => ep !== null);
  }, [junctionCreateMode, junctionCreate.selectedEndpoints, odrDocument.roads]);

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

  // When s-position slider changes sections, sync the property editor section
  useEffect(() => {
    setSelectedLaneSectionIdx(null);
  }, [activeLaneSectionIdx]);

  const handleLaneSelect = useCallback((laneId: number) => {
    setSelectedLaneId(laneId);
    // Use current cross-section's section index
    setSelectedLaneSectionIdx(activeLaneSectionIdx);
  }, [activeLaneSectionIdx]);

  const handleLaneWidthChange = useCallback(
    (laneId: number, newWidth: number) => {
      if (!selectedRoadId) return;
      const store = odrStoreApi.getState();
      changeLaneWidth(store, selectedRoadId, activeLaneSectionIdx, laneId, newWidth);
    },
    [odrStoreApi, selectedRoadId, activeLaneSectionIdx],
  );

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
      } else if (store.activeTool === 'lane-edit') {
        // Step-by-step de-escalation:
        // 1. Taper start picked → cancel pick (back to taper standby)
        // 2. Split or Taper mode → back to Add/Remove
        // 3. Add/Remove mode → back to Select tool
        const { laneEdit } = store;
        if (laneEdit.taperCreation.phase !== 'idle') {
          store.resetTaperCreation();
        } else if (laneEdit.subMode !== 'select') {
          store.setLaneEditSubMode('select');
        } else {
          store.setActiveTool('select');
        }
        e.preventDefault();
      } else if (store.activeTool === 'junction-create') {
        if (store.junctionCreate.selectedEndpoints.length > 0) {
          store.resetJunctionCreate();
        } else {
          store.setActiveTool('select');
        }
        e.preventDefault();
      } else if (store.activeTool === 'signal-place') {
        store.setActiveTool('select');
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

  // --- Lane context menu ---
  const [laneContextMenu, setLaneContextMenu] = useState<{
    roadId: string;
    sectionIdx: number;
    laneId: number;
    side: 'left' | 'right';
    screenX: number;
    screenY: number;
  } | null>(null);

  const [roadSectionContextMenu, setRoadSectionContextMenu] = useState<{
    roadId: string;
    s: number;
    sectionIdx: number;
    screenX: number;
    screenY: number;
  } | null>(null);

  const handleLaneHover = useCallback(
    (info: { roadId: string; sectionIdx: number; laneId: number; s: number; side: 'left' | 'right'; screenX: number; screenY: number } | null) => {
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
    [setLaneEditHover, setLaneEditRoad, laneEdit.activeRoadId, laneEdit.selectedSectionIndices, setSelectedSections],
  );

  const handleLaneClick = useCallback(
    (info: { roadId: string; sectionIdx: number; laneId: number; s: number; side: 'left' | 'right' }) => {
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
    (info: { roadId: string; sectionIdx: number; laneId: number; side: 'left' | 'right' }, screenX: number, screenY: number) => {
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
    [],
  );

  const handleRoadSurfaceContextMenu = useCallback(
    (roadId: string, s: number, screenX: number, screenY: number) => {
      const road = odrDocument.roads.find((r) => r.id === roadId);
      if (!road) return;
      let sectionIdx = 0;
      for (let i = road.lanes.length - 1; i >= 0; i--) {
        if (s >= road.lanes[i].s) { sectionIdx = i; break; }
      }
      setRoadSectionContextMenu({ roadId, s, sectionIdx, screenX, screenY });
    },
    [odrDocument.roads],
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
    splitLaneSectionAt(store, roadSectionContextMenu.roadId, roadSectionContextMenu.sectionIdx, roadSectionContextMenu.s);
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

  const taperDirection = laneEdit.taperDirection;
  const taperPosition = laneEdit.taperPosition;

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

        // Left lanes travel opposite to s-direction.
        // "Narrow to Wide" from the driver's perspective means the lane widens
        // as the driver travels — which is DECREASING s for left lanes.
        // In road coordinates (increasing s), this means "wide to narrow" (3.5→0).
        // So we flip the direction for left lanes.
        const effectiveDirection = taperCreation.side === 'left'
          ? (taperDirection === 'narrow-to-wide' ? 'wide-to-narrow' : 'narrow-to-wide')
          : taperDirection;

        const store = odrStoreApi.getState();
        createTaperAtRange(
          store, roadId, startS, endS, taperCreation.side,
          effectiveDirection, taperPosition, laneEdit.useLaneOffset,
        );
        resetTaperCreation();
      }
    },
    [odrStoreApi, taperCreation, taperDirection, taperPosition, laneEdit.useLaneOffset, setTaperCreation, resetTaperCreation],
  );

  // --- Junction create handlers ---
  const handleJunctionEndpointHover = useCallback(
    (endpoint: { roadId: string; contactPoint: 'start' | 'end' } | null) => {
      useOdrSidebarStore.getState().setJunctionCreateHover(endpoint);
    },
    [],
  );

  const handleJunctionEndpointClick = useCallback(
    (roadId: string, contactPoint: 'start' | 'end') => {
      useOdrSidebarStore.getState().toggleEndpointSelection(roadId, contactPoint);
    },
    [],
  );

  const handleJunctionConfirm = useCallback(() => {
    const store = odrStoreApi.getState();
    const doc = store.document;
    const { selectedEndpoints, routingPreset, laneOverrides } = useOdrSidebarStore.getState().junctionCreate;
    if (selectedEndpoints.length < 2) return;

    // Compute road endpoints
    const endpoints = [];
    for (const ep of selectedEndpoints) {
      const road = doc.roads.find((r) => r.id === ep.roadId);
      if (road) {
        endpoints.push(computeRoadEndpoint(road, ep.contactPoint, evaluateReferenceLineAtS));
      }
    }
    if (endpoints.length < 2) return;

    // Generate connecting roads with selected routing preset
    const routingConfig = routingPreset === 'dedicated'
      ? { rightTurnLanes: 'outermost' as const, leftTurnLanes: 'innermost' as const, generateUturn: false }
      : createDefaultLaneRoutingConfig();
    const junctionId = String(
      Math.max(0, ...doc.junctions.map((j) => parseInt(j.id, 10)).filter((n) => !isNaN(n))) + 1,
    );
    const result = generateConnectingRoads(
      endpoints, junctionId, routingConfig, doc,
      laneOverrides.length > 0 ? laneOverrides : undefined,
    );

    // Batch: create junction + connecting roads + update road links
    store.beginBatch('Create manual junction');
    try {
      const junction = store.addJunction({
        id: junctionId,
        name: `Junction ${junctionId}`,
        connections: result.connections,
      });

      // Add connecting roads
      for (const connRoad of result.roads) {
        store.addRoad({ ...connRoad, junction: junction.id });
      }

      // Set predecessor/successor junction references on incoming roads
      for (const ep of selectedEndpoints) {
        const linkType: 'predecessor' | 'successor' =
          ep.contactPoint === 'start' ? 'predecessor' : 'successor';
        store.setRoadLink(ep.roadId, linkType, {
          elementType: 'junction',
          elementId: junction.id,
        });
      }

      // Register metadata as manually created
      editorMetadataStoreApi.getState().addJunctionMetadata({
        junctionId: junction.id,
        intersectingVirtualRoadIds: [],
        connectingRoadIds: result.roads.map((r) => r.id),
        autoCreated: false,
      });
    } finally {
      store.endBatch();
    }

    // Reset junction create state
    useOdrSidebarStore.getState().resetJunctionCreate();
    // Select the new junction
    useOdrSidebarStore.getState().setSelection({ type: 'junction', id: junctionId });
  }, [odrStoreApi]);

  // Enter key: confirm junction creation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const store = useOdrSidebarStore.getState();
      if (store.activeTool === 'junction-create' && store.junctionCreate.selectedEndpoints.length >= 2) {
        handleJunctionConfirm();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleJunctionConfirm]);

  // --- Signal place handlers ---
  const handleSignalPlace = useCallback(
    (roadId: string, s: number, t: number, _heading: number) => {
      const store = odrStoreApi.getState();
      // Read state directly from the store to avoid stale closure issues
      const { tSnapMode, selectionType, selectedPresetId, signalOrientation, ghostPreview } =
        useOdrSidebarStore.getState().signalPlace;

      // Determine orientation: all modes are lane-relative (RHT/LHT aware).
      // In OpenDRIVE, orientation '+' = for +s traffic, '-' = for -s traffic.
      // We convert the user's lane-relative choice to road-absolute orientation.
      const isLeftLane = t > 0;
      const road = odrDocument.roads.find((r) => r.id === roadId);
      const isRHT = !road || road.rule !== 'LHT';
      const laneAgainstRoad = isLeftLane === isRHT; // true if lane travels in -s direction
      // User's lane-relative choice: '+' (Front) = face oncoming, '-' (Back) = face away
      // Convert to road-absolute: flip when lane travels against road reference line
      const orientation: '+' | '-' = laneAgainstRoad
        ? (signalOrientation === '+' ? '-' : '+')
        : signalOrientation;

      // Helper: compute arm angle from world positions
      const computeArmAngle = (poleT: number, headT: number): number | undefined => {
        const road = odrDocument.roads.find((r) => r.id === roadId);
        if (!ghostPreview || !road) return undefined;
        const pose = evaluateReferenceLineAtS(road.planView, s);
        const z = evaluateElevation(road.elevationProfile, s);
        const poleWorld = stToXyz(pose, poleT, z);
        const headWorld = stToXyz(pose, headT, z);
        return Math.atan2(headWorld.y - poleWorld.y, headWorld.x - poleWorld.x);
      };

      // Resolve head presets: single head or assembly (list of heads with offsets)
      // When orientation is '-', mirror X offsets so the assembly layout
      // stays correct from the viewer's perspective.
      const assemblyPreset =
        selectionType === 'assembly' ? getAssemblyPresetById(selectedPresetId) : undefined;
      const xMirror = orientation === '+' ? -1 : 1;
      const assemblyHeads =
        assemblyPreset && assemblyPreset.heads.length > 0
          ? assemblyPreset.heads.map((h) => ({ ...h, x: h.x * xMirror }))
          : [{ presetId: selectedPresetId, x: 0, y: 0 }];
      const headPresetIds = assemblyHeads.map((h) => h.presetId);

      const firstHeadPreset = getPresetById(headPresetIds[0]);
      const firstPartial = firstHeadPreset ? presetToSignalPartial(firstHeadPreset) : {};
      const isPedestrian = firstHeadPreset?.category === 'pedestrian';
      const zOffset = isPedestrian ? 2.5 : 5.0;

      if (tSnapMode === 'lane-above') {
        // Arm-mounted: pole at road edge, head over lane
        const headT = ghostPreview?.headT ?? t;
        const poleT = ghostPreview?.poleT ?? t;
        const armLength = ghostPreview?.armLength ?? 3;
        const armAngle = computeArmAngle(poleT, headT);

        const signal = createAssemblyFromPlacement(
          odrStoreApi,
          editorMetadataStoreApi,
          roadId,
          { ...firstPartial, s, t: headT, orientation, hOffset: 0, zOffset },
          headPresetIds[0],
          armLength,
          poleT,
          armAngle,
          assemblyHeads[0].x,
          assemblyHeads[0].y,
        );

        // Add remaining heads with configurator offsets
        if (assemblyHeads.length > 1) {
          const assembly = findAssemblyForSignal(editorMetadataStoreApi, signal.id);
          if (assembly) {
            for (let i = 1; i < assemblyHeads.length; i++) {
              addHeadToAssembly(
                odrStoreApi,
                editorMetadataStoreApi,
                assembly.assemblyId,
                assemblyHeads[i].presetId,
                'lower',
                assemblyHeads[i].x,
                assemblyHeads[i].y,
              );
            }
          }
        }
      } else {
        // Road-edge: straight pole
        if (headPresetIds.length === 1) {
          // Single signal, no assembly
          store.addSignal(roadId, {
            ...firstPartial,
            s,
            t,
            orientation,
            hOffset: 0,
            zOffset,
          });
        } else {
          // Assembly on straight pole
          const signal = createAssemblyFromPlacement(
            odrStoreApi,
            editorMetadataStoreApi,
            roadId,
            { ...firstPartial, s, t, orientation, hOffset: 0, zOffset },
            headPresetIds[0],
            0,
            t,
            undefined,
            assemblyHeads[0].x,
            assemblyHeads[0].y,
          );
          const assembly = findAssemblyForSignal(editorMetadataStoreApi, signal.id);
          if (assembly) {
            for (let i = 1; i < assemblyHeads.length; i++) {
              addHeadToAssembly(
                odrStoreApi,
                editorMetadataStoreApi,
                assembly.assemblyId,
                assemblyHeads[i].presetId,
                'lower',
                assemblyHeads[i].x,
                assemblyHeads[i].y,
              );
            }
          }
        }
      }
    },
    [odrStoreApi, editorMetadataStoreApi, odrDocument],
  );

  const handleSignalGhostUpdate = useCallback(
    (ghost: SignalPlaceGhost | null) => {
      setSignalPlaceGhost(ghost);
    },
    [setSignalPlaceGhost],
  );

  const handleSignalMove = useCallback(
    (
      roadId: string,
      signalId: string,
      newS: number,
      newT: number,
      armInfo?: { armLength: number; armAngle: number },
    ) => {
      const store = odrStoreApi.getState();
      store.updateSignal(roadId, signalId, { s: newS, t: newT });

      // Update assembly metadata and pole/arm objects for arm-mounted signals
      if (armInfo) {
        const assembly = findAssemblyForSignal(editorMetadataStoreApi, signalId);
        if (assembly) {
          const road = odrDocument.roads.find((r) => r.id === roadId);
          if (road) {
            const pose = evaluateReferenceLineAtS(road.planView, newS);
            const z = evaluateElevation(road.elevationProfile, newS);
            const side: 'right' | 'left' = newT < 0 ? 'right' : 'left';
            const poleT = computePolePlacementT(road, newS, side);
            const poleWorld = stToXyz(pose, poleT, z);
            const headWorld = stToXyz(pose, newT, z);
            const armAngle = Math.atan2(headWorld.y - poleWorld.y, headWorld.x - poleWorld.x);

            updateAssembly(editorMetadataStoreApi, assembly.assemblyId, {
              armLength: armInfo.armLength,
              armAngle,
            });

            // Sync pole and arm objects
            const signal = road.signals.find((s) => s.id === signalId);
            const zOffset = signal?.zOffset ?? 5.0;
            if (assembly.poleObjectId) {
              store.updateRoad(roadId, {
                objects: road.objects.map((o) =>
                  o.id === assembly.poleObjectId
                    ? { ...o, s: newS, t: poleT, height: zOffset }
                    : o.id === assembly.armObjectId
                      ? {
                          ...o,
                          s: newS,
                          t: (poleT + newT) / 2,
                          zOffset,
                          length: armInfo.armLength,
                          hdg: newT > poleT ? Math.PI / 2 : -Math.PI / 2,
                        }
                      : o,
                ),
              });
            }
          }
        }
      }
    },
    [odrStoreApi, editorMetadataStoreApi, odrDocument],
  );

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

  // --- Road hover in select mode ---
  const [hoveredRoadId, setHoveredRoadId] = useState<string | null>(null);

  const handleRoadHover = useCallback(
    (roadId: string | null) => {
      setHoveredRoadId(roadId);
    },
    [],
  );

  const hoveredRoadName = useMemo(() => {
    if (!hoveredRoadId) return null;
    const road = odrDocument.roads.find((r) => r.id === hoveredRoadId);
    if (!road) return null;
    return road.name || `Road ${road.id}`;
  }, [hoveredRoadId, odrDocument.roads]);

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
              <RoadNetworkToolbar cursorInfo={cursorInfo} onJunctionConfirm={handleJunctionConfirm} hoveredRoadName={hoveredRoadName} />
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
                  onRoadHover={handleRoadHover}
                  laneEditActive={laneEditMode}
                  laneEditRoadId={laneEdit.activeRoadId}
                  onLaneHover={handleLaneHover}
                  onLaneClick={handleLaneClick}
                  onLaneContextMenu={handleLaneContextMenu}
                  onRoadSurfaceContextMenu={handleRoadSurfaceContextMenu}
                  onSectionBoundaryDragEnd={handleSectionBoundaryDragEnd}
                  laneEditSubMode={laneEditSubMode}
                  onSplitClick={handleSplitClick}
                  onTaperClick={handleTaperClick}
                  taperCreationPhase={taperCreation.phase}
                  taperStartS={taperCreation.startS}
                  taperSide={taperCreation.side}
                  junctionCreateActive={junctionCreateMode}
                  junctionCreateSelectedEndpoints={junctionCreate.selectedEndpoints}
                  junctionCreateHoveredEndpoint={junctionCreate.hoveredEndpoint}
                  onJunctionEndpointClick={handleJunctionEndpointClick}
                  onJunctionEndpointHover={handleJunctionEndpointHover}
                  selectedSignalKey={selectedSignalKey}
                  onSignalSelect={handleSignalSelect}
                  signalAssemblyMap={signalAssemblyMap}
                  signalPlaceActive={signalPlaceMode}
                  signalPlaceSubMode={signalPlace.subMode}
                  signalPlaceTSnapMode={signalPlace.tSnapMode}
                  signalPlaceGhost={signalPlace.ghostPreview}
                  onSignalPlace={handleSignalPlace}
                  onSignalGhostUpdate={handleSignalGhostUpdate}
                  onSignalMove={handleSignalMove}
                  selectedJunctionId={selectedJunctionId}
                  onJunctionClick={handleJunctionClick}
                  onJunctionContextMenu={handleJunctionContextMenu}
                />
              </ErrorBoundary>
              </div>
              {/* Context menus & tooltips — portalled to body to avoid transform containment from `enter` animation */}
              {createPortal(
                <>
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
                  {laneContextMenu && (
                    <LaneContextMenu
                      position={{ x: laneContextMenu.screenX, y: laneContextMenu.screenY }}
                      roadId={laneContextMenu.roadId}
                      sectionIdx={laneContextMenu.sectionIdx}
                      laneId={laneContextMenu.laneId}
                      side={laneContextMenu.side}
                      isLastLane={(() => {
                        const road = odrDocument.roads.find((r) => r.id === laneContextMenu.roadId);
                        if (!road) return false;
                        const section = road.lanes[laneContextMenu.sectionIdx];
                        if (!section) return false;
                        const lanes = laneContextMenu.side === 'left' ? section.leftLanes : section.rightLanes;
                        return lanes.length <= 1;
                      })()}
                      onAddLaneLeft={handleAddLaneLeft}
                      onAddLaneRight={handleAddLaneRight}
                      onDeleteLane={handleDeleteLane}
                      onClose={() => setLaneContextMenu(null)}
                    />
                  )}
                  {roadSectionContextMenu && (
                    <RoadSectionContextMenu
                      position={{ x: roadSectionContextMenu.screenX, y: roadSectionContextMenu.screenY }}
                      roadId={roadSectionContextMenu.roadId}
                      s={roadSectionContextMenu.s}
                      onSplitSection={handleSplitSection}
                      onClose={() => setRoadSectionContextMenu(null)}
                    />
                  )}
                  {/* Lane edit tooltip */}
                  {laneEditMode && laneEdit.hoveredLane && (
                    <div
                      className="fixed z-40 px-2 py-1 text-[10px] font-mono text-[var(--color-text-primary)] bg-[var(--color-popover)] backdrop-blur-[28px] border border-[var(--color-glass-edge)] rounded-none shadow-sm pointer-events-none"
                      style={{ left: laneEdit.hoveredLane.screenX + 16, top: laneEdit.hoveredLane.screenY - 24 }}
                    >
                      Lane {laneEdit.hoveredLane.laneId} · Section {laneEdit.hoveredLane.sectionIdx}
                    </div>
                  )}
                </>,
                document.body,
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
                          onLaneWidthChange={handleLaneWidthChange}
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
              {junctionCreateMode && junctionEndpoints.length >= 2 ? (
                <JunctionRoutingPanel endpoints={junctionEndpoints} />
              ) : roadCreationMode ? (
                <RoadStylePanel />
              ) : signalPlaceMode ? (
                <SignalPlaceToolPanel />
              ) : laneEditMode && laneEdit.activeRoadId ? (
                (() => {
                  const laneRoad = odrDocument.roads.find((r) => r.id === laneEdit.activeRoadId);
                  if (!laneRoad) return null;
                  return (
                    <OdrLaneSectionPropertyEditor
                      road={laneRoad}
                      selectedSectionIndices={laneEdit.selectedSectionIndices}
                      taperLength={laneEdit.taperLength}
                      useLaneOffset={laneEdit.useLaneOffset}
                      onTaperLengthChange={setTaperLength}
                      onUseLaneOffsetChange={setUseLaneOffset}
                    />
                  );
                })()
              ) : (
                <OdrPropertyEditor
                  document={odrDocument}
                  selectedRoadId={selectedRoadId}
                  selectedJunctionId={selectedJunctionId}
                  selectedSignalId={selectedSignalId}
                  selectedLaneId={selectedLaneId}
                  activeSectionIdx={selectedLaneSectionIdx ?? activeLaneSectionIdx}
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

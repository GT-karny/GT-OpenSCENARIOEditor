import { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { SceneComposerView } from '../scene-composer/SceneComposerView';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { ImperativePanelHandle, ImperativePanelGroupHandle } from 'react-resizable-panels';
import { FolderTree } from 'lucide-react';
import type { Node } from '@xyflow/react';
import { NodeEditorProvider, NodeEditor, detectElementType } from '@osce/node-editor';
import type { OsceNodeData, OsceNodeType } from '@osce/node-editor';
import { ScenarioViewer } from '@osce/3d-viewer';
import type { ViewerMode, PickedPositionData } from '@osce/3d-viewer';
import { worldToLane } from '@osce/opendrive';
import { HeaderToolbar } from './HeaderToolbar';
import { StatusBar } from './StatusBar';
import { EntityListPanel } from '../panels/EntityListPanel';
import { VariablesPanel } from '../panels/VariablesPanel';
import { PropertyPanel } from '../panels/PropertyPanel';
import { ValidationPanel } from '../panels/ValidationPanel';
import { SimulationTimeline } from '../panels/SimulationTimeline';
import { ErrorBoundary } from '../ErrorBoundary';
import { NodeEditorContextMenu } from '../node-editor/NodeEditorContextMenu';
import { WaypointContextMenu } from '../route/WaypointContextMenu';
import type { WaypointContextMenuPosition } from '../route/WaypointContextMenu';
import type { ContextMenuPosition } from '../node-editor/NodeEditorContextMenu';
import { DeleteConfirmationDialog } from '../node-editor/DeleteConfirmationDialog';
import { ParameterDialog } from '../template/ParameterDialog';
import { CatalogEditorModal } from '../catalog/CatalogEditorModal';
import { FileTreeSidebar } from '../editor/FileTreeSidebar';
import { SaveAsDialog } from '../editor/SaveAsDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTranslation } from '@osce/i18n';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { useProjectStore } from '../../stores/project-store';
import { useSimulationStore } from '../../stores/simulation-store';
import { useRouteEdit } from '../../hooks/use-route-edit';
import { useRoutePreview } from '../../hooks/use-route-preview';
import { useRoadManagerClient } from '../../hooks/use-road-manager-client';
import { useCatalogStore } from '../../stores/catalog-store';
import { useTemplateDrop } from '../../hooks/use-template-drop';
import { useElementDelete } from '../../hooks/use-element-delete';
import { useElementAdd } from '../../hooks/use-element-add';
import { getDirectChildCount } from '../../lib/count-descendants';
import { useFileOperations } from '../../hooks/use-file-operations';
import { useProjectFileOperations } from '../../hooks/use-project-file-operations';
import { buildFullPathToIdMap } from '../../lib/fullpath-mapping';
import { buildCatalogLocationsFromProject } from '../../lib/catalog-location-utils';
import { RoadNetworkEditorLayout } from '../opendrive/RoadNetworkEditorLayout';

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

/**
 * Thin wrapper that computes the current display frame from the simulation store,
 * so only the 3D viewer re-renders on frame changes (not the entire EditorLayout).
 */
const SimulationViewerBridge = memo(function SimulationViewerBridge(props: {
  scenarioStore: ReturnType<typeof import('../../stores/use-scenario-store').useScenarioStoreApi>;
  openDriveDocument: import('@osce/shared').OpenDriveDocument | null;
  selectedEntityId: string | null;
  hoveredEntityName: string | null;
  onEntitySelect: (entityId: string) => void;
  onEntityFocus: (entityId: string) => void;
  onEntityPositionChange?: (entityName: string, x: number, y: number, z: number, h: number, forceWorldPosition?: boolean) => void;
  onViewerModeChange?: (mode: ViewerMode) => void;
  preferences: { showGrid3D: boolean; showLaneIds: boolean; showRoadIds: boolean };
  focusEntityId?: string | null;
  // Route editing props
  routeEditActive?: boolean;
  routeWaypoints?: Array<{ x: number; y: number; z: number; h: number }>;
  routePathSegments?: Array<Array<{ x: number; y: number; z: number }>>;
  routeSelectedWaypointIndex?: number | null;
  onRouteWaypointClick?: (index: number) => void;
  onRouteWaypointContextMenu?: (index: number, event: unknown) => void;
  onRouteLineClick?: (segmentIndex: number, event: unknown) => void;
  onRouteWaypointAdd?: (worldX: number, worldY: number, worldZ: number, heading: number, roadId: string, laneId: string, s: number, offset: number) => void;
  onRouteWaypointDragEnd?: (index: number, worldX: number, worldY: number, worldZ: number, heading: number, roadId: string, laneId: string, s: number, offset: number) => void;
  onRouteEditSave?: () => void;
  onRouteEditCancel?: () => void;
  routeWarnings?: string[];
  routeWaypointCount?: number;
  resolveCatalogRoute?: (ref: { catalogName: string; entryName: string }) => import('@osce/shared').Route | null;
  routePreviewData?: import('@osce/3d-viewer').RoutePreviewData[];
  selectedSignalKey?: string | null;
  onSignalSelect?: (key: string) => void;
  positionPickActive?: boolean;
  onPositionPicked?: (data: PickedPositionData) => void;
  onPositionPickCancel?: () => void;
  highlightedPositionElementIds?: string[];
}) {
  const simStatus = useSimulationStore((s) => s.status);
  const simFrames = useSimulationStore(useShallow((s) => s.frames));
  const currentFrameIndex = useSimulationStore((s) => s.currentFrameIndex);

  // Compute display frame based on simulation state:
  // - running: show the latest frame (live streaming)
  // - completed/error: show frame at currentFrameIndex (replay scrubbing)
  // - idle: no frame
  let currentFrame = null;
  if (simStatus === 'running' && simFrames.length > 0) {
    currentFrame = simFrames[simFrames.length - 1];
  } else if ((simStatus === 'completed' || simStatus === 'error') && simFrames.length > 0) {
    currentFrame = simFrames[currentFrameIndex] ?? simFrames[simFrames.length - 1];
  }

  // Diagnostic: log bridge renders
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  if (renderCountRef.current <= 5 || renderCountRef.current % 60 === 0) {
    console.warn(
      `[ViewerBridge] render #${renderCountRef.current}: status=${simStatus}, ` +
        `frameIndex=${currentFrameIndex}/${simFrames.length}, ` +
        `currentFrame=${currentFrame ? `t=${currentFrame.time.toFixed(3)}` : 'null'}`,
    );
  }

  return (
    <ScenarioViewer
      scenarioStore={props.scenarioStore}
      openDriveDocument={props.openDriveDocument}
      selectedEntityId={props.selectedEntityId}
      hoveredEntityName={props.hoveredEntityName}
      onEntitySelect={props.onEntitySelect}
      onEntityFocus={props.onEntityFocus}
      onEntityPositionChange={props.onEntityPositionChange}
      onViewerModeChange={props.onViewerModeChange}
      currentFrame={currentFrame}
      simulationStatus={simStatus}
      preferences={props.preferences}
      focusEntityId={props.focusEntityId}
      routeEditActive={props.routeEditActive}
      routeWaypoints={props.routeWaypoints}
      routePathSegments={props.routePathSegments}
      routeSelectedWaypointIndex={props.routeSelectedWaypointIndex}
      onRouteWaypointClick={props.onRouteWaypointClick}
      onRouteWaypointContextMenu={props.onRouteWaypointContextMenu}
      onRouteLineClick={props.onRouteLineClick}
      onRouteWaypointAdd={props.onRouteWaypointAdd}
      onRouteWaypointDragEnd={props.onRouteWaypointDragEnd}
      onRouteEditSave={props.onRouteEditSave}
      onRouteEditCancel={props.onRouteEditCancel}
      routeWarnings={props.routeWarnings}
      routeWaypointCount={props.routeWaypointCount}
      resolveCatalogRoute={props.resolveCatalogRoute}
      routePreviewData={props.routePreviewData}
      selectedSignalKey={props.selectedSignalKey}
      onSignalSelect={props.onSignalSelect}
      positionPickActive={props.positionPickActive}
      onPositionPicked={props.onPositionPicked}
      onPositionPickCancel={props.onPositionPickCancel}
      highlightedPositionElementIds={props.highlightedPositionElementIds}
      showPerf={false}
      className="h-full w-full"
    />
  );
});

interface DeleteRequest {
  id: string;
  elementName: string;
  elementType: string;
  childCount: number;
}

export function EditorLayout() {
  const { t } = useTranslation('common');
  const scenarioStoreApi = useScenarioStoreApi();
  const currentProject = useProjectStore((s) => s.currentProject);
  const editorMode = useEditorStore((s) => s.editorMode);
  const [centerTab, setCenterTab] = useState<'composer' | 'graph'>('composer');
  const fileTreePanelRef = useRef<ImperativePanelHandle>(null);
  const editingPanelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const [fileTreeCollapsed, setFileTreeCollapsed] = useState(true);

  // --- Collapse file tree on mount ---
  useEffect(() => {
    fileTreePanelRef.current?.collapse();
  }, []);

  // --- SaveAs dialog ---
  const showSaveAs = useEditorStore((s) => s.showSaveAs);
  const setShowSaveAs = useEditorStore((s) => s.setShowSaveAs);
  const saveAsFileType = useEditorStore((s) => s.saveAsFileType);
  const { handleSaveAs, handleSaveAsXodr } = useFileOperations();

  // --- Auto-load project catalogs ---
  const { autoLoadProjectCatalogs } = useProjectFileOperations();
  useEffect(() => {
    if (currentProject) {
      autoLoadProjectCatalogs();

      // Auto-populate CatalogLocations on the default document
      const doc = scenarioStoreApi.getState().document;
      if (Object.keys(doc.catalogLocations).length === 0) {
        const currentFilePath = useProjectStore.getState().currentFilePath;
        const catalogLocations = buildCatalogLocationsFromProject(
          currentProject.files,
          currentFilePath ?? '',
        );
        if (Object.keys(catalogLocations).length > 0) {
          scenarioStoreApi.setState({
            document: { ...doc, catalogLocations },
          });
        }
      }
    }
  }, [currentProject, autoLoadProjectCatalogs, scenarioStoreApi]);

  // --- Selection sync ---
  const selectedElementIds = useEditorStore(useShallow((s) => s.selection.selectedElementIds));
  const hoveredElementId = useEditorStore((s) => s.selection.hoveredElementId);
  const roadNetwork = useEditorStore((s) => s.roadNetwork);
  const preferences = useEditorStore((s) => s.preferences);
  const focusNodeId = useEditorStore((s) => s.focusNodeId);
  const focusEntityId = useEditorStore((s) => s.focusEntityId);
  const selectedEntityId = selectedElementIds.length === 1 ? selectedElementIds[0] : null;

  // Resolve ManeuverGroup selection → first actor entity ID for 3D highlighting
  const scenarioEntities = useStore(scenarioStoreApi, (s) => s.document.entities);
  const storyboardStories = useStore(scenarioStoreApi, (s) => s.document.storyboard.stories);
  const viewerSelectedEntityId = useMemo(() => {
    if (!selectedEntityId) return null;
    // Direct entity match — use as-is
    if (scenarioEntities.some((e) => e.id === selectedEntityId)) return selectedEntityId;
    // Try ManeuverGroup → resolve to first actor's entity ID
    for (const story of storyboardStories) {
      for (const act of story.acts) {
        for (const group of act.maneuverGroups) {
          if (group.id === selectedEntityId) {
            const firstActorName = group.actors.entityRefs[0];
            if (firstActorName) {
              return scenarioEntities.find((e) => e.name === firstActorName)?.id ?? null;
            }
          }
        }
      }
    }
    return selectedEntityId;
  }, [selectedEntityId, scenarioEntities, storyboardStories]);

  const handleSelectionChange = useCallback((ids: string[]) => {
    useEditorStore.getState().setSelection({ selectedElementIds: ids });
  }, []);

  const handleFocusComplete = useCallback(() => {
    useEditorStore.getState().setFocusNodeId(null);
  }, []);

  const handleEntitySelect = useCallback((entityId: string) => {
    useEditorStore.getState().setSelection({ selectedElementIds: [entityId] });
    // Entity selection clears signal selection (handled inside setSelection)
  }, []);

  const selectedSignalKey = useEditorStore((s) => s.selectedSignalKey);
  const positionPickRequest = useEditorStore((s) => s.positionPickRequest);

  const handleSignalSelect = useCallback((key: string) => {
    useEditorStore.getState().setSelectedSignalKey(key);
  }, []);

  const handlePositionPicked = useCallback((data: PickedPositionData) => {
    useEditorStore.getState().resolvePositionPick(data);
  }, []);

  const handlePositionPickCancel = useCallback(() => {
    useEditorStore.getState().cancelPositionPick();
  }, []);

  const handleEntityPositionChange = useCallback(
    (entityName: string, x: number, y: number, z: number, h: number, forceWorldPosition?: boolean) => {
      // When forceWorldPosition is true (snap OFF in Place mode), skip lane snapping
      if (!forceWorldPosition && roadNetwork) {
        const laneResult = worldToLane(roadNetwork, x, y, 10); // 10m threshold
        if (laneResult && laneResult.distance < 5) {
          scenarioStoreApi.getState().setInitPosition(entityName, {
            type: 'lanePosition',
            roadId: laneResult.roadId,
            laneId: String(laneResult.laneId),
            s: Math.round(laneResult.s * 100) / 100,
            offset: Math.abs(laneResult.offset) > 0.01
              ? Math.round(laneResult.offset * 100) / 100
              : undefined,
            orientation:
              Math.abs(h - laneResult.heading) > 0.01
                ? { h: h - laneResult.heading }
                : undefined,
          });
          return;
        }
      }

      scenarioStoreApi.getState().setInitPosition(entityName, {
        type: 'worldPosition',
        x,
        y,
        h,
        z: z !== 0 ? z : undefined,
      });
    },
    [scenarioStoreApi, roadNetwork],
  );

  // --- Simulation state ---
  const [viewerMode, setViewerMode] = useState<ViewerMode>('edit');
  const handleViewerModeChange = useCallback(
    (mode: ViewerMode) => {
      if (mode === 'edit') {
        useSimulationStore.getState().pause();
      }
      setViewerMode(mode);
    },
    [],
  );

  // Reset viewerMode to 'edit' when switching editor modes (scenario ↔ roadNetwork)
  useEffect(() => {
    setViewerMode('edit');
  }, [editorMode]);

  const simStatus = useSimulationStore((s) => s.status);
  // NOTE: Do NOT subscribe to s.frames here — it changes 30x/sec and would
  // re-render the entire EditorLayout. Frames are subscribed in
  // SimulationViewerBridge below, which only re-renders the 3D viewer.
  const activeElements = useSimulationStore(useShallow((s) => s.activeElements));

  const activeNodeIds = useMemo(() => {
    if (activeElements.length === 0) return [];
    const doc = scenarioStoreApi.getState().document;
    const map = buildFullPathToIdMap(doc);
    return activeElements
      .map((path) => map.get(path))
      .filter((id): id is string => id !== undefined);
  }, [activeElements, scenarioStoreApi]);

  // --- Route editing ---
  const roadManagerClient = useRoadManagerClient();
  const routeEdit = useRouteEdit(roadNetwork, roadManagerClient);
  const updateCatalogEntry = useCatalogStore((s) => s.updateEntry);
  const catalogResolveReference = useCatalogStore((s) => s.resolveReference);

  // --- Route preview (read-only visualization for selected entity/action) ---
  const routePreviewData = useRoutePreview(scenarioStoreApi, roadNetwork, roadManagerClient);

  const resolveCatalogRoute = useCallback(
    (ref: { catalogName: string; entryName: string }) => {
      const resolved = catalogResolveReference({
        kind: 'catalogReference',
        catalogName: ref.catalogName,
        entryName: ref.entryName,
        parameterAssignments: [],
      });
      if (resolved && resolved.catalogType === 'route') {
        return resolved.definition as import('@osce/shared').Route;
      }
      return null;
    },
    [catalogResolveReference],
  );

  const handleRouteWaypointAdd = useCallback(
    (
      _worldX: number, _worldY: number, _worldZ: number, _heading: number,
      roadId: string, laneId: string, s: number, _offset: number,
    ) => {
      // Route waypoints always snap to lane center (no lateral offset)
      routeEdit.addWaypoint({
        type: 'lanePosition',
        roadId,
        laneId,
        s: Math.round(s * 100) / 100,
      });
    },
    [routeEdit],
  );

  const handleRouteWaypointClick = useCallback(
    (index: number) => {
      routeEdit.selectWaypoint(index);
    },
    [routeEdit],
  );

  // --- Waypoint context menu ---
  const [waypointContextMenu, setWaypointContextMenu] =
    useState<WaypointContextMenuPosition | null>(null);

  const handleRouteWaypointContextMenu = useCallback(
    (index: number, event: unknown) => {
      const nativeEvent = (event as { nativeEvent?: MouseEvent })?.nativeEvent;
      if (!nativeEvent) return;
      nativeEvent.preventDefault();
      setWaypointContextMenu({
        x: nativeEvent.clientX,
        y: nativeEvent.clientY,
        waypointIndex: index,
      });
    },
    [],
  );

  const handleRouteWaypointDragEnd = useCallback(
    (
      index: number,
      _worldX: number, _worldY: number, _worldZ: number, _heading: number,
      roadId: string, laneId: string, s: number, _offset: number,
    ) => {
      // Route waypoints always snap to lane center (no lateral offset)
      routeEdit.updateWaypointPosition(index, {
        type: 'lanePosition',
        roadId,
        laneId,
        s: Math.round(s * 100) / 100,
      });
    },
    [routeEdit],
  );

  const handleRouteLineClick = useCallback(
    (segmentIndex: number, event: unknown) => {
      if (!routeEdit.editingRoute || !roadNetwork) return;

      // Extract click position from ThreeEvent
      const threeEvent = event as { point?: { x: number; y: number; z: number } };
      if (threeEvent?.point) {
        // ThreeEvent point is in Three.js world coords (inside rotation group)
        // Convert to OpenDRIVE: odrX = point.x, odrY = -point.z
        const odrX = threeEvent.point.x;
        const odrY = -threeEvent.point.z;
        const lane = worldToLane(roadNetwork, odrX, odrY, 20);
        if (lane) {
          routeEdit.insertWaypoint(segmentIndex, {
            type: 'lanePosition',
            roadId: lane.roadId,
            laneId: String(lane.laneId),
            s: Math.round(lane.s * 100) / 100,
            offset: Math.abs(lane.offset) > 0.01
              ? Math.round(lane.offset * 100) / 100
              : undefined,
          });
          return;
        }
      }

      // Fallback: duplicate segment start position
      const wp = routeEdit.editingRoute.waypoints[segmentIndex];
      if (!wp) return;
      routeEdit.insertWaypoint(segmentIndex, wp.position);
    },
    [routeEdit, roadNetwork],
  );

  const handleRouteEditSave = useCallback(() => {
    routeEdit.saveRoute(
      // For action source: update via scenario store
      (actionId, updates) => {
        scenarioStoreApi.getState().updateAction(actionId, updates);
      },
      // For catalog source: update via catalog store
      (catalogName, entryIndex, route) => {
        updateCatalogEntry(catalogName, entryIndex, {
          catalogType: 'route',
          definition: route,
        });
      },
    );
  }, [routeEdit, scenarioStoreApi, updateCatalogEntry]);

  const handleRouteEditCancel = useCallback(() => {
    routeEdit.cancelRoute();
  }, [routeEdit]);

  // --- Drag & Drop ---
  const {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragOver,
    droppedUseCase,
    dialogOpen: dropDialogOpen,
    handleDialogClose: handleDropDialogClose,
    handleApply: handleDropApply,
  } = useTemplateDrop();

  // --- Context Menu ---
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);

  const handlePaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: null, nodeType: null });
  }, []);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node<OsceNodeData>) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        nodeType: node.data.osceType,
      });
    },
    [],
  );

  // --- Add Child ---
  const { addChildToNode } = useElementAdd();

  const handleAddChild = useCallback(
    (childType: OsceNodeType) => {
      addChildToNode(contextMenu?.nodeId ?? null, childType);
    },
    [contextMenu, addChildToNode],
  );

  // --- Delete with confirmation ---
  const { deleteElementById } = useElementDelete();
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const store = scenarioStoreApi.getState();
      const element = store.getElementById(nodeId);
      if (!element) return;

      const type = detectElementType(element);
      if (!type) return;

      const childCount = getDirectChildCount(element, type);
      const name = (element as { name?: string }).name ?? type;

      if (childCount > 0) {
        setDeleteRequest({ id: nodeId, elementName: name, elementType: type, childCount });
      } else {
        deleteElementById(nodeId);
        useEditorStore.getState().clearSelection();
      }
    },
    [scenarioStoreApi, deleteElementById],
  );

  const handleConfirmDelete = useCallback(() => {
    if (deleteRequest) {
      deleteElementById(deleteRequest.id);
      useEditorStore.getState().clearSelection();
    }
    setDeleteRequest(null);
  }, [deleteRequest, deleteElementById]);

  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      <HeaderToolbar />

      {editorMode === 'roadNetwork' ? (
        <>
          <RoadNetworkEditorLayout />

          <StatusBar />

          {/* SaveAs Dialog */}
          <SaveAsDialog
            open={showSaveAs}
            onOpenChange={setShowSaveAs}
            onSave={saveAsFileType === 'xodr' ? handleSaveAsXodr : handleSaveAs}
            fileType={saveAsFileType}
          />
        </>
      ) : (
      <>
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Left section: 3D Viewer (top) + Editing area (bottom) */}
        <Panel defaultSize={75} minSize={40}>
          <PanelGroup direction="vertical">
            {/* 3D Viewer (top) */}
            <Panel defaultSize={30} minSize={10}>
              <div data-testid="viewer-3d-panel" className="h-full bg-[var(--color-bg-deep)] enter d5">
                <ErrorBoundary fallbackTitle="3D Viewer Error">
                  <SimulationViewerBridge
                    scenarioStore={scenarioStoreApi}
                    openDriveDocument={roadNetwork}
                    selectedEntityId={viewerSelectedEntityId}
                    hoveredEntityName={hoveredElementId}
                    onEntitySelect={handleEntitySelect}
                    onEntityFocus={(entityId) => {
                      handleEntitySelect(entityId);
                      useEditorStore.getState().setFocusEntityId(null);
                    }}
                    onEntityPositionChange={handleEntityPositionChange}
                    onViewerModeChange={handleViewerModeChange}
                    preferences={{
                      showGrid3D: preferences.showGrid3D,
                      showLaneIds: preferences.showLaneIds,
                      showRoadIds: preferences.showRoadIds,
                    }}
                    focusEntityId={focusEntityId}
                    routeEditActive={routeEdit.active}
                    routeWaypoints={routeEdit.waypointWorldPositions}
                    routePathSegments={routeEdit.pathSegments}
                    routeSelectedWaypointIndex={routeEdit.selectedWaypointIndex}
                    onRouteWaypointClick={handleRouteWaypointClick}
                    onRouteWaypointContextMenu={handleRouteWaypointContextMenu}
                    onRouteLineClick={handleRouteLineClick}
                    onRouteWaypointAdd={handleRouteWaypointAdd}
                    onRouteWaypointDragEnd={handleRouteWaypointDragEnd}
                    onRouteEditSave={handleRouteEditSave}
                    onRouteEditCancel={handleRouteEditCancel}
                    routeWarnings={routeEdit.warnings}
                    routeWaypointCount={routeEdit.editingRoute?.waypoints.length ?? 0}
                    resolveCatalogRoute={resolveCatalogRoute}
                    routePreviewData={routePreviewData}
                    selectedSignalKey={selectedSignalKey}
                    onSignalSelect={handleSignalSelect}
                    positionPickActive={positionPickRequest != null}
                    onPositionPicked={handlePositionPicked}
                    onPositionPickCancel={handlePositionPickCancel}
                    highlightedPositionElementIds={selectedElementIds}
                  />
                </ErrorBoundary>
                {waypointContextMenu && (
                  <WaypointContextMenu
                    position={waypointContextMenu}
                    onSelect={() => {
                      routeEdit.selectWaypoint(waypointContextMenu.waypointIndex);
                      setWaypointContextMenu(null);
                    }}
                    onDelete={() => {
                      routeEdit.removeWaypoint(waypointContextMenu.waypointIndex);
                      setWaypointContextMenu(null);
                    }}
                    onClose={() => setWaypointContextMenu(null)}
                  />
                )}
              </div>
            </Panel>

            <ResizeHandleH />

            {/* Editing area */}
            <Panel defaultSize={70} minSize={30}>
              <PanelGroup
                direction="horizontal"
                ref={editingPanelGroupRef}
              >
                {/* File Tree sidebar (project mode only) */}
                {currentProject && (
                  <>
                    <Panel
                      ref={fileTreePanelRef}
                      defaultSize={15}
                      minSize={3}
                      maxSize={25}
                      collapsible
                      collapsedSize={3}
                      onCollapse={() => {
                        setFileTreeCollapsed(true);
                        // Redistribute freed space to Composer (3rd panel), not Entity
                        // Layout: [FileTree, Entity, Composer] → [3%, 25%, 72%]
                        editingPanelGroupRef.current?.setLayout([3, 25, 72]);
                      }}
                      onExpand={() => {
                        setFileTreeCollapsed(false);
                        // Restore: take space from Composer
                        editingPanelGroupRef.current?.setLayout([15, 25, 60]);
                      }}
                    >
                      {fileTreeCollapsed ? (
                        <div className="flex flex-col items-center h-full bg-[var(--color-bg-deep)] border-r border-[var(--color-glass-edge-mid)] py-2">
                          <button
                            type="button"
                            onClick={() => fileTreePanelRef.current?.expand()}
                            className="p-2 rounded hover:bg-[var(--color-glass-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                            title={t('fileTree.expand')}
                          >
                            <FolderTree size={16} />
                          </button>
                        </div>
                      ) : (
                        <FileTreeSidebar
                          onCollapse={() => fileTreePanelRef.current?.collapse()}
                        />
                      )}
                    </Panel>
                    <ResizeHandle />
                  </>
                )}

                {/* Left sidebar — Entity/Parameter */}
                <Panel defaultSize={25} minSize={8} maxSize={35}>
                  <div className="h-full bg-[var(--color-bg-deep)] enter-l">
                    <Tabs defaultValue="entities" className="flex flex-col h-full">
                      <TabsList className="bg-[var(--color-glass-1)] backdrop-blur-[28px] rounded-none p-0">
                        <TabsTrigger value="entities" className="apex-tab flex-1">
                          {t('panels.entityList')}
                        </TabsTrigger>
                        <TabsTrigger value="variables" className="apex-tab flex-1">
                          {t('panels.variables')}
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="entities" className="flex-1 overflow-hidden mt-0">
                        <EntityListPanel />
                      </TabsContent>
                      <TabsContent value="variables" className="flex-1 overflow-hidden mt-0">
                        <VariablesPanel />
                      </TabsContent>
                    </Tabs>
                  </div>
                </Panel>

                <ResizeHandle />

                {/* Center area: Composer / Graph */}
                <Panel defaultSize={60} minSize={30}>
                  <NodeEditorProvider
                    scenarioStore={scenarioStoreApi}
                    selectedElementIds={selectedElementIds}
                    onSelectionChange={handleSelectionChange}
                    focusNodeId={focusNodeId}
                    onFocusComplete={handleFocusComplete}
                    activeNodeIds={activeNodeIds}
                  >
                    <div className="flex flex-col h-full enter d2">
                      {/* Tab bar */}
                      <Tabs value={centerTab} onValueChange={(v) => setCenterTab(v as 'composer' | 'graph')} className="flex flex-col h-full">
                        <TabsList className="bg-[var(--color-glass-1)] backdrop-blur-[28px] rounded-none p-0">
                          <TabsTrigger value="composer" className="apex-tab flex-1">
                            Composer
                          </TabsTrigger>
                          <TabsTrigger value="graph" className="apex-tab flex-1">
                            Graph
                          </TabsTrigger>
                        </TabsList>
                      {/* Content — both views stay mounted to preserve React Flow state */}
                      <div className="flex-1 overflow-hidden relative">
                        <div className={`absolute inset-0 ${centerTab !== 'composer' ? 'hidden' : ''}`}>
                          <SceneComposerView />
                        </div>
                        <div className={`absolute inset-0 ${centerTab !== 'graph' ? 'hidden' : ''}`}>
                          <ErrorBoundary fallbackTitle="Node Editor Error">
                            <div
                              data-testid="node-editor-panel"
                              className={`h-full node-editor-grid ${isDragOver ? 'ring-2 ring-[var(--color-accent-1)] ring-inset' : ''}`}
                              onDragLeave={handleDragLeave}
                            >
                              <NodeEditor
                                className="h-full"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onPaneContextMenu={handlePaneContextMenu}
                                onNodeContextMenu={handleNodeContextMenu}
                                deleteKeyCode={null}
                                disableBuiltinShortcuts
                              />
                            </div>
                          </ErrorBoundary>
                        </div>
                      </div>
                      </Tabs>
                    </div>
                  </NodeEditorProvider>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </Panel>

        <ResizeHandle />

        {/* Right sidebar — full height */}
        <Panel defaultSize={25} minSize={12} maxSize={35}>
          <div className="h-full bg-[var(--color-bg-deep)] enter-r">
            <Tabs defaultValue="properties" className="flex flex-col h-full">
              <TabsList className="bg-[var(--color-glass-1)] backdrop-blur-[28px] rounded-none p-0">
                <TabsTrigger value="properties" className="apex-tab flex-1">
                  {t('panels.properties')}
                </TabsTrigger>
                <TabsTrigger value="validation" className="apex-tab flex-1">
                  {t('panels.validation')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="properties" className="flex-1 overflow-hidden mt-0">
                <PropertyPanel />
              </TabsContent>
              <TabsContent value="validation" className="flex-1 overflow-hidden mt-0">
                <ValidationPanel />
              </TabsContent>
            </Tabs>
          </div>
        </Panel>
      </PanelGroup>

      {/* Simulation timeline (visible during/after simulation in play mode) */}
      {simStatus !== 'idle' && viewerMode === 'play' && (
        <div className="h-10 shrink-0 border-t border-[var(--color-glass-edge-mid)] bg-[var(--color-bg-deep)]">
          <SimulationTimeline />
        </div>
      )}

      <StatusBar />

      {/* Catalog Editor Modal */}
      <CatalogEditorModal />

      {/* D&D Parameter Dialog */}
      <ParameterDialog
        open={dropDialogOpen}
        onOpenChange={handleDropDialogClose}
        useCase={droppedUseCase}
        onApply={handleDropApply}
      />

      {/* Context Menu */}
      {contextMenu && (
        <NodeEditorContextMenu
          position={contextMenu}
          onAddChild={handleAddChild}
          onDeleteNode={handleDeleteNode}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* SaveAs Dialog */}
      <SaveAsDialog
        open={showSaveAs}
        onOpenChange={setShowSaveAs}
        onSave={handleSaveAs}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteRequest !== null}
        onOpenChange={(open) => { if (!open) setDeleteRequest(null); }}
        elementName={deleteRequest?.elementName ?? ''}
        elementType={deleteRequest?.elementType ?? ''}
        childCount={deleteRequest?.childCount ?? 0}
        onConfirm={handleConfirmDelete}
      />
      </>
      )}
    </div>
  );
}

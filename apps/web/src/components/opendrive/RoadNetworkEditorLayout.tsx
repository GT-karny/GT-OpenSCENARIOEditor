import { useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { OdrRoad, OdrLane, OdrSignal, OdrJunction, OdrHeader, OpenDriveDocument } from '@osce/shared';
import { syncLaneLinksForDirectConnections } from '@osce/opendrive-engine';
import { ScenarioViewer } from '@osce/3d-viewer';
import type {
  RoadEditingConfig,
  LaneEditConfig,
  JunctionToolsConfig,
  SignalPlaceConfig,
  SignalSelectionConfig,
} from '@osce/3d-viewer';
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
import { changeLaneWidth } from '@osce/opendrive-engine';
import { ValidationPanel } from '../panels/ValidationPanel';
import { useEditorStore } from '../../stores/editor-store';
import { useDocumentRegistry } from '../../stores/document-registry';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import {
  useOpenDriveStore,
  useOpenDriveStoreApi,
  useOdrSidebarStore,
} from '../../hooks/use-opendrive-store';
import { editorMetadataStoreApi } from '../../stores/editor-metadata-store-instance';
import { useEditorSelection } from '../../hooks/opendrive/use-editor-selection';
import { usePlanViewEditing } from '../../hooks/opendrive/use-plan-view-editing';
import { useRoadLinking } from '../../hooks/opendrive/use-road-linking';
import { useRoadCreation } from '../../hooks/opendrive/use-road-creation';
import { useLaneTools } from '../../hooks/opendrive/use-lane-tools';
import { useJunctionTools } from '../../hooks/opendrive/use-junction-tools';
import { useSignalPlacement } from '../../hooks/opendrive/use-signal-placement';
import { useRoadNetworkKeyboard } from '../../hooks/opendrive/use-road-network-keyboard';

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

        // Re-stamp the verbatim text at the post-load, post-auto-correction
        // revision so neither the initial load nor the automatic lane-link
        // correction counts as an edit. The provisional stamp set by the loader
        // survives loadDocument (reverse-sync no longer touches the cache), and
        // its validity is revision-derived in simulation-xodr.ts.
        const cache = useEditorStore.getState().roadNetworkRawXml;
        if (cache) {
          useEditorStore.getState().setRoadNetworkRawXml({
            text: cache.text,
            validForRevision: odrStoreApi.getState().getCommandHistory().getRevision(),
          });
        }

        // Registry: this post-load, post-auto-correction position is the clean
        // baseline. Derived dirty (revision !== savedRevision) takes over from
        // here — no hand-set flag.
        useDocumentRegistry.getState().markLoaded('roadNetwork');
      }
    }
  }, [roadNetwork, odrStoreApi]);

  // Sync openDriveStore → editorStore.roadNetwork reactively. Neither dirty nor
  // the raw xodr passthrough is handled here anymore: dirty is derived from the
  // command-history revision by the DocumentRegistry, and the verbatim text's
  // validity is revision-derived in simulation-xodr.ts (an undo back to the load
  // baseline re-validates it automatically). This mirror only forwards the live
  // document object; it deliberately does not touch roadNetworkRawXml.
  useEffect(() => {
    let mounted = true;
    const unsub = odrStoreApi.subscribe((state: { document: OpenDriveDocument }) => {
      if (!mounted) return;
      useEditorStore.getState().setRoadNetwork(state.document);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [odrStoreApi]);

  // --- Active tool + tool-specific store slices ---
  const activeTool = useOdrSidebarStore((s) => s.activeTool);
  const roadCreationMode = activeTool === 'road-create';
  const laneEditMode = activeTool === 'lane-edit';
  const junctionCreateMode = activeTool === 'junction-create';
  const signalPlaceMode = activeTool === 'signal-place';

  const laneEdit = useOdrSidebarStore((s) => s.laneEdit);
  const setTaperLength = useOdrSidebarStore((s) => s.setTaperLength);
  const setUseLaneOffset = useOdrSidebarStore((s) => s.setUseLaneOffset);
  const laneEditSubMode = laneEdit.subMode;

  const roadCreation = useOdrSidebarStore((s) => s.roadCreation);
  const junctionCreate = useOdrSidebarStore((s) => s.junctionCreate);
  const signalPlace = useOdrSidebarStore((s) => s.signalPlace);

  // Auto-junction detection on road geometry changes
  const { checkForIntersections } = useAutoJunctionDetection({
    enabled: true,
    odrStoreApi,
    editorMetadataStoreApi,
  });

  // --- Per-tool hooks ---
  const selection = useEditorSelection({ roads: odrDocument.roads });
  const {
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
    hoveredRoadName,
    handleLaneSelect,
    handleSignalSelect,
    handleRoadSelect,
    handleRoadHover,
  } = selection;

  const planView = usePlanViewEditing({
    odrStoreApi,
    roads: odrDocument.roads,
    selectedRoadId,
    checkForIntersections,
  });

  const linking = useRoadLinking({ odrStoreApi, roads: odrDocument.roads });

  const creation = useRoadCreation({
    odrStoreApi,
    roadCount: odrDocument.roads.length,
    handleRoadLinkSet: linking.handleRoadLinkSet,
    checkForIntersections,
  });

  const laneTools = useLaneTools({
    odrStoreApi,
    roads: odrDocument.roads,
    setSelectedLaneId,
    setSelectedLaneSectionIdx,
  });

  const junctionTools = useJunctionTools({
    odrStoreApi,
    roads: odrDocument.roads,
    junctionCreateMode,
    selectedJunctionId,
  });

  const signals = useSignalPlacement({ odrStoreApi, document: odrDocument });

  // Consolidated keyboard handling (Delete / Escape / Enter)
  useRoadNetworkKeyboard({
    onDeleteSelectedGeometry: planView.handleDeleteSelectedGeometry,
    onJunctionConfirm: junctionTools.handleJunctionConfirm,
  });

  const handleLaneWidthChange = useCallback(
    (laneId: number, newWidth: number) => {
      if (!selectedRoadId) return;
      const store = odrStoreApi.getState();
      changeLaneWidth(store, selectedRoadId, activeLaneSectionIdx, laneId, newWidth);
    },
    [odrStoreApi, selectedRoadId, activeLaneSectionIdx],
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
      const side = laneId > 0 ? 'left' : laneId < 0 ? 'right' : 'center';
      odrStoreApi
        .getState()
        .updateLane(roadId, sectionIdx, side as 'left' | 'right' | 'center', laneId, updates);
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

  // Grouped viewer config objects, referentially stable so ScenarioViewer
  // (which re-renders at 30fps during simulation) does not churn on object identity.
  const roadEditingConfig = useMemo<RoadEditingConfig>(
    () => ({
      active: true,
      selectedRoadId,
      selectedGeometryIndex: planView.selectedGeometryIndex,
      onGeometryDragEnd: planView.handleGeometryDragEnd,
      onStartpointDragEnd: planView.handleStartpointDragEnd,
      onGeometrySelect: planView.handleGeometrySelect,
      creationModeActive: roadCreationMode,
      creationPhase: roadCreation.phase,
      creationStartX: roadCreation.startX,
      creationStartY: roadCreation.startY,
      creationStartHdg: roadCreation.startHdg,
      creationCursorX: roadCreation.cursorX,
      creationCursorY: roadCreation.cursorY,
      creationLanes: creation.creationLanes,
      onCreationStartPlace: creation.handleCreationStartPlace,
      onRoadCreate: creation.handleRoadCreate,
      onCreationCursorMove: creation.handleCreationCursorMove,
      onHeadingDragEnd: planView.handleHeadingDragEnd,
      onCurvatureDragEnd: planView.handleCurvatureDragEnd,
      onEndpointDragEnd: planView.handleEndpointDragEnd,
      onGeometryShiftClick: planView.handleGeometryShiftClick,
      selectedGeometryIndices: planView.selectedGeometryIndices,
      onLinkSet: linking.handleRoadLinkSet,
      onLinkUnset: linking.handleRoadLinkUnset,
      onEndpointContextMenu: linking.handleEndpointContextMenu,
      creationHasStartConstraint: creation.hasStartConstraint,
      selectModeActive: activeTool === 'select',
      onRoadSelect: handleRoadSelect,
      onRoadHover: handleRoadHover,
    }),
    [
      selectedRoadId,
      planView.selectedGeometryIndex,
      planView.handleGeometryDragEnd,
      planView.handleStartpointDragEnd,
      planView.handleGeometrySelect,
      roadCreationMode,
      roadCreation.phase,
      roadCreation.startX,
      roadCreation.startY,
      roadCreation.startHdg,
      roadCreation.cursorX,
      roadCreation.cursorY,
      creation.creationLanes,
      creation.handleCreationStartPlace,
      creation.handleRoadCreate,
      creation.handleCreationCursorMove,
      planView.handleHeadingDragEnd,
      planView.handleCurvatureDragEnd,
      planView.handleEndpointDragEnd,
      planView.handleGeometryShiftClick,
      planView.selectedGeometryIndices,
      linking.handleRoadLinkSet,
      linking.handleRoadLinkUnset,
      linking.handleEndpointContextMenu,
      creation.hasStartConstraint,
      activeTool,
      handleRoadSelect,
      handleRoadHover,
    ],
  );

  const laneEditConfig = useMemo<LaneEditConfig>(
    () => ({
      active: laneEditMode,
      roadId: laneEdit.activeRoadId,
      onLaneHover: laneTools.handleLaneHover,
      onLaneClick: laneTools.handleLaneClick,
      onLaneContextMenu: laneTools.handleLaneContextMenu,
      onRoadSurfaceContextMenu: laneTools.handleRoadSurfaceContextMenu,
      onSectionBoundaryDragEnd: laneTools.handleSectionBoundaryDragEnd,
      subMode: laneEditSubMode,
      onSplitClick: laneTools.handleSplitClick,
      onTaperClick: laneTools.handleTaperClick,
      taperCreationPhase: laneEdit.taperCreation.phase,
      taperStartS: laneEdit.taperCreation.startS,
      taperSide: laneEdit.taperCreation.side,
    }),
    [
      laneEditMode,
      laneEdit.activeRoadId,
      laneTools.handleLaneHover,
      laneTools.handleLaneClick,
      laneTools.handleLaneContextMenu,
      laneTools.handleRoadSurfaceContextMenu,
      laneTools.handleSectionBoundaryDragEnd,
      laneEditSubMode,
      laneTools.handleSplitClick,
      laneTools.handleTaperClick,
      laneEdit.taperCreation.phase,
      laneEdit.taperCreation.startS,
      laneEdit.taperCreation.side,
    ],
  );

  const junctionToolsConfig = useMemo<JunctionToolsConfig>(
    () => ({
      createActive: junctionCreateMode,
      createSelectedEndpoints: junctionCreate.selectedEndpoints,
      createHoveredEndpoint: junctionCreate.hoveredEndpoint,
      onEndpointClick: junctionTools.handleJunctionEndpointClick,
      onEndpointHover: junctionTools.handleJunctionEndpointHover,
      selectedJunctionId,
      onJunctionClick: junctionTools.handleJunctionClick,
      onJunctionContextMenu: junctionTools.handleJunctionContextMenu,
    }),
    [
      junctionCreateMode,
      junctionCreate.selectedEndpoints,
      junctionCreate.hoveredEndpoint,
      junctionTools.handleJunctionEndpointClick,
      junctionTools.handleJunctionEndpointHover,
      selectedJunctionId,
      junctionTools.handleJunctionClick,
      junctionTools.handleJunctionContextMenu,
    ],
  );

  const signalPlaceConfig = useMemo<SignalPlaceConfig>(
    () => ({
      active: signalPlaceMode,
      subMode: signalPlace.subMode,
      tSnapMode: signalPlace.tSnapMode,
      ghost: signalPlace.ghostPreview,
      onSignalPlace: signals.handleSignalPlace,
      onSignalGhostUpdate: signals.handleSignalGhostUpdate,
      onSignalMove: signals.handleSignalMove,
    }),
    [
      signalPlaceMode,
      signalPlace.subMode,
      signalPlace.tSnapMode,
      signalPlace.ghostPreview,
      signals.handleSignalPlace,
      signals.handleSignalGhostUpdate,
      signals.handleSignalMove,
    ],
  );

  const signalSelectionConfig = useMemo<SignalSelectionConfig>(
    () => ({
      selectedSignalKey,
      onSignalSelect: handleSignalSelect,
      signalAssemblyMap: signals.signalAssemblyMap,
    }),
    [selectedSignalKey, handleSignalSelect, signals.signalAssemblyMap],
  );

  const { endpointContextMenu } = linking;
  const { laneContextMenu, roadSectionContextMenu } = laneTools;
  const { junctionContextMenu } = junctionTools;

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
              <RoadNetworkToolbar cursorInfo={creation.cursorInfo} onJunctionConfirm={junctionTools.handleJunctionConfirm} hoveredRoadName={hoveredRoadName} />
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
                    showDrivingDirection: preferences.showDrivingDirection,
                  }}
                  showPerf={false}
                  className="h-full w-full"
                  roadEditing={roadEditingConfig}
                  laneEdit={laneEditConfig}
                  junctionTools={junctionToolsConfig}
                  signalPlace={signalPlaceConfig}
                  signalSelection={signalSelectionConfig}
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
                      onAddRoad={linking.handleAddRoadFromEndpoint}
                      onDisconnect={linking.handleDisconnectEndpoint}
                      onClose={linking.handleEndpointContextMenuClose}
                    />
                  )}
                  {junctionContextMenu && (
                    <JunctionContextMenu
                      position={{ x: junctionContextMenu.screenX, y: junctionContextMenu.screenY }}
                      junctionId={junctionContextMenu.junctionId}
                      onDelete={junctionTools.handleDeleteJunction}
                      onRegenerateConnections={junctionTools.handleRegenerateConnections}
                      onAddConnection={junctionTools.handleAddJunctionConnection}
                      onClose={junctionTools.handleJunctionContextMenuClose}
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
                      onAddLaneLeft={laneTools.handleAddLaneLeft}
                      onAddLaneRight={laneTools.handleAddLaneRight}
                      onDeleteLane={laneTools.handleDeleteLane}
                      onClose={() => laneTools.setLaneContextMenu(null)}
                    />
                  )}
                  {roadSectionContextMenu && (
                    <RoadSectionContextMenu
                      position={{ x: roadSectionContextMenu.screenX, y: roadSectionContextMenu.screenY }}
                      roadId={roadSectionContextMenu.roadId}
                      s={roadSectionContextMenu.s}
                      onSplitSection={laneTools.handleSplitSection}
                      onClose={() => laneTools.setRoadSectionContextMenu(null)}
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
              {junctionCreateMode && junctionTools.junctionEndpoints.length >= 2 ? (
                <JunctionRoutingPanel endpoints={junctionTools.junctionEndpoints} />
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
                  selectedGeometryIndex={planView.selectedGeometryIndex}
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

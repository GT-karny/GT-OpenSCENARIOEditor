import { useState, useCallback, useEffect, useMemo } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { OdrRoad, OdrLane, OdrSignal, OdrJunction, OdrHeader, OpenDriveDocument } from '@osce/shared';
import { createRoadFromPartial } from '@osce/opendrive-engine';
import { ScenarioViewer } from '@osce/3d-viewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { ErrorBoundary } from '../ErrorBoundary';
import { OdrPropertyEditor } from './property/OdrPropertyEditor';
import { OdrSidebar } from './sidebar/OdrSidebar';
import { CrossSectionView } from './cross-section/CrossSectionView';
import { CrossSectionToolbar } from './cross-section/CrossSectionToolbar';
import { ElevationGraphEditor } from './elevation/ElevationGraphEditor';
import { ValidationPanel } from '../panels/ValidationPanel';
import { useEditorStore } from '../../stores/editor-store';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import {
  useOpenDriveStore,
  useOpenDriveStoreApi,
  useOdrSidebarStore,
} from '../../hooks/use-opendrive-store';

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
      odrStoreApi.getState().loadDocument(roadNetwork);
    }
  }, []); // Only on mount

  // Sync openDriveStore → editorStore.roadNetwork reactively
  useEffect(() => {
    const unsub = odrStoreApi.subscribe((state: { document: OpenDriveDocument }) => {
      useEditorStore.getState().setRoadNetwork(state.document);
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

  const [centerTab, setCenterTab] = useState<'crossSection' | 'elevation'>('crossSection');
  const [sPosition, setSPosition] = useState(0);
  const [roadCreationMode, setRoadCreationMode] = useState(false);

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

  const handleGeometryDragEnd = useCallback(
    (roadId: string, geometryIndex: number, newX: number, newY: number) => {
      const road = odrDocument.roads.find((r) => r.id === roadId);
      if (!road) return;
      const updatedPlanView = [...road.planView];
      const geo = updatedPlanView[geometryIndex];
      if (geo) {
        updatedPlanView[geometryIndex] = { ...geo, x: newX, y: newY };
        odrStoreApi.getState().updateRoad(roadId, { planView: updatedPlanView });
      }
    },
    [odrDocument.roads, odrStoreApi],
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
      }
    },
    [odrDocument.roads, odrStoreApi],
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
      }
    },
    [odrDocument.roads, odrStoreApi],
  );

  // --- Road creation from 3D click ---
  const handleRoadCreate = useCallback(
    (x: number, y: number, hdg: number) => {
      const template = createRoadFromPartial({});
      const newRoad = odrStoreApi.getState().addRoad({
        name: `Road ${odrDocument.roads.length + 1}`,
        planView: [{ s: 0, x, y, hdg, length: 100, type: 'line' as const }],
        lanes: template.lanes,
      });
      useOdrSidebarStore.getState().setSelection({ type: 'road', id: newRoad.id });
      setRoadCreationMode(false);
    },
    [odrStoreApi, odrDocument.roads.length],
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
      // Junction update not in store yet
      console.warn('Junction update not yet implemented', junctionId, updates);
    },
    [],
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
            <div className="h-full bg-[var(--color-bg-deep)] enter d5">
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
                  onRoadGeometrySelect={handleGeometrySelect}
                  roadCreationModeActive={roadCreationMode}
                  onRoadCreate={handleRoadCreate}
                  onRoadHeadingDragEnd={handleHeadingDragEnd}
                  onRoadCurvatureDragEnd={handleCurvatureDragEnd}
                  onRoadGeometryShiftClick={handleGeometryShiftClick}
                  roadEditSelectedGeometryIndices={selectedGeometryIndices}
                />
              </ErrorBoundary>
            </div>
          </Panel>

          <ResizeHandleH />

          {/* Cross-Section / Elevation editor area */}
          <Panel defaultSize={45} minSize={15}>
            <div className="flex flex-col h-full bg-[var(--color-bg-deep)]">
              {/* Tab bar + content */}
              <Tabs
                value={centerTab}
                onValueChange={(v) => setCenterTab(v as 'crossSection' | 'elevation')}
                className="flex flex-col flex-1 min-h-0"
              >
                <TabsList className="bg-[var(--color-glass-1)] backdrop-blur-[28px] rounded-none p-0">
                  <TabsTrigger value="crossSection" className="apex-tab flex-1">
                    Cross Section
                  </TabsTrigger>
                  <TabsTrigger value="elevation" className="apex-tab flex-1">
                    Elevation
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

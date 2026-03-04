/**
 * Main public component: 3D scenario viewer.
 * Wires together road rendering, entity display, camera controls,
 * scenario store subscription, and simulation playback.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type * as THREE from 'three';
import type {
  OpenDriveDocument,
  SimulationFrame,
  SimulationStatus,
  EditorPreferences,
} from '@osce/shared';
import { createViewerStore, useViewerStore } from '../store/viewer-store.js';
import type { HoverLaneInfo } from '../store/viewer-types.js';
import { ViewerCanvas } from '../scene/ViewerCanvas.js';
import { SceneEnvironment } from '../scene/SceneEnvironment.js';
import { CameraController } from '../scene/CameraController.js';
import type { CameraControllerHandle } from '../scene/CameraController.js';
import { RoadNetwork } from '../road/RoadNetwork.js';
import { EntityGroup } from '../entities/EntityGroup.js';
import { RoadClickHandler } from '../interaction/RoadClickHandler.js';
import { PlacementOverlay } from '../interaction/PlacementOverlay.js';
import { ViewerToolbar } from './ViewerToolbar.js';
import { useScenarioEntities } from '../scenario/useScenarioEntities.js';
import { useEntityPositions } from '../scenario/useEntityPositions.js';
import { SimulationOverlay } from '../scenario/SimulationOverlay.js';
import { useCameraFollow } from '../scene/useCameraFollow.js';

export interface ScenarioViewerProps {
  /** The scenario engine Zustand store (vanilla) */
  scenarioStore: ReturnType<typeof import('@osce/scenario-engine').createScenarioStore>;
  /** Parsed OpenDRIVE document for road rendering */
  openDriveDocument: OpenDriveDocument | null;
  /** Currently selected entity ID (controlled externally) */
  selectedEntityId?: string | null;
  /** Callback when user clicks an entity in the viewer */
  onEntitySelect?: (entityId: string) => void;
  /** Callback when user double-clicks an entity (request focus) */
  onEntityFocus?: (entityId: string) => void;
  /** Callback when entity position is changed via gizmo drag or click placement */
  onEntityPositionChange?: (
    entityName: string,
    x: number,
    y: number,
    z: number,
    h: number,
    forceWorldPosition?: boolean,
  ) => void;
  /** Current simulation frame to display (null = show init positions) */
  currentFrame?: SimulationFrame | null;
  /** Simulation status for auto-mode-switching */
  simulationStatus?: SimulationStatus;
  /** Editor preferences for display toggles */
  preferences?: Partial<EditorPreferences>;
  /** CSS class for the container */
  className?: string;
  /** CSS style for the container */
  style?: React.CSSProperties;
}

/**
 * Inner component that lives inside the R3F Canvas.
 */
function ScenarioViewerScene({
  scenarioStore,
  openDriveDocument,
  selectedEntityId,
  onEntitySelect,
  onEntityFocus,
  onEntityPositionChange,
  currentFrame,
  viewerStore,
}: {
  scenarioStore: ScenarioViewerProps['scenarioStore'];
  openDriveDocument: OpenDriveDocument | null;
  selectedEntityId: string | null;
  onEntitySelect: (entityId: string) => void;
  onEntityFocus: (entityId: string) => void;
  onEntityPositionChange?: ScenarioViewerProps['onEntityPositionChange'];
  currentFrame?: SimulationFrame | null;
  viewerStore: ReturnType<typeof createViewerStore>;
}) {
  const cameraMode = useViewerStore(viewerStore, (s) => s.cameraMode);
  const showGrid = useViewerStore(viewerStore, (s) => s.showGrid);
  const showLaneIds = useViewerStore(viewerStore, (s) => s.showLaneIds);
  const showRoadIds = useViewerStore(viewerStore, (s) => s.showRoadIds);
  const showEntityLabels = useViewerStore(viewerStore, (s) => s.showEntityLabels);
  const gizmoMode = useViewerStore(viewerStore, (s) => s.gizmoMode);
  const viewerMode = useViewerStore(viewerStore, (s) => s.viewerMode);
  const snapToLane = useViewerStore(viewerStore, (s) => s.snapToLane);
  const reverseDirection = useViewerStore(viewerStore, (s) => s.reverseDirection);
  const followTargetEntity = useViewerStore(viewerStore, (s) => s.followTargetEntity);
  const flySpeed = useViewerStore(viewerStore, (s) => s.flySpeed);

  const entities = useScenarioEntities(scenarioStore);
  const entityPositions = useEntityPositions(scenarioStore, openDriveDocument);

  const isSimulating = currentFrame != null;
  const isEditMode = viewerMode === 'edit';

  // In play mode, force gizmo off and disable position changes
  const effectiveGizmoMode = isEditMode ? gizmoMode : 'off';
  const effectiveOnPositionChange = isEditMode ? onEntityPositionChange : undefined;

  const [focusTarget, setFocusTarget] = useState<[number, number, number] | null>(null);
  const cameraRef = useRef<CameraControllerHandle>(null);
  const roadGroupRef = useRef<THREE.Group>(null);
  const highlightedLaneRef = useRef<{ roadId: string; laneId: number } | null>(null);

  // Camera follow (only active during simulation)
  useCameraFollow({
    targetEntity: followTargetEntity,
    orbitControlsRef: cameraRef.current?.orbitControls ?? { current: null },
    entityPositions,
    currentFrame,
    isSimulating,
  });

  const handleEntityFocus = useCallback(
    (entityId: string) => {
      onEntityFocus(entityId);
      // Find entity position and set as camera focus target
      const entity = entities.find((e) => e.id === entityId);
      if (entity) {
        const pos = entityPositions.get(entity.name);
        if (pos) {
          // Convert to Three.js coords (after the rotation group transform)
          setFocusTarget([pos.x, pos.z, -pos.y]);
        }
      }
    },
    [entities, entityPositions, onEntityFocus],
  );

  // Handle placement from RoadClickHandler
  const handlePlacement = useCallback(
    (x: number, y: number, z: number, h: number, forceWorldPosition: boolean) => {
      if (!selectedEntityId || !onEntityPositionChange) return;
      const selectedEntity = entities.find((e) => e.id === selectedEntityId);
      if (!selectedEntity) return;
      onEntityPositionChange(selectedEntity.name, x, y, z, h, forceWorldPosition);
    },
    [selectedEntityId, entities, onEntityPositionChange],
  );

  const handleHoverLaneChange = useCallback(
    (info: HoverLaneInfo | null) => {
      viewerStore.getState().setHoverLaneInfo(info);
    },
    [viewerStore],
  );

  // Determine if hover/click should be active
  const hoverActive = isEditMode && (gizmoMode === 'place' || gizmoMode === 'translate');
  const clickActive = isEditMode && gizmoMode === 'place';

  return (
    <>
      <SceneEnvironment showGrid={showGrid} />
      <CameraController ref={cameraRef} mode={cameraMode} focusTarget={focusTarget} flySpeed={flySpeed} />

      <RoadNetwork
        ref={roadGroupRef}
        odrDocument={openDriveDocument}
        showRoadMarks
        showRoadIds={showRoadIds}
        showLaneIds={showLaneIds}
        highlightedLaneRef={highlightedLaneRef}
      />

      {/* Road click handler for Place mode and hover detection */}
      {isEditMode && (hoverActive || clickActive) && (
        <RoadClickHandler
          roadGroupRef={roadGroupRef}
          hoverActive={hoverActive}
          clickActive={clickActive}
          hasSelectedEntity={selectedEntityId != null}
          openDriveDocument={openDriveDocument}
          snapToLane={snapToLane}
          reverseDirection={reverseDirection}
          onPlacement={handlePlacement}
          onHoverLaneChange={handleHoverLaneChange}
          highlightedLaneRef={highlightedLaneRef}
        />
      )}

      {/* Show init positions when not simulating */}
      {!isSimulating && (
        <EntityGroup
          entities={entities}
          entityPositions={entityPositions}
          selectedEntityId={selectedEntityId}
          onEntitySelect={onEntitySelect}
          onEntityFocus={handleEntityFocus}
          showLabels={showEntityLabels}
          gizmoMode={effectiveGizmoMode}
          orbitControlsRef={cameraRef.current?.orbitControls}
          onEntityPositionChange={effectiveOnPositionChange}
        />
      )}

      {/* Show simulation positions during playback */}
      {isSimulating && (
        <SimulationOverlay
          entities={entities}
          currentFrame={currentFrame!}
          selectedEntityId={selectedEntityId}
          onEntitySelect={onEntitySelect}
          showLabels={showEntityLabels}
        />
      )}
    </>
  );
}

/** Speed slider styles */
const speedSliderStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  backgroundColor: 'rgba(40, 40, 60, 0.85)',
  border: '1px solid rgba(100, 100, 140, 0.5)',
  borderRadius: '4px',
  zIndex: 10,
  pointerEvents: 'auto',
  fontFamily: 'monospace',
  fontSize: '11px',
  color: '#ddd',
};

/**
 * Main exported 3D viewer component.
 * Renders the complete scenario visualization with road network and entities.
 */
export const ScenarioViewer: React.FC<ScenarioViewerProps> = ({
  scenarioStore,
  openDriveDocument,
  selectedEntityId = null,
  onEntitySelect,
  onEntityFocus,
  onEntityPositionChange,
  currentFrame: currentFrameProp,
  simulationStatus,
  preferences,
  className,
  style,
}) => {
  const viewerStoreRef = useRef<ReturnType<typeof createViewerStore> | null>(null);
  if (!viewerStoreRef.current) {
    viewerStoreRef.current = createViewerStore(preferences);
  }
  const viewerStore = viewerStoreRef.current;

  // Auto-switch to play mode when simulation starts
  useEffect(() => {
    if (simulationStatus === 'running') {
      viewerStore.getState().setViewerMode('play');
    }
  }, [simulationStatus, viewerStore]);

  const handleEntitySelect = useCallback(
    (entityId: string) => onEntitySelect?.(entityId),
    [onEntitySelect],
  );

  const handleEntityFocus = useCallback(
    (entityId: string) => onEntityFocus?.(entityId),
    [onEntityFocus],
  );

  const entities = useScenarioEntities(scenarioStore);

  // Reactive state subscriptions for toolbar and speed slider
  const cameraMode = useViewerStore(viewerStore, (s) => s.cameraMode);
  const showGrid = useViewerStore(viewerStore, (s) => s.showGrid);
  const showEntityLabels = useViewerStore(viewerStore, (s) => s.showEntityLabels);
  const showRoadIds = useViewerStore(viewerStore, (s) => s.showRoadIds);
  const showLaneIds = useViewerStore(viewerStore, (s) => s.showLaneIds);
  const gizmoMode = useViewerStore(viewerStore, (s) => s.gizmoMode);
  const reverseDirection = useViewerStore(viewerStore, (s) => s.reverseDirection);
  const snapToLane = useViewerStore(viewerStore, (s) => s.snapToLane);
  const viewerMode = useViewerStore(viewerStore, (s) => s.viewerMode);
  const followTargetEntity = useViewerStore(viewerStore, (s) => s.followTargetEntity);
  const flySpeed = useViewerStore(viewerStore, (s) => s.flySpeed);

  const hoverLaneInfo = useViewerStore(viewerStore, (s) => s.hoverLaneInfo);

  const isSimulating = simulationStatus === 'running';

  // Mode-based border color
  const modeBorderColor =
    viewerMode === 'edit' ? 'rgba(60, 120, 220, 0.5)' : 'rgba(60, 180, 100, 0.5)';

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        border: `2px solid ${modeBorderColor}`,
        transition: 'border-color 0.3s ease',
        ...style,
      }}
    >
      <ViewerToolbar
        viewerMode={viewerMode}
        onViewerModeChange={(m) => viewerStore.getState().setViewerMode(m)}
        isSimulating={isSimulating}
        cameraMode={cameraMode}
        onCameraModeChange={(m) => viewerStore.getState().setCameraMode(m)}
        showGrid={showGrid}
        onToggleGrid={() => viewerStore.getState().toggleGrid()}
        showLabels={showEntityLabels}
        onToggleLabels={() => viewerStore.getState().toggleEntityLabels()}
        showRoadIds={showRoadIds}
        onToggleRoadIds={() => viewerStore.getState().toggleRoadIds()}
        showLaneIds={showLaneIds}
        onToggleLaneIds={() => viewerStore.getState().toggleLaneIds()}
        gizmoMode={gizmoMode}
        onGizmoModeChange={(m) => viewerStore.getState().setGizmoMode(m)}
        reverseDirection={reverseDirection}
        onToggleReverseDirection={() => viewerStore.getState().toggleReverseDirection()}
        snapToLane={snapToLane}
        onToggleSnapToLane={() => viewerStore.getState().toggleSnapToLane()}
        followTargetEntity={followTargetEntity}
        onFollowTargetChange={(name) => viewerStore.getState().setFollowTarget(name)}
        entities={entities}
      />

      {/* Placement overlay (shown in Place mode with hover info) */}
      <PlacementOverlay
        hoverLaneInfo={hoverLaneInfo}
        snapToLane={snapToLane}
        isPlaceMode={gizmoMode === 'place' && viewerMode === 'edit'}
      />

      {/* Speed multiplier slider (top-right) */}
      <div style={speedSliderStyle}>
        <span>Speed</span>
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={flySpeed}
          onChange={(e) => viewerStore.getState().setFlySpeed(Number(e.target.value))}
          style={{ width: 80, cursor: 'pointer' }}
        />
        <span style={{ minWidth: 30, textAlign: 'right' }}>{flySpeed.toFixed(1)}x</span>
      </div>

      <ViewerCanvas>
        <ScenarioViewerScene
          scenarioStore={scenarioStore}
          openDriveDocument={openDriveDocument}
          selectedEntityId={selectedEntityId ?? null}
          onEntitySelect={handleEntitySelect}
          onEntityFocus={handleEntityFocus}
          onEntityPositionChange={onEntityPositionChange}
          currentFrame={currentFrameProp}
          viewerStore={viewerStore}
        />
      </ViewerCanvas>
    </div>
  );
};

ScenarioViewer.displayName = 'ScenarioViewer';

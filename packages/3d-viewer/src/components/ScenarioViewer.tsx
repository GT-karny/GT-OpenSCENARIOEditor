/**
 * Main public component: 3D scenario viewer.
 * Wires together road rendering, entity display, camera controls,
 * scenario store subscription, and simulation playback.
 */

import React, { useState, useCallback, useRef } from 'react';
import type { OpenDriveDocument, SimulationFrame, EditorPreferences } from '@osce/shared';
import { createViewerStore, useViewerStore } from '../store/viewer-store.js';
import { ViewerCanvas } from '../scene/ViewerCanvas.js';
import { SceneEnvironment } from '../scene/SceneEnvironment.js';
import { CameraController } from '../scene/CameraController.js';
import { RoadNetwork } from '../road/RoadNetwork.js';
import { EntityGroup } from '../entities/EntityGroup.js';
import { ViewerToolbar } from './ViewerToolbar.js';
import { useScenarioEntities } from '../scenario/useScenarioEntities.js';
import { useEntityPositions } from '../scenario/useEntityPositions.js';
import { useSimulationPlayback } from '../scenario/useSimulationPlayback.js';
import { SimulationOverlay } from '../scenario/SimulationOverlay.js';

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
  /** Simulation frames for playback */
  simulationFrames?: SimulationFrame[];
  /** Editor preferences for display toggles */
  preferences?: Partial<EditorPreferences>;
  /** CSS class for the container */
  className?: string;
  /** CSS style for the container */
  style?: React.CSSProperties;
}

/**
 * Inner component that lives inside the R3F Canvas.
 * Hooks like useSimulationPlayback require the Canvas context.
 */
function ScenarioViewerScene({
  scenarioStore,
  openDriveDocument,
  selectedEntityId,
  onEntitySelect,
  onEntityFocus,
  simulationFrames,
  viewerStore,
}: {
  scenarioStore: ScenarioViewerProps['scenarioStore'];
  openDriveDocument: OpenDriveDocument | null;
  selectedEntityId: string | null;
  onEntitySelect: (entityId: string) => void;
  onEntityFocus: (entityId: string) => void;
  simulationFrames?: SimulationFrame[];
  viewerStore: ReturnType<typeof createViewerStore>;
}) {
  const cameraMode = useViewerStore(viewerStore, (s) => s.cameraMode);
  const showGrid = useViewerStore(viewerStore, (s) => s.showGrid);
  const showLaneIds = useViewerStore(viewerStore, (s) => s.showLaneIds);
  const showRoadIds = useViewerStore(viewerStore, (s) => s.showRoadIds);
  const showEntityLabels = useViewerStore(viewerStore, (s) => s.showEntityLabels);

  const entities = useScenarioEntities(scenarioStore);
  const entityPositions = useEntityPositions(scenarioStore, openDriveDocument);

  const playbackControls = useSimulationPlayback();

  // Load simulation frames when provided
  React.useEffect(() => {
    if (simulationFrames && simulationFrames.length > 0) {
      playbackControls.setFrames(simulationFrames);
    }
  }, [simulationFrames]); // eslint-disable-line react-hooks/exhaustive-deps

  const [focusTarget, setFocusTarget] = useState<[number, number, number] | null>(null);

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

  const isSimulating = playbackControls.status !== 'idle' && playbackControls.currentFrame !== null;

  return (
    <>
      <SceneEnvironment showGrid={showGrid} />
      <CameraController mode={cameraMode} focusTarget={focusTarget} />

      <RoadNetwork
        odrDocument={openDriveDocument}
        showRoadMarks
        showRoadIds={showRoadIds}
        showLaneIds={showLaneIds}
      />

      {/* Show init positions when not simulating */}
      {!isSimulating && (
        <EntityGroup
          entities={entities}
          entityPositions={entityPositions}
          selectedEntityId={selectedEntityId}
          onEntitySelect={onEntitySelect}
          onEntityFocus={handleEntityFocus}
          showLabels={showEntityLabels}
        />
      )}

      {/* Show simulation positions during playback */}
      {isSimulating && (
        <SimulationOverlay
          entities={entities}
          currentFrame={playbackControls.currentFrame}
          selectedEntityId={selectedEntityId}
          onEntitySelect={onEntitySelect}
          showLabels={showEntityLabels}
        />
      )}
    </>
  );
}

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
  simulationFrames,
  preferences,
  className,
  style,
}) => {
  const viewerStoreRef = useRef<ReturnType<typeof createViewerStore> | null>(null);
  if (!viewerStoreRef.current) {
    viewerStoreRef.current = createViewerStore(preferences);
  }
  const viewerStore = viewerStoreRef.current;

  const handleEntitySelect = useCallback(
    (entityId: string) => onEntitySelect?.(entityId),
    [onEntitySelect],
  );

  const handleEntityFocus = useCallback(
    (entityId: string) => onEntityFocus?.(entityId),
    [onEntityFocus],
  );

  const vs = viewerStore.getState();

  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
    >
      <ViewerToolbar
        cameraMode={vs.cameraMode}
        onCameraModeChange={(m) => viewerStore.getState().setCameraMode(m)}
        showGrid={vs.showGrid}
        onToggleGrid={() => viewerStore.getState().toggleGrid()}
        showLabels={vs.showEntityLabels}
        onToggleLabels={() => viewerStore.getState().toggleEntityLabels()}
        showRoadIds={vs.showRoadIds}
        onToggleRoadIds={() => viewerStore.getState().toggleRoadIds()}
        showLaneIds={vs.showLaneIds}
        onToggleLaneIds={() => viewerStore.getState().toggleLaneIds()}
      />

      <ViewerCanvas>
        <ScenarioViewerScene
          scenarioStore={scenarioStore}
          openDriveDocument={openDriveDocument}
          selectedEntityId={selectedEntityId ?? null}
          onEntitySelect={handleEntitySelect}
          onEntityFocus={handleEntityFocus}
          simulationFrames={simulationFrames}
          viewerStore={viewerStore}
        />
      </ViewerCanvas>
    </div>
  );
};

ScenarioViewer.displayName = 'ScenarioViewer';

/**
 * Junction tools for the road-network editor.
 *
 * Owns manual junction creation (endpoint pick + confirm), the junction context
 * menu, deletion, connection regeneration, and adding empty connections.
 * Junction-id derivation goes through {@link nextJunctionId} and regeneration
 * through {@link regenerateJunctionConnections} (which owns its own undo batch).
 */

import { useCallback, useMemo, useState } from 'react';
import type { StoreApi } from 'zustand';
import type { OdrRoad } from '@osce/shared';
import type { OpenDriveStore } from '@osce/opendrive-engine';
import {
  generateConnectingRoads,
  computeRoadEndpoint,
  createDefaultLaneRoutingConfig,
  regenerateJunctionConnections,
  nextJunctionId,
} from '@osce/opendrive-engine';
import { evaluateReferenceLineAtS } from '@osce/opendrive';
import { useOdrSidebarStore } from '../use-opendrive-store';
import { editorMetadataStoreApi } from '../../stores/editor-metadata-store-instance';

interface UseJunctionToolsParams {
  odrStoreApi: StoreApi<OpenDriveStore>;
  roads: readonly OdrRoad[];
  /** Whether the junction-create tool is active. */
  junctionCreateMode: boolean;
  /** Currently selected junction id (for deselect-on-delete). */
  selectedJunctionId: string | null;
}

export interface JunctionContextMenuState {
  junctionId: string;
  screenX: number;
  screenY: number;
}

export interface UseJunctionToolsResult {
  junctionEndpoints: ReturnType<typeof computeRoadEndpoint>[];
  junctionContextMenu: JunctionContextMenuState | null;
  handleJunctionEndpointHover: (
    endpoint: { roadId: string; contactPoint: 'start' | 'end' } | null,
  ) => void;
  handleJunctionEndpointClick: (roadId: string, contactPoint: 'start' | 'end') => void;
  handleJunctionConfirm: () => void;
  handleJunctionClick: (junctionId: string) => void;
  handleJunctionContextMenu: (
    junctionId: string,
    event: { nativeEvent: MouseEvent },
  ) => void;
  handleJunctionContextMenuClose: () => void;
  handleDeleteJunction: (junctionId: string) => void;
  handleRegenerateConnections: (junctionId: string) => void;
  handleAddJunctionConnection: (junctionId: string) => void;
}

export function useJunctionTools({
  odrStoreApi,
  roads,
  junctionCreateMode,
  selectedJunctionId,
}: UseJunctionToolsParams): UseJunctionToolsResult {
  const junctionCreate = useOdrSidebarStore((s) => s.junctionCreate);

  // Junction context menu (local state)
  const [junctionContextMenu, setJunctionContextMenu] =
    useState<JunctionContextMenuState | null>(null);

  // Compute road endpoints for the junction routing panel
  const junctionEndpoints = useMemo(() => {
    if (!junctionCreateMode || junctionCreate.selectedEndpoints.length < 2) return [];
    return junctionCreate.selectedEndpoints
      .map((ep) => {
        const road = roads.find((r) => r.id === ep.roadId);
        if (!road) return null;
        return computeRoadEndpoint(road, ep.contactPoint, evaluateReferenceLineAtS);
      })
      .filter((ep): ep is NonNullable<typeof ep> => ep !== null);
  }, [junctionCreateMode, junctionCreate.selectedEndpoints, roads]);

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
    const { selectedEndpoints, routingPreset, laneOverrides } =
      useOdrSidebarStore.getState().junctionCreate;
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
    const routingConfig =
      routingPreset === 'dedicated'
        ? {
            rightTurnLanes: 'outermost' as const,
            leftTurnLanes: 'innermost' as const,
            generateUturn: false,
          }
        : createDefaultLaneRoutingConfig();
    const junctionId = nextJunctionId(doc);
    const result = generateConnectingRoads(
      endpoints,
      junctionId,
      routingConfig,
      doc,
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

  const handleJunctionClick = useCallback((junctionId: string) => {
    useOdrSidebarStore.getState().setSelection({ type: 'junction', id: junctionId });
  }, []);

  const handleJunctionContextMenu = useCallback(
    (junctionId: string, event: { nativeEvent: MouseEvent }) => {
      event.nativeEvent.preventDefault();
      setJunctionContextMenu({
        junctionId,
        screenX: event.nativeEvent.clientX,
        screenY: event.nativeEvent.clientY,
      });
    },
    [setJunctionContextMenu],
  );

  const handleJunctionContextMenuClose = useCallback(() => {
    setJunctionContextMenu(null);
  }, [setJunctionContextMenu]);

  const handleDeleteJunction = useCallback(
    (junctionId: string) => {
      odrStoreApi.getState().removeJunction(junctionId);
      setJunctionContextMenu(null);
      // Deselect if deleted junction was selected
      if (selectedJunctionId === junctionId) {
        useOdrSidebarStore.getState().setSelection({ type: null, id: null });
      }
    },
    [odrStoreApi, selectedJunctionId, setJunctionContextMenu],
  );

  const handleRegenerateConnections = useCallback(
    (junctionId: string) => {
      const store = odrStoreApi.getState();
      regenerateJunctionConnections(store, junctionId, evaluateReferenceLineAtS);
      setJunctionContextMenu(null);
    },
    [odrStoreApi, setJunctionContextMenu],
  );

  const handleAddJunctionConnection = useCallback(
    (junctionId: string) => {
      // Add an empty connection placeholder that user can configure via property editor
      odrStoreApi.getState().addJunctionConnection(junctionId, {});
      setJunctionContextMenu(null);
    },
    [odrStoreApi, setJunctionContextMenu],
  );

  return {
    junctionEndpoints,
    junctionContextMenu,
    handleJunctionEndpointHover,
    handleJunctionEndpointClick,
    handleJunctionConfirm,
    handleJunctionClick,
    handleJunctionContextMenu,
    handleJunctionContextMenuClose,
    handleDeleteJunction,
    handleRegenerateConnections,
    handleAddJunctionConnection,
  };
}

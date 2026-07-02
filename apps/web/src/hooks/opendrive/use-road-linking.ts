/**
 * Road linking + endpoint tools for the road-network editor.
 *
 * Owns the bidirectional road-link set/unset handlers, the road-endpoint
 * context menu state, and the "add road from endpoint" / "disconnect endpoint"
 * actions. New roads spawned from an endpoint derive their start pose via the
 * shared {@link computeGeometryEndpoint} helper instead of inline arc trig.
 */

import { useCallback, useState } from 'react';
import type { StoreApi } from 'zustand';
import type { OdrRoad, OdrRoadLinkElement } from '@osce/shared';
import type { OpenDriveStore } from '@osce/opendrive-engine';
import { createRoadFromPartial, syncLaneLinksForDirectConnections, clearLaneLinks } from '@osce/opendrive-engine';
import { computeGeometryEndpoint } from '@osce/opendrive';
import { useOdrSidebarStore } from '../use-opendrive-store';

interface UseRoadLinkingParams {
  odrStoreApi: StoreApi<OpenDriveStore>;
  roads: readonly OdrRoad[];
}

export interface EndpointContextMenuState {
  roadId: string;
  contactPoint: 'start' | 'end';
  screenX: number;
  screenY: number;
}

export interface UseRoadLinkingResult {
  handleRoadLinkSet: (
    roadId: string,
    linkType: 'predecessor' | 'successor',
    targetRoadId: string,
    targetContactPoint: 'start' | 'end',
  ) => void;
  handleRoadLinkUnset: (roadId: string, linkType: 'predecessor' | 'successor') => void;
  endpointContextMenu: EndpointContextMenuState | null;
  handleEndpointContextMenu: (
    roadId: string,
    contactPoint: 'start' | 'end',
    screenX: number,
    screenY: number,
  ) => void;
  handleEndpointContextMenuClose: () => void;
  handleAddRoadFromEndpoint: (roadId: string, contactPoint: 'start' | 'end') => void;
  handleDisconnectEndpoint: (roadId: string, contactPoint: 'start' | 'end') => void;
}

export function useRoadLinking({
  odrStoreApi,
  roads,
}: UseRoadLinkingParams): UseRoadLinkingResult {
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
      const sourceContactPoint: 'start' | 'end' = linkType === 'predecessor' ? 'start' : 'end';
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

  // --- Road link unset (on gizmo drag away from snap) ---
  const handleRoadLinkUnset = useCallback(
    (roadId: string, linkType: 'predecessor' | 'successor') => {
      const store = odrStoreApi.getState();
      const road = roads.find((r) => r.id === roadId);
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
    [odrStoreApi, roads],
  );

  // --- Endpoint context menu ---
  const [endpointContextMenu, setEndpointContextMenu] = useState<EndpointContextMenuState | null>(
    null,
  );

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
      const road = roads.find((r) => r.id === roadId);
      if (!road || road.planView.length === 0) return;

      let x: number, y: number, hdg: number;
      if (contactPoint === 'end') {
        // Get end position and heading of the road
        const last = road.planView[road.planView.length - 1];
        const curvature = last.type === 'arc' ? (last.curvature ?? 0) : 0;
        const endpoint = computeGeometryEndpoint(last.x, last.y, last.hdg, last.length, curvature);
        x = endpoint.x;
        y = endpoint.y;
        hdg = endpoint.hdg;
      } else {
        // Start position
        const first = road.planView[0];
        x = first.x;
        y = first.y;
        hdg = first.hdg + Math.PI; // Reverse direction for predecessor
      }

      const template = createRoadFromPartial({});
      const newRoad = odrStoreApi.getState().addRoad({
        name: `Road ${roads.length + 1}`,
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
    [roads, odrStoreApi, handleRoadLinkSet],
  );

  const handleDisconnectEndpoint = useCallback(
    (roadId: string, contactPoint: 'start' | 'end') => {
      const store = odrStoreApi.getState();
      const road = roads.find((r) => r.id === roadId);
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
    [odrStoreApi, roads],
  );

  return {
    handleRoadLinkSet,
    handleRoadLinkUnset,
    endpointContextMenu,
    handleEndpointContextMenu,
    handleEndpointContextMenuClose,
    handleAddRoadFromEndpoint,
    handleDisconnectEndpoint,
  };
}

/**
 * Road-creation tool for the road-network editor.
 *
 * Owns the 2-click road-creation flow: start placement, cursor tracking,
 * arc/line synthesis, road spawning with optional snap links, and the chaining
 * logic (including stale-chain repair when auto-junction detection splits the
 * chained road). Also derives the preview lanes and toolbar cursor info.
 */

import { useCallback, useMemo } from 'react';
import type { StoreApi } from 'zustand';
import type { OdrGeometry, OdrLaneSection, OpenDriveDocument } from '@osce/shared';
import type { OpenDriveStore } from '@osce/opendrive-engine';
import { createRoadFromPartial, DEFAULT_PRESETS } from '@osce/opendrive-engine';
import { computeAutoArc, computeGeometryEndpoint } from '@osce/opendrive';
import { useOdrSidebarStore } from '../use-opendrive-store';
import { editorMetadataStoreApi } from '../../stores/editor-metadata-store-instance';

interface UseRoadCreationParams {
  odrStoreApi: StoreApi<OpenDriveStore>;
  /** Number of existing roads (for default naming). */
  roadCount: number;
  handleRoadLinkSet: (
    roadId: string,
    linkType: 'predecessor' | 'successor',
    targetRoadId: string,
    targetContactPoint: 'start' | 'end',
  ) => void;
  checkForIntersections: (document: OpenDriveDocument) => void;
}

export interface RoadCreationCursorInfo {
  x: number;
  y: number;
  length: number;
  angle: number;
}

export interface UseRoadCreationResult {
  creationLanes: OdrLaneSection[];
  cursorInfo: RoadCreationCursorInfo | null;
  hasStartConstraint: boolean;
  handleCreationStartPlace: (
    x: number,
    y: number,
    hdg: number,
    snap?: { roadId: string; contactPoint: 'start' | 'end' },
  ) => void;
  handleCreationCursorMove: (x: number, y: number) => void;
  handleRoadCreate: (
    startX: number,
    startY: number,
    startHdg: number,
    endX: number,
    endY: number,
    _curvature: number,
    snapInfo?: { roadId: string; contactPoint: 'start' | 'end' },
  ) => void;
}

export function useRoadCreation({
  odrStoreApi,
  roadCount,
  handleRoadLinkSet,
  checkForIntersections,
}: UseRoadCreationParams): UseRoadCreationResult {
  const roadCreation = useOdrSidebarStore((s) => s.roadCreation);

  // --- Road creation: start point placement ---
  const handleCreationStartPlace = useCallback(
    (x: number, y: number, hdg: number, snap?: { roadId: string; contactPoint: 'start' | 'end' }) => {
      useOdrSidebarStore.getState().setRoadCreationStart(x, y, hdg, snap);
    },
    [],
  );

  // --- Road creation: cursor move (for ghost preview + numeric display) ---
  const handleCreationCursorMove = useCallback((x: number, y: number) => {
    useOdrSidebarStore.getState().setRoadCreationCursor(x, y);
  }, []);

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

      const newGeometry: OdrGeometry =
        arc.type === 'arc'
          ? {
              s: 0,
              x: startX,
              y: startY,
              hdg: arc.hdg,
              length: arc.arcLength,
              type: 'arc',
              curvature: arc.curvature,
            }
          : {
              s: 0,
              x: startX,
              y: startY,
              hdg: arc.hdg,
              length: arc.arcLength,
              type: 'line',
            };

      const defaultTrafficRule = useOdrSidebarStore.getState().roadCreation.defaultTrafficRule;

      const newRoad = odrStoreApi.getState().addRoad({
        name: `Road ${roadCount + 1}`,
        planView: [newGeometry],
        lanes: template.lanes,
        // Only set 'LHT' explicitly; RHT is the XSD default (rule undefined).
        rule: defaultTrafficRule === 'LHT' ? 'LHT' : undefined,
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
          startX,
          startY,
          arc.hdg,
          arc.arcLength,
          arc.type === 'arc' ? arc.curvature : 0,
        );
        useOdrSidebarStore
          .getState()
          .setRoadCreationStart(endpoint.x, endpoint.y, endpoint.hdg, {
            roadId: newRoad.id,
            contactPoint: 'end',
          });
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
          const vr =
            metaStore.findVirtualRoadBySegment(chainState.startSnap.roadId) ??
            metaStore.metadata.virtualRoads.find(
              (v) => v.virtualRoadId === chainState.startSnap!.roadId,
            );
          if (vr && vr.segmentRoadIds.length > 0) {
            // contactPoint='end' → last segment, contactPoint='start' → first segment
            const segId =
              chainState.startSnap.contactPoint === 'end'
                ? vr.segmentRoadIds[vr.segmentRoadIds.length - 1]
                : vr.segmentRoadIds[0];
            if (segId && freshDoc.roads.some((r) => r.id === segId)) {
              useOdrSidebarStore
                .getState()
                .setRoadCreationStart(chainState.startX, chainState.startY, chainState.startHdg, {
                  roadId: segId,
                  contactPoint: chainState.startSnap.contactPoint,
                });
            }
          }
        }
      }
    },
    [odrStoreApi, roadCount, handleRoadLinkSet, checkForIntersections],
  );

  // Whether the start heading is constrained (snapped or chained)
  const hasStartConstraint = roadCreation.phase === 'startPlaced' && !!roadCreation.startSnap;

  // --- Road creation cursor info for toolbar display ---
  const cursorInfo = useMemo<RoadCreationCursorInfo | null>(() => {
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

  return {
    creationLanes,
    cursorInfo,
    hasStartConstraint,
    handleCreationStartPlace,
    handleCreationCursorMove,
    handleRoadCreate,
  };
}

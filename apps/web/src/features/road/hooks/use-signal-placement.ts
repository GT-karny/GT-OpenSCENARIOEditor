/**
 * Signal-placement tools for the road-network editor.
 *
 * Owns the signal-assembly map used by the 3D viewer, signal placement
 * (single head or assembly, on a straight pole or arm-mounted), ghost preview
 * updates, and arm-mounted signal moves. Orientation resolution, head
 * mirroring, z-offset selection, arm-angle math, and move-patch derivation all
 * live in the engine; this hook only wires them to the stores.
 */

import { useCallback, useMemo } from 'react';
import { useStore } from 'zustand';
import type { StoreApi } from 'zustand';
import type { OpenDriveDocument } from '@osce/shared';
import type { OpenDriveStore, PoleAssemblyInfo } from '@osce/opendrive-engine';
import {
  getPresetById,
  presetToSignalPartial,
  createAssemblyFromPlacement,
  findAssemblyForSignal,
  addHeadToAssembly,
  updateAssembly,
  getAssemblyPresetById,
  buildSignalAssemblyMap,
  resolveSignalOrientation,
  mirrorAssemblyHeadsForOrientation,
  resolveHeadZOffset,
  computeArmAngleFromWorld,
  computeSignalMovePatch,
} from '@osce/opendrive-engine';
import { useOdrSidebarStore } from '../../../hooks/use-opendrive-store';
import type { SignalPlaceGhost } from '../../../hooks/use-opendrive-store';
import { editorMetadataStoreApi } from '../../../stores/editor-metadata-store-instance';

interface UseSignalPlacementParams {
  odrStoreApi: StoreApi<OpenDriveStore>;
  document: OpenDriveDocument;
}

export interface UseSignalPlacementResult {
  signalAssemblyMap: Map<string, PoleAssemblyInfo> | undefined;
  handleSignalPlace: (roadId: string, s: number, t: number, heading: number) => void;
  handleSignalGhostUpdate: (ghost: SignalPlaceGhost | null) => void;
  handleSignalMove: (
    roadId: string,
    signalId: string,
    newS: number,
    newT: number,
    armInfo?: { armLength: number; armAngle: number },
  ) => void;
}

export function useSignalPlacement({
  odrStoreApi,
  document,
}: UseSignalPlacementParams): UseSignalPlacementResult {
  const setSignalPlaceGhost = useOdrSidebarStore((s) => s.setSignalPlaceGhost);

  // Build assemblyMap for 3D arm pole rendering
  const signalAssemblies = useStore(editorMetadataStoreApi, (s) => s.metadata.signalAssemblies);
  const signalAssemblyMap = useMemo(
    () => buildSignalAssemblyMap(document, signalAssemblies),
    [signalAssemblies, document],
  );

  const handleSignalPlace = useCallback(
    (roadId: string, s: number, t: number, _heading: number) => {
      const store = odrStoreApi.getState();
      // Read state directly from the store to avoid stale closure issues
      const { tSnapMode, selectionType, selectedPresetId, signalOrientation, ghostPreview } =
        useOdrSidebarStore.getState().signalPlace;

      // Determine orientation: all modes are lane-relative (RHT/LHT aware).
      const road = document.roads.find((r) => r.id === roadId);
      const orientation = resolveSignalOrientation(road, t, signalOrientation);

      // Resolve head presets: single head or assembly (list of heads with offsets)
      // When orientation is '-', mirror X offsets so the assembly layout
      // stays correct from the viewer's perspective.
      const assemblyPreset =
        selectionType === 'assembly' ? getAssemblyPresetById(selectedPresetId) : undefined;
      const assemblyHeads = mirrorAssemblyHeadsForOrientation(
        assemblyPreset,
        selectedPresetId,
        orientation,
      );
      const headPresetIds = assemblyHeads.map((h) => h.presetId);

      const firstHeadPreset = getPresetById(headPresetIds[0]);
      const firstPartial = firstHeadPreset ? presetToSignalPartial(firstHeadPreset) : {};
      const zOffset = resolveHeadZOffset(firstHeadPreset);

      if (tSnapMode === 'lane-above') {
        // Arm-mounted: pole at road edge, head over lane
        const headT = ghostPreview?.headT ?? t;
        const poleT = ghostPreview?.poleT ?? t;
        const armLength = ghostPreview?.armLength ?? 3;
        const armAngle =
          ghostPreview && road ? computeArmAngleFromWorld(road, s, poleT, headT) : undefined;

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
    [odrStoreApi, document],
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
          const road = document.roads.find((r) => r.id === roadId);
          if (road) {
            const patch = computeSignalMovePatch(
              road,
              assembly,
              signalId,
              newS,
              newT,
              armInfo,
            );

            updateAssembly(editorMetadataStoreApi, assembly.assemblyId, patch.assemblyPatch);

            // Sync pole and arm objects
            if (patch.objectPatches.length > 0) {
              const patchById = new Map(patch.objectPatches.map((p) => [p.id, p.patch]));
              store.updateRoad(roadId, {
                objects: road.objects.map((o) => {
                  const objectPatch = patchById.get(o.id);
                  return objectPatch ? { ...o, ...objectPatch } : o;
                }),
              });
            }
          }
        }
      }
    },
    [odrStoreApi, document],
  );

  return {
    signalAssemblyMap,
    handleSignalPlace,
    handleSignalGhostUpdate,
    handleSignalMove,
  };
}

/**
 * Signal arm geometry helpers.
 *
 * Pure functions extracted from the RoadNetworkEditorLayout so that arm-angle
 * math and assembly-map construction live in the engine (no React / store deps).
 */

import type { OpenDriveDocument, OdrRoad } from '@osce/shared';
import { evaluateReferenceLineAtS, evaluateElevation, stToXyz } from '@osce/opendrive';
import type { SignalAssemblyMetadata } from '../store/editor-metadata-types.js';

/**
 * Compute the arm angle (world-frame) for a signal head mounted on an arm.
 *
 * Evaluates the road reference line and elevation at `s`, projects both the
 * pole base (`poleT`) and the signal head (`headT`) to world XYZ, and returns
 * the atan2 of the head-relative-to-pole vector in the XY plane.
 *
 * This replicates the identical inline formula used at three call sites in
 * RoadNetworkEditorLayout (signalAssemblyMap useMemo, the computeArmAngle
 * closure in handleSignalPlace, and handleSignalMove). The three sites differ
 * only in how they source `s`, `poleT`, and `headT`; the core math is the same.
 *
 * @param road   The road the signal is placed on.
 * @param s      The s-coordinate along the road reference line.
 * @param poleT  The t-offset of the pole base.
 * @param headT  The t-offset of the signal head.
 * @returns The arm angle in radians (world frame).
 */
export function computeArmAngleFromWorld(
  road: OdrRoad,
  s: number,
  poleT: number,
  headT: number,
): number {
  const pose = evaluateReferenceLineAtS(road.planView, s);
  const z = evaluateElevation(road.elevationProfile, s);
  const poleWorld = stToXyz(pose, poleT, z);
  const headWorld = stToXyz(pose, headT, z);
  return Math.atan2(headWorld.y - poleWorld.y, headWorld.x - poleWorld.x);
}

/**
 * Per-signal arm-pole rendering info, keyed by signal ID in the assembly map.
 *
 * Structurally identical to `PoleAssemblyInfo` in @osce/3d-viewer
 * (InstancedPoles). Defined locally here to keep the engine free of a
 * 3d-viewer dependency; the shapes must stay in sync.
 */
export interface PoleAssemblyInfo {
  assemblyId: string;
  poleType: 'straight' | 'arm';
  armLength?: number;
  armAngle?: number;
  signalIds: string[];
}

/**
 * Build the signal-assembly map consumed by the 3D viewer's arm-pole renderer.
 *
 * Replicates the signalAssemblyMap useMemo in RoadNetworkEditorLayout: for each
 * assembly, if the arm angle is missing (e.g. after a .xodr import) but the
 * assembly is arm-mounted and references a pole object, the angle is recomputed
 * from the road geometry. The resulting `PoleAssemblyInfo` is mapped under every
 * signal ID in the assembly.
 *
 * Returns `undefined` when there are no assemblies (matching the original memo,
 * which produced `undefined` so the viewer prop can be omitted).
 *
 * @param document    The OpenDRIVE document (roads/objects/signals source).
 * @param assemblies  The signal-assembly metadata list (may be undefined/empty).
 * @returns A map from signal ID to PoleAssemblyInfo, or undefined when empty.
 */
export function buildSignalAssemblyMap(
  document: OpenDriveDocument,
  assemblies: SignalAssemblyMetadata[] | undefined,
): Map<string, PoleAssemblyInfo> | undefined {
  if (!assemblies || assemblies.length === 0) return undefined;
  const map = new Map<string, PoleAssemblyInfo>();
  for (const asm of assemblies) {
    let armAngle = asm.armAngle;

    // Compute armAngle from road geometry if not set (e.g., xodr import)
    if (armAngle == null && asm.poleType === 'arm' && asm.poleObjectId) {
      const road = document.roads.find((r) => r.id === asm.roadId);
      if (road) {
        const poleObj = road.objects.find((o) => o.id === asm.poleObjectId);
        const signal = road.signals.find((s) => asm.signalIds.includes(s.id));
        if (poleObj && signal) {
          armAngle = computeArmAngleFromWorld(road, signal.s, poleObj.t, signal.t);
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
}

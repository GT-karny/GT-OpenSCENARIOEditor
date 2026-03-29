/**
 * High-level operations for signal assemblies.
 * These use the assembly commands and coordinate between the OpenDrive store
 * and the editor metadata store.
 */

import { v4 as uuidv4 } from 'uuid';
import type { OdrSignal, OpenDriveDocument } from '@osce/shared';
import type { StoreApi } from 'zustand/vanilla';
import type { OpenDriveStore } from '../store/opendrive-store.js';
import type { EditorMetadataStore } from '../store/editor-metadata-store.js';
import type { SignalAssemblyMetadata } from '../store/editor-metadata-types.js';
import { presetToSignalPartial, signalToPresetId } from './preset-to-signal.js';
import { getPresetById } from './signal-presets.js';

export type OpenDriveStoreApi = StoreApi<OpenDriveStore>;
export type EditorMetadataStoreApi = StoreApi<EditorMetadataStore>;

// --- Metadata accessors ---

function getAssemblies(metaStore: EditorMetadataStoreApi): SignalAssemblyMetadata[] {
  return metaStore.getState().metadata.signalAssemblies ?? [];
}

function setAssemblies(
  metaStore: EditorMetadataStoreApi,
  assemblies: SignalAssemblyMetadata[],
): void {
  const state = metaStore.getState();
  state.loadMetadata({
    ...state.metadata,
    signalAssemblies: assemblies,
  });
}

// ---------------------------------------------------------------------------
// createAssembly
// ---------------------------------------------------------------------------

/**
 * Create an assembly from existing signal IDs on a road.
 * Returns the new assembly ID.
 */
export function createAssembly(
  odrStore: OpenDriveStoreApi,
  metaStore: EditorMetadataStoreApi,
  roadId: string,
  signalIds: string[],
  poleType: 'straight' | 'arm',
): string {
  const assemblyId = uuidv4();
  const doc = odrStore.getState().getDocument();
  const road = doc.roads.find((r) => r.id === roadId);
  if (!road) return assemblyId;

  const headPositions = signalIds.map((signalId) => {
    const signal = road.signals.find((s) => s.id === signalId);
    const presetId = signal ? signalToPresetId(signal) ?? undefined : undefined;
    return { signalId, presetId, position: 'top' as const };
  });

  const assembly: SignalAssemblyMetadata = {
    assemblyId,
    roadId,
    signalIds,
    poleType,
    headPositions,
  };

  const current = getAssemblies(metaStore);
  setAssemblies(metaStore, [...current, assembly]);

  return assemblyId;
}

// ---------------------------------------------------------------------------
// createAssemblyFromPlacement
// ---------------------------------------------------------------------------

/** Default pole radius for signal poles (meters). */
const POLE_RADIUS = 0.08;
/** Default arm radius (meters). */
const ARM_RADIUS = 0.06;

/**
 * Create a signal and wrap it in an arm-mounted assembly in one step.
 * Creates three OpenDRIVE elements:
 *   1. <signal> at headT (housing over lane)
 *   2. <object type="pole"> at poleT (vertical pole at road edge)
 *   3. <object type="pole"> for horizontal arm connecting pole to housing
 *
 * The signal references both objects via <reference>.
 *
 * @returns The created OdrSignal
 */
export function createAssemblyFromPlacement(
  odrStore: OpenDriveStoreApi,
  metaStore: EditorMetadataStoreApi,
  roadId: string,
  signalPartial: Partial<OdrSignal>,
  presetId: string | undefined,
  armLength: number,
  poleT: number,
  armAngle?: number,
): OdrSignal {
  const store = odrStore.getState();
  const s = signalPartial.s ?? 0;
  const zOffset = signalPartial.zOffset ?? 5.0;
  const orientation = signalPartial.orientation ?? '+';

  // 1. Create vertical pole object at road edge
  const poleObj = store.addObject(roadId, {
    type: 'pole',
    name: 'signal-pole',
    s,
    t: poleT,
    zOffset: 0,
    height: zOffset,
    radius: POLE_RADIUS,
    orientation,
  });

  // 2. Create horizontal arm object from pole top toward signal head
  const headT = signalPartial.t ?? 0;
  const armMidT = (poleT + headT) / 2;
  // hdg for the arm: direction from pole to head in road-local frame
  // In road coordinates, t-axis is perpendicular to s-axis.
  // Arm goes from poleT to headT along t, so hdg = π/2 (left) or -π/2 (right)
  const armHdg = headT > poleT ? Math.PI / 2 : -Math.PI / 2;
  const armObj = store.addObject(roadId, {
    type: 'pole',
    name: 'signal-arm',
    s,
    t: armMidT,
    zOffset,
    length: armLength,
    radius: ARM_RADIUS,
    hdg: armHdg,
    orientation,
  });

  // 3. Create signal with references to pole and arm objects
  const newSignal = store.addSignal(roadId, {
    ...signalPartial,
    reference: [
      ...(signalPartial.reference ?? []),
      { elementType: 'object', elementId: poleObj.id },
      { elementType: 'object', elementId: armObj.id },
    ],
  });

  const assemblyId = uuidv4();
  const assembly: SignalAssemblyMetadata = {
    assemblyId,
    roadId,
    signalIds: [newSignal.id],
    poleType: 'arm',
    armLength,
    armAngle,
    poleObjectId: poleObj.id,
    armObjectId: armObj.id,
    headPositions: [
      {
        signalId: newSignal.id,
        presetId,
        position: 'top',
      },
    ],
  };

  const current = getAssemblies(metaStore);
  setAssemblies(metaStore, [...current, assembly]);

  return newSignal;
}

// ---------------------------------------------------------------------------
// addHeadToAssembly
// ---------------------------------------------------------------------------

/**
 * Add a new signal head to an existing assembly.
 * Creates a new OdrSignal at the same s/t as the first existing head.
 * Returns the new signal ID.
 */
export function addHeadToAssembly(
  odrStore: OpenDriveStoreApi,
  metaStore: EditorMetadataStoreApi,
  assemblyId: string,
  presetId: string,
  position: 'top' | 'arm' | 'lower',
): string | null {
  const assemblies = getAssemblies(metaStore);
  const assembly = assemblies.find((a) => a.assemblyId === assemblyId);
  if (!assembly || assembly.signalIds.length === 0) return null;

  const store = odrStore.getState();
  const doc = store.getDocument();
  const road = doc.roads.find((r) => r.id === assembly.roadId);
  if (!road) return null;

  // Find a reference signal to copy s/t from
  const refSignal = road.signals.find((s) => assembly.signalIds.includes(s.id));
  if (!refSignal) return null;

  // Create the signal via the store's addSignal method
  const preset = getPresetById(presetId);
  const presetFields = preset
    ? presetToSignalPartial(preset)
    : { dynamic: 'yes' as const, type: '-1', subtype: '-1', country: 'OpenDRIVE' };
  const newSignal = store.addSignal(assembly.roadId, {
    s: refSignal.s,
    t: refSignal.t,
    zOffset: refSignal.zOffset,
    orientation: refSignal.orientation,
    ...presetFields,
  });

  // Update assembly metadata
  const updated = assemblies.map((a) =>
    a.assemblyId === assemblyId
      ? {
          ...a,
          signalIds: [...a.signalIds, newSignal.id],
          headPositions: [
            ...a.headPositions,
            { signalId: newSignal.id, presetId, position },
          ],
        }
      : a,
  );
  setAssemblies(metaStore, updated);

  return newSignal.id;
}

// ---------------------------------------------------------------------------
// removeHeadFromAssembly
// ---------------------------------------------------------------------------

/**
 * Remove a head from an assembly. Also removes the OdrSignal.
 */
export function removeHeadFromAssembly(
  odrStore: OpenDriveStoreApi,
  metaStore: EditorMetadataStoreApi,
  assemblyId: string,
  signalId: string,
): void {
  const assemblies = getAssemblies(metaStore);
  const assembly = assemblies.find((a) => a.assemblyId === assemblyId);
  if (!assembly) return;

  // Remove the signal from the OpenDRIVE document
  odrStore.getState().removeSignal(assembly.roadId, signalId);

  // Update assembly metadata
  const updated = assemblies.map((a) =>
    a.assemblyId === assemblyId
      ? {
          ...a,
          signalIds: a.signalIds.filter((id) => id !== signalId),
          headPositions: a.headPositions.filter((hp) => hp.signalId !== signalId),
        }
      : a,
  );
  setAssemblies(metaStore, updated);
}

// ---------------------------------------------------------------------------
// findAssemblyForSignal
// ---------------------------------------------------------------------------

/**
 * Find the assembly that contains a given signal.
 */
export function findAssemblyForSignal(
  metaStore: EditorMetadataStoreApi,
  signalId: string,
): SignalAssemblyMetadata | undefined {
  const assemblies = getAssemblies(metaStore);
  return assemblies.find((a) => a.signalIds.includes(signalId));
}

// ---------------------------------------------------------------------------
// getAssemblySignals
// ---------------------------------------------------------------------------

/**
 * Get the OdrSignal objects for all heads in an assembly.
 */
export function getAssemblySignals(
  odrStore: OpenDriveStoreApi,
  meta: SignalAssemblyMetadata,
): OdrSignal[] {
  const doc = odrStore.getState().getDocument();
  const road = doc.roads.find((r) => r.id === meta.roadId);
  if (!road) return [];
  return road.signals.filter((s) => meta.signalIds.includes(s.id));
}

// ---------------------------------------------------------------------------
// updateAssembly
// ---------------------------------------------------------------------------

/**
 * Update assembly properties (poleType, armLength, armAngle).
 */
export function updateAssembly(
  metaStore: EditorMetadataStoreApi,
  assemblyId: string,
  updates: Partial<Pick<SignalAssemblyMetadata, 'poleType' | 'armLength' | 'armAngle'>>,
): void {
  const assemblies = getAssemblies(metaStore);
  const updated = assemblies.map((a) =>
    a.assemblyId === assemblyId ? { ...a, ...updates } : a,
  );
  setAssemblies(metaStore, updated);
}

// ---------------------------------------------------------------------------
// buildAssembliesFromDocument
// ---------------------------------------------------------------------------

/**
 * Scan an OpenDRIVE document for signals that reference pole/arm objects
 * and build SignalAssemblyMetadata entries.
 *
 * Used after importing a .xodr file to reconstruct assembly metadata
 * from the standard OpenDRIVE elements (signal references → objects).
 */
export function buildAssembliesFromDocument(
  doc: OpenDriveDocument,
): SignalAssemblyMetadata[] {
  const assemblies: SignalAssemblyMetadata[] = [];

  for (const road of doc.roads) {
    const objectMap = new Map(road.objects.map((o) => [o.id, o]));

    for (const signal of road.signals) {
      if (!signal.reference || signal.reference.length === 0) continue;

      // Find pole and arm references by object geometry:
      // - Vertical pole: has height, zOffset ≈ 0
      // - Horizontal arm: has length, zOffset > 0
      let poleObjectId: string | undefined;
      let armObjectId: string | undefined;

      for (const ref of signal.reference) {
        if (ref.elementType !== 'object') continue;
        const obj = objectMap.get(ref.elementId);
        if (!obj || obj.type !== 'pole') continue;

        if (obj.height && (!obj.zOffset || obj.zOffset === 0)) {
          poleObjectId = ref.elementId;
        } else if (obj.length && obj.zOffset && obj.zOffset > 0) {
          armObjectId = ref.elementId;
        }
      }

      if (!poleObjectId) continue;

      const poleObj = objectMap.get(poleObjectId);
      if (!poleObj) continue;

      // Compute arm length from signal t (head) and pole t
      const armLength = armObjectId
        ? (objectMap.get(armObjectId)?.length ?? Math.abs(signal.t - poleObj.t))
        : Math.abs(signal.t - poleObj.t);

      const presetId = signalToPresetId(signal) ?? undefined;

      assemblies.push({
        assemblyId: uuidv4(),
        roadId: road.id,
        signalIds: [signal.id],
        poleType: 'arm',
        armLength,
        poleObjectId,
        armObjectId,
        headPositions: [
          { signalId: signal.id, presetId, position: 'top' },
        ],
      });
    }
  }

  return assemblies;
}

/**
 * High-level operations for signal assemblies.
 * These use the assembly commands and coordinate between the OpenDrive store
 * and the editor metadata store.
 */

import { v4 as uuidv4 } from 'uuid';
import type { OdrSignal } from '@osce/shared';
import type { StoreApi } from 'zustand/vanilla';
import type { OpenDriveStore } from '../store/opendrive-store.js';
import type { EditorMetadataStore } from '../store/editor-metadata-store.js';
import type { SignalAssemblyMetadata } from '../store/editor-metadata-types.js';
import { signalToPresetId } from './preset-to-signal.js';

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

/**
 * Create a signal and wrap it in an arm-mounted assembly in one step.
 * Used during natural signal placement where pole is at road edge and
 * signal head hangs over the driving lane via an arm.
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
  armAngle?: number,
): OdrSignal {
  const store = odrStore.getState();
  const newSignal = store.addSignal(roadId, signalPartial);

  const assemblyId = uuidv4();
  const assembly: SignalAssemblyMetadata = {
    assemblyId,
    roadId,
    signalIds: [newSignal.id],
    poleType: 'arm',
    armLength,
    armAngle,
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
  const newSignal = store.addSignal(assembly.roadId, {
    s: refSignal.s,
    t: refSignal.t,
    zOffset: refSignal.zOffset,
    orientation: refSignal.orientation,
    dynamic: 'yes',
    type: 'trafficLight',
    subtype: presetId,
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

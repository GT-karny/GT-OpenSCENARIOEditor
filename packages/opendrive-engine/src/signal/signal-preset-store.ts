/**
 * Assembly presets — built-in and custom assembly configurations.
 *
 * Persistence is in-memory for now; file I/O will be wired up
 * when the project save system is extended.
 */

import type { SignalAssemblyMetadata } from '../store/editor-metadata-types.js';

/**
 * A housing assembly preset — defines which signal heads are grouped together.
 * Pole/arm configuration is determined by the placement mode (tSnapMode),
 * not by the preset itself.
 */
export interface AssemblyPreset {
  id: string;
  name: string;
  /** Ordered list of signal heads (top-to-bottom on the pole). */
  heads: { presetId: string }[];
}

/** Built-in assembly presets. */
export const BUILT_IN_ASSEMBLY_PRESETS: AssemblyPreset[] = [
  {
    id: 'standard-intersection',
    name: 'Standard Intersection',
    heads: [{ presetId: '3-light-vertical' }, { presetId: 'arrow-left' }],
  },
  {
    id: 'vehicle-pedestrian',
    name: 'Vehicle + Pedestrian',
    heads: [{ presetId: '3-light-vertical' }, { presetId: 'pedestrian-2' }],
  },
  {
    id: 'vehicle-arrow-right',
    name: 'Vehicle + Arrow Right',
    heads: [{ presetId: '3-light-vertical' }, { presetId: 'arrow-right' }],
  },
];

/**
 * Convert an existing assembly metadata into a reusable preset.
 */
export function assemblyToPreset(
  assembly: SignalAssemblyMetadata,
  name: string,
): AssemblyPreset {
  return {
    id: `custom-${Date.now()}`,
    name,
    heads: assembly.headPositions.map((hp) => ({
      presetId: hp.presetId ?? '3-light-vertical',
    })),
  };
}

// --- In-memory custom preset storage ---

let customPresets: AssemblyPreset[] = [];

/** Get all presets (built-in + custom). */
export function getAllAssemblyPresets(): AssemblyPreset[] {
  return [...BUILT_IN_ASSEMBLY_PRESETS, ...customPresets];
}

/** Save a custom preset (in-memory). */
export function saveCustomPreset(preset: AssemblyPreset): void {
  customPresets = customPresets.filter((p) => p.id !== preset.id);
  customPresets.push(preset);
}

/** Remove a custom preset. Built-in presets cannot be removed. */
export function removeCustomPreset(presetId: string): boolean {
  const before = customPresets.length;
  customPresets = customPresets.filter((p) => p.id !== presetId);
  return customPresets.length < before;
}

/** Get a preset by ID (built-in or custom). */
export function getAssemblyPresetById(id: string): AssemblyPreset | undefined {
  return getAllAssemblyPresets().find((p) => p.id === id);
}

/** Clear all custom presets (for testing). */
export function clearCustomPresets(): void {
  customPresets = [];
}

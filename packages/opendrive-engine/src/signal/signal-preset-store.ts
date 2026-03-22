/**
 * Assembly presets — built-in and custom assembly configurations.
 *
 * Persistence is in-memory for now; file I/O will be wired up
 * when the project save system is extended.
 */

import type { SignalAssemblyMetadata } from '../store/editor-metadata-types.js';

/** A saved assembly preset (template for creating new assemblies). */
export interface AssemblyPreset {
  id: string;
  name: string;
  poleType: 'straight' | 'arm';
  armLength?: number;
  heads: { presetId: string; position: 'top' | 'arm' | 'lower'; offsetY?: number }[];
}

/** Built-in assembly presets. */
export const BUILT_IN_ASSEMBLY_PRESETS: AssemblyPreset[] = [
  {
    id: 'standard-intersection',
    name: 'Standard Intersection',
    poleType: 'straight',
    heads: [
      { presetId: '3-light-vertical', position: 'top' },
      { presetId: 'arrow-left', position: 'lower' },
    ],
  },
  {
    id: 'arm-mounted',
    name: 'Arm-Mounted Signal',
    poleType: 'arm',
    armLength: 3,
    heads: [{ presetId: '3-light-vertical', position: 'arm' }],
  },
  {
    id: 'pedestrian-crossing',
    name: 'Pedestrian Crossing',
    poleType: 'straight',
    heads: [
      { presetId: '3-light-vertical', position: 'top' },
      { presetId: 'pedestrian-2', position: 'lower' },
    ],
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
    poleType: assembly.poleType,
    armLength: assembly.armLength,
    heads: assembly.headPositions.map((hp) => ({
      presetId: hp.presetId ?? '3-light-vertical',
      position: hp.position as 'top' | 'arm' | 'lower',
      offsetY: hp.offsetY,
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

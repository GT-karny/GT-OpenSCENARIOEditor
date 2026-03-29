/**
 * Assembly presets — built-in and custom assembly configurations.
 *
 * Each head now carries an (x, y) offset in meters relative to the pole tip origin.
 * The store is implemented as a Zustand vanilla store for reactive subscriptions.
 */

import { createStore } from 'zustand/vanilla';
import type { SignalAssemblyMetadata } from '../store/editor-metadata-types.js';
import { getPresetById } from './signal-presets.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Placement of a single signal head within an assembly (meters from pole tip). */
export interface AssemblyHeadPlacement {
  presetId: string;
  /** Horizontal offset from pole tip in meters (positive = right). */
  x: number;
  /** Vertical offset from pole tip in meters (positive = downward). */
  y: number;
}

/**
 * A housing assembly preset — defines which signal heads are grouped together.
 * Pole/arm configuration is determined by the placement mode (tSnapMode),
 * not by the preset itself.
 */
export interface AssemblyPreset {
  id: string;
  name: string;
  /** Signal heads with placement coordinates. */
  heads: AssemblyHeadPlacement[];
}

// ---------------------------------------------------------------------------
// Head dimension helpers
// ---------------------------------------------------------------------------

import {
  BULB_SPACING,
  BULB_RADIUS,
  HOUSING_PADDING,
  HOUSING_WIDTH,
} from './signal-render-constants.js';

/** Compute the housing height for a given bulb count and orientation. */
export function computeHeadHeight(bulbCount: number, orientation: 'vertical' | 'horizontal'): number {
  const span = (bulbCount - 1) * BULB_SPACING + 2 * (BULB_RADIUS + HOUSING_PADDING);
  return orientation === 'horizontal' ? HOUSING_WIDTH : span;
}

/** Compute the housing width for a given bulb count and orientation. */
export function computeHeadWidth(bulbCount: number, orientation: 'vertical' | 'horizontal'): number {
  const span = (bulbCount - 1) * BULB_SPACING + 2 * (BULB_RADIUS + HOUSING_PADDING);
  return orientation === 'horizontal' ? span : HOUSING_WIDTH;
}

/** Compute default Y positions for heads stacked vertically from origin. */
function stackHeadsVertically(presetIds: string[]): AssemblyHeadPlacement[] {
  let y = 0;
  return presetIds.map((presetId) => {
    const preset = getPresetById(presetId);
    const height = preset ? computeHeadHeight(preset.bulbs.length, preset.orientation) : 0.7;
    const placement: AssemblyHeadPlacement = { presetId, x: 0, y: y + height / 2 };
    y += height + 0.05; // 5cm gap between heads
    return placement;
  });
}

// ---------------------------------------------------------------------------
// Built-in assembly presets
// ---------------------------------------------------------------------------

/** Built-in assembly presets with default stacked layout. */
export const BUILT_IN_ASSEMBLY_PRESETS: AssemblyPreset[] = [
  {
    id: 'standard-intersection',
    name: 'Standard Intersection',
    heads: stackHeadsVertically(['3-light-vertical', 'arrow-left']),
  },
  {
    id: 'vehicle-pedestrian',
    name: 'Vehicle + Pedestrian',
    heads: stackHeadsVertically(['3-light-vertical', 'pedestrian-2']),
  },
  {
    id: 'vehicle-arrow-right',
    name: 'Vehicle + Arrow Right',
    heads: stackHeadsVertically(['3-light-vertical', 'arrow-right']),
  },
];

// ---------------------------------------------------------------------------
// Convert assembly metadata to preset
// ---------------------------------------------------------------------------

/**
 * Convert an existing assembly metadata into a reusable preset.
 */
export function assemblyToPreset(
  assembly: SignalAssemblyMetadata,
  name: string,
): AssemblyPreset {
  const presetIds = assembly.headPositions.map((hp) => hp.presetId ?? '3-light-vertical');
  return {
    id: `custom-${Date.now()}`,
    name,
    heads: assembly.headPositions.map((hp, i) => ({
      presetId: hp.presetId ?? '3-light-vertical',
      x: hp.x ?? 0,
      y: hp.y ?? stackHeadsVertically(presetIds)[i]?.y ?? i * 0.75,
    })),
  };
}

// ---------------------------------------------------------------------------
// Zustand vanilla store
// ---------------------------------------------------------------------------

export interface AssemblyPresetStoreState {
  customPresets: AssemblyPreset[];
  saveCustomPreset: (preset: AssemblyPreset) => void;
  removeCustomPreset: (id: string) => boolean;
  clearCustomPresets: () => void;
}

export const assemblyPresetStore = createStore<AssemblyPresetStoreState>((set, get) => ({
  customPresets: [],

  saveCustomPreset: (preset: AssemblyPreset) => {
    set((state) => ({
      customPresets: [...state.customPresets.filter((p) => p.id !== preset.id), preset],
    }));
  },

  removeCustomPreset: (id: string) => {
    const before = get().customPresets.length;
    set((state) => ({
      customPresets: state.customPresets.filter((p) => p.id !== id),
    }));
    return get().customPresets.length < before;
  },

  clearCustomPresets: () => {
    set({ customPresets: [] });
  },
}));

// ---------------------------------------------------------------------------
// Convenience functions (backward-compatible API)
// ---------------------------------------------------------------------------

/** Get all presets (built-in + custom). */
export function getAllAssemblyPresets(): AssemblyPreset[] {
  return [...BUILT_IN_ASSEMBLY_PRESETS, ...assemblyPresetStore.getState().customPresets];
}

/** Save a custom preset. */
export function saveCustomPreset(preset: AssemblyPreset): void {
  assemblyPresetStore.getState().saveCustomPreset(preset);
}

/** Remove a custom preset. Built-in presets cannot be removed. */
export function removeCustomPreset(presetId: string): boolean {
  return assemblyPresetStore.getState().removeCustomPreset(presetId);
}

/** Get a preset by ID (built-in or custom). */
export function getAssemblyPresetById(id: string): AssemblyPreset | undefined {
  return getAllAssemblyPresets().find((p) => p.id === id);
}

/** Clear all custom presets (for testing). */
export function clearCustomPresets(): void {
  assemblyPresetStore.getState().clearCustomPresets();
}

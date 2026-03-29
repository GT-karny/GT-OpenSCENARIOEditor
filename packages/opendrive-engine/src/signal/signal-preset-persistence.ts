/**
 * Serialization/deserialization for custom assembly presets.
 * Supports versioned JSON format with migration from v1 (no x/y) to v2.
 */

import type { AssemblyPreset, AssemblyHeadPlacement } from './signal-preset-store.js';
import { getPresetById } from './signal-presets.js';
import { computeHeadHeight } from './signal-preset-store.js';

// ---------------------------------------------------------------------------
// File format
// ---------------------------------------------------------------------------

interface PresetFileV2 {
  version: 2;
  presets: AssemblyPreset[];
}

interface PresetFileV1 {
  version?: 1;
  presets: { id: string; name: string; heads: { presetId: string }[] }[];
}

type PresetFile = PresetFileV1 | PresetFileV2;

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

function migrateV1ToV2(v1: PresetFileV1): PresetFileV2 {
  return {
    version: 2,
    presets: v1.presets.map((p) => ({
      ...p,
      heads: stackHeadsFromPresetIds(p.heads.map((h) => h.presetId)),
    })),
  };
}

function stackHeadsFromPresetIds(presetIds: string[]): AssemblyHeadPlacement[] {
  let y = 0;
  return presetIds.map((presetId) => {
    const preset = getPresetById(presetId);
    const height = preset ? computeHeadHeight(preset.bulbs.length, preset.orientation) : 0.7;
    const placement: AssemblyHeadPlacement = { presetId, x: 0, y: y + height / 2 };
    y += height + 0.05;
    return placement;
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Serialize assembly presets to JSON string. */
export function serializePresets(presets: AssemblyPreset[]): string {
  const file: PresetFileV2 = { version: 2, presets };
  return JSON.stringify(file, null, 2);
}

/** Deserialize assembly presets from JSON string. Handles v1 → v2 migration. */
export function deserializePresets(json: string): AssemblyPreset[] {
  const raw = JSON.parse(json) as PresetFile;

  // Detect version
  const version: number = (raw as PresetFileV2).version ?? 1;

  if (version < 2) {
    const migrated = migrateV1ToV2(raw as PresetFileV1);
    return migrated.presets;
  }

  return (raw as PresetFileV2).presets;
}

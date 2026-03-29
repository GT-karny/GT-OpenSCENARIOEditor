/**
 * Convert between signal head presets and OpenDRIVE signal attributes.
 *
 * Maps internal preset IDs to ASAM OpenDRIVE Signal Base Catalog codes
 * (country="OpenDRIVE") so that exported .xodr files are spec-compliant.
 */
import type { OdrSignal } from '@osce/shared';
import type { SignalHeadPreset } from './signal-presets.js';
import { BUILT_IN_PRESETS } from './signal-presets.js';

// ---------------------------------------------------------------------------
// Preset → OpenDRIVE spec mapping
// ---------------------------------------------------------------------------

interface OpenDriveSignalSpec {
  type: string;
  subtype: string;
  country: string;
}

/**
 * ASAM OpenDRIVE Signal Base Catalog mapping.
 *
 * - 1000001: Standard 3-light traffic signal
 * - 1000002: Pedestrian 2-light signal
 * - 1000012: Green single-bulb arrow (subtype = arrow direction)
 *
 * Arrow subtypes: 10=left, 20=right, 30=straight
 */
const PRESET_TO_OPENDRIVE: Record<string, OpenDriveSignalSpec> = {
  '3-light-vertical': {
    type: '1000001',
    subtype: '-1',
    country: 'OpenDRIVE',
  },
  '3-light-horizontal': {
    type: '1000001',
    subtype: '-1',
    country: 'OpenDRIVE',
  },
  'arrow-left': {
    type: '1000012',
    subtype: '10',
    country: 'OpenDRIVE',
  },
  'arrow-right': {
    type: '1000012',
    subtype: '20',
    country: 'OpenDRIVE',
  },
  'arrow-straight': {
    type: '1000012',
    subtype: '30',
    country: 'OpenDRIVE',
  },
  'pedestrian-2': {
    type: '1000002',
    subtype: '-1',
    country: 'OpenDRIVE',
  },
};

// ---------------------------------------------------------------------------
// OpenDRIVE spec → Preset reverse mapping
// ---------------------------------------------------------------------------

/** Reverse map keyed by "type:subtype" or "type" for default-subtype entries. */
const OPENDRIVE_TO_PRESET: Record<string, string> = {
  '1000001:-1': '3-light-vertical',
  '1000001': '3-light-vertical',
  '1000012:10': 'arrow-left',
  '1000012:20': 'arrow-right',
  '1000012:30': 'arrow-straight',
  '1000002:-1': 'pedestrian-2',
  '1000002': 'pedestrian-2',
};

// ---------------------------------------------------------------------------
// Conversion functions
// ---------------------------------------------------------------------------

/** Name prefix used to store the preset ID hint in OdrSignal.name. */
const NAME_PREFIX = 'signal:';

/**
 * Generate OdrSignal partial fields from a preset.
 * Returns ASAM-compliant type/subtype/country values.
 */
export function presetToSignalPartial(preset: SignalHeadPreset): Partial<OdrSignal> {
  const spec = PRESET_TO_OPENDRIVE[preset.id];
  if (spec) {
    return {
      dynamic: 'yes',
      type: spec.type,
      subtype: spec.subtype,
      country: spec.country,
      // NOTE: countryRevision intentionally omitted — esmini has a parser bug
      // where present countryRevision causes signals to not be created as
      // TrafficLight instances (empty() condition is inverted in RoadManager.cpp)
      name: `${NAME_PREFIX}${preset.id}`,
    };
  }
  // Fallback for unknown presets — preserve raw ID for debugging
  return {
    dynamic: 'yes',
    type: '-1',
    subtype: '-1',
    country: 'OpenDRIVE',
    name: `${NAME_PREFIX}${preset.id}`,
  };
}

/**
 * Resolve preset ID from an existing OdrSignal.
 *
 * Three-stage fallback:
 *  1. `name` hint (most reliable — written by our editor, distinguishes horizontal)
 *  2. ASAM type+subtype reverse lookup (for spec-compliant files from other tools)
 *  3. Legacy subtype = preset ID (backward compat with old saved files)
 */
export function signalToPresetId(signal: OdrSignal): string | null {
  // 1. Name hint written by our editor
  if (signal.name?.startsWith(NAME_PREFIX)) {
    const candidate = signal.name.slice(NAME_PREFIX.length);
    if (BUILT_IN_PRESETS.find((p) => p.id === candidate)) {
      return candidate;
    }
  }

  // 2. Spec-compliant type+subtype lookup
  const type = signal.type ?? '';
  const subtype = signal.subtype ?? '';
  const specificKey = subtype ? `${type}:${subtype}` : type;
  if (OPENDRIVE_TO_PRESET[specificKey]) return OPENDRIVE_TO_PRESET[specificKey];
  if (OPENDRIVE_TO_PRESET[type]) return OPENDRIVE_TO_PRESET[type];

  // 3. Legacy fallback: old non-standard subtype = preset ID
  if (signal.subtype && BUILT_IN_PRESETS.find((p) => p.id === signal.subtype)) {
    return signal.subtype;
  }

  return null;
}

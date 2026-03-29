/**
 * Data-driven signal catalog mapping OpenDRIVE (type, subtype) to visual descriptors.
 *
 * Based on ASAM OpenDRIVE Signal Base Catalog (country="OpenDRIVE").
 * Single source of truth — consumed by both opendrive-engine and 3d-viewer.
 */

import type { OdrSignal } from '@osce/shared';
import type { BulbColor, BulbDefinition, BulbFaceShape, SignalDescriptor } from './signal-preset-types.js';
import {
  BULB_RADIUS,
  BULB_SPACING,
  HOUSING_DEPTH,
  HOUSING_PADDING,
  HOUSING_WIDTH,
} from './signal-render-constants.js';

// ---------------------------------------------------------------------------
// Housing geometry
// ---------------------------------------------------------------------------

export function housingForBulbCount(
  n: number,
  orientation: SignalDescriptor['orientation'] = 'vertical',
): SignalDescriptor['housing'] {
  const span = (n - 1) * BULB_SPACING + 2 * (BULB_RADIUS + HOUSING_PADDING);
  if (orientation === 'horizontal') {
    return { width: span, depth: HOUSING_DEPTH, height: HOUSING_WIDTH };
  }
  return { width: HOUSING_WIDTH, depth: HOUSING_DEPTH, height: span };
}

// ---------------------------------------------------------------------------
// Arrow subtype → BulbFaceShape mapping
// ---------------------------------------------------------------------------

export const ARROW_SUBTYPE_MAP: Record<string, BulbFaceShape> = {
  '-1': 'circle',
  '-': 'circle',
  '10': 'arrow-left',
  '20': 'arrow-right',
  '30': 'arrow-up',
  '40': 'arrow-up-left',
  '50': 'arrow-up-right',
  '60': 'arrow-turn-left',
  '70': 'arrow-diagonal-right',
  '80': 'arrow-uturn',
  '90': 'arrow-uturn',
  '100': 'arrow-complex',
};

// ---------------------------------------------------------------------------
// Catalog builder helpers
// ---------------------------------------------------------------------------

function desc(
  label: string,
  bulbs: BulbDefinition[],
  orientation: 'vertical' | 'horizontal' = 'vertical',
): SignalDescriptor {
  return {
    label,
    bulbs,
    housing: housingForBulbCount(bulbs.length, orientation),
    bulbRadius: BULB_RADIUS,
    orientation,
  };
}

function bulb(color: BulbColor, shape: BulbFaceShape = 'circle'): BulbDefinition {
  return { color, shape };
}

function singleArrowEntries(
  type: string,
  color: BulbColor,
  colorLabel: string,
): [string, SignalDescriptor][] {
  const entries: [string, SignalDescriptor][] = [
    [type, desc(`${colorLabel} dot`, [bulb(color, 'circle')])],
  ];
  for (const [sub, shape] of Object.entries(ARROW_SUBTYPE_MAP)) {
    if (sub === '-1' || sub === '-') continue;
    entries.push([
      `${type}:${sub}`,
      desc(`${colorLabel} ${shape}`, [bulb(color, shape)]),
    ]);
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Signal Catalog
// ---------------------------------------------------------------------------

export const SIGNAL_CATALOG: ReadonlyMap<string, SignalDescriptor> = new Map<
  string,
  SignalDescriptor
>([
  // === 1000001: Standard 3-light ===
  ['1000001', desc('Standard 3-light', [bulb('red'), bulb('yellow'), bulb('green')])],

  // === 1000002: Pedestrian signal ===
  [
    '1000002',
    desc('Pedestrian 2-light', [bulb('red', 'pedestrian-stop'), bulb('green', 'pedestrian-go')]),
  ],
  ['1000002:10', desc('Pedestrian red only', [bulb('red', 'pedestrian-stop')])],
  ['1000002:20', desc('Pedestrian green only', [bulb('green', 'pedestrian-go')])],

  // === 1000009: 2-light combinations ===
  ['1000009:10', desc('Red-yellow 2-light', [bulb('red'), bulb('yellow')])],
  ['1000009:20', desc('Yellow-green 2-light', [bulb('yellow'), bulb('green')])],
  ['1000009:30', desc('Red-green 2-light', [bulb('red'), bulb('green')])],

  // === 1000011: Direction arrow 3-light ===
  ...(['10', '20', '30', '40', '50'] as const).map((sub): [string, SignalDescriptor] => {
    const shape = ARROW_SUBTYPE_MAP[sub] ?? 'circle';
    return [
      `1000011:${sub}`,
      desc(`Arrow ${shape} 3-light`, [bulb('red', shape), bulb('yellow', shape), bulb('green', shape)]),
    ];
  }),

  // === Single-bulb arrow signals ===
  ...singleArrowEntries('1000020', 'red', 'Red'),
  ...singleArrowEntries('1000008', 'yellow', 'Yellow'),
  ...singleArrowEntries('1000012', 'green', 'Green'),

  // === Legacy compatibility: non-standard preset-based keys (type="trafficLight") ===
  // Kept for backward compat with files saved before ASAM-compliant mapping was added.
  ['trafficLight:3-light-vertical', desc('3-Light Vertical', [bulb('red'), bulb('yellow'), bulb('green')], 'vertical')],
  ['trafficLight:3-light-horizontal', desc('3-Light Horizontal', [bulb('red'), bulb('yellow'), bulb('green')], 'horizontal')],
  ['trafficLight:arrow-left', desc('Arrow Left', [bulb('green', 'arrow-left')], 'vertical')],
  ['trafficLight:arrow-right', desc('Arrow Right', [bulb('green', 'arrow-right')], 'vertical')],
  ['trafficLight:arrow-straight', desc('Arrow Straight', [bulb('green', 'arrow-up')], 'vertical')],
  ['trafficLight:pedestrian-2', desc('Pedestrian 2-Light', [bulb('red', 'pedestrian-stop'), bulb('green', 'pedestrian-go')], 'vertical')],
]);

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

function makeCatalogKey(type: string, subtype?: string): string {
  if (!subtype || subtype === '-1' || subtype === '-') return type;
  return `${type}:${subtype}`;
}

/** Name prefix used by preset-to-signal.ts to store preset ID in signal.name. */
const NAME_PREFIX = 'signal:';

/**
 * Resolve a SignalDescriptor for the given OpenDRIVE signal.
 * Returns null if the signal type is not a traffic light in the catalog.
 *
 * Resolution order:
 *  1. Name hint → legacy catalog key
 *  2. ASAM type:subtype → catalog lookup
 *  3. ASAM type-only → catalog lookup
 *  4. Dynamic fallback → standard 3-light vertical
 */
export function resolveSignalDescriptor(signal: OdrSignal): SignalDescriptor | null {
  // 1. Name hint — resolves orientation-specific variants (horizontal vs vertical)
  if (signal.name?.startsWith(NAME_PREFIX)) {
    const presetId = signal.name.slice(NAME_PREFIX.length);
    const byLegacyKey = SIGNAL_CATALOG.get(`trafficLight:${presetId}`);
    if (byLegacyKey) return byLegacyKey;
  }

  const type = signal.type ?? '';
  const subtype = signal.subtype;

  // 2. Try specific type:subtype, then type-only
  const specificKey = makeCatalogKey(type, subtype);
  const descriptor = SIGNAL_CATALOG.get(specificKey) ?? SIGNAL_CATALOG.get(type);

  if (descriptor) return descriptor;

  // 3. Fallback: dynamic signals default to standard 3-light (vertical)
  if (signal.dynamic === 'yes') {
    return SIGNAL_CATALOG.get('1000001') ?? SIGNAL_CATALOG.get('trafficLight:3-light-vertical')!;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Signal classification (moved from 3d-viewer signal-geometry.ts)
// ---------------------------------------------------------------------------

/** Visual category for rendering dispatch */
export type SignalCategory = 'trafficLight' | 'stopSign' | 'speedLimit' | 'generic';

/**
 * Classify an OpenDRIVE signal into a visual category.
 */
export function classifySignal(signal: OdrSignal): SignalCategory {
  const type = signal.type ?? '';
  const dynamic = signal.dynamic ?? 'no';

  if (dynamic === 'yes') return 'trafficLight';
  if (type === 'trafficLight') return 'trafficLight';
  if (/^100\d{4}$/.test(type)) return 'trafficLight';
  if (type === '206') return 'stopSign';
  if (type === '274' || type === '278') return 'speedLimit';

  return 'generic';
}

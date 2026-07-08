/**
 * Entity color property helpers.
 *
 * esmini reads `<Property name="color" value="#RRGGBB"/>` inside a Vehicle /
 * Pedestrian / MiscObject `<Properties>` block and uses it for the filled
 * bounding-box color (and OSI RGB). These helpers read/write that property
 * on a ScenarioEntity in a type-safe, immutable way.
 */

import type { ScenarioEntity } from '../types/entities.js';
import type { Property } from '../types/scenario.js';

export const ENTITY_COLOR_PROPERTY_NAME = 'color';

export interface ColorPreset {
  name: string;
  hex: string;
}

/**
 * Default vehicle color presets. Swap this list to change the palette.
 */
export const VEHICLE_COLOR_PRESETS: ColorPreset[] = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Gray', hex: '#606060' },
  { name: 'Black', hex: '#1A1A1A' },
  { name: 'Red', hex: '#C41E1E' },
  { name: 'Orange', hex: '#E8742C' },
  { name: 'Yellow', hex: '#E8C942' },
  { name: 'Green', hex: '#1F7A3C' },
  { name: 'Sky', hex: '#5EB6FF' },
  { name: 'Blue', hex: '#073E99' },
  { name: 'Navy', hex: '#0A2342' },
  { name: 'Brown', hex: '#5C3A1E' },
];

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidHex(s: string | undefined | null): s is string {
  return typeof s === 'string' && HEX_RE.test(s);
}

export function normalizeHex(s: string): string {
  return s.toUpperCase();
}

type DefinitionWithProperties = { kind: 'vehicle' | 'pedestrian' | 'miscObject'; properties: Property[] };

function hasProperties(entity: ScenarioEntity): entity is ScenarioEntity & { definition: DefinitionWithProperties } {
  const def = entity.definition;
  return def.kind === 'vehicle' || def.kind === 'pedestrian' || def.kind === 'miscObject';
}

/**
 * Read the color property from an entity. Returns undefined for catalog
 * references, entities without a color property, or invalid hex values.
 */
export function readEntityColor(entity: ScenarioEntity): string | undefined {
  if (!hasProperties(entity)) return undefined;
  const prop = entity.definition.properties.find((p) => p.name === ENTITY_COLOR_PROPERTY_NAME);
  if (!prop) return undefined;
  return isValidHex(prop.value) ? normalizeHex(prop.value) : undefined;
}

/**
 * Return a new entity with the color property set (or removed when hex is
 * undefined). Does nothing for catalog references.
 */
export function writeEntityColor(entity: ScenarioEntity, hex: string | undefined): ScenarioEntity {
  if (!hasProperties(entity)) return entity;
  const def = entity.definition;
  const others = def.properties.filter((p) => p.name !== ENTITY_COLOR_PROPERTY_NAME);
  const nextProps: Property[] =
    hex === undefined ? others : [...others, { name: ENTITY_COLOR_PROPERTY_NAME, value: normalizeHex(hex) }];
  return {
    ...entity,
    definition: { ...def, properties: nextProps },
  };
}

/**
 * Pick a random preset color, optionally avoiding a specific hex.
 */
export function pickRandomPresetColor(exclude?: string): string {
  const pool = exclude ? VEHICLE_COLOR_PRESETS.filter((p) => p.hex !== exclude) : VEHICLE_COLOR_PRESETS;
  const list = pool.length > 0 ? pool : VEHICLE_COLOR_PRESETS;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx].hex;
}

/**
 * True when the entity is a type that supports the color property
 * (vehicle / pedestrian / miscObject — not a catalog reference).
 */
export function supportsEntityColor(entity: ScenarioEntity): boolean {
  return hasProperties(entity);
}

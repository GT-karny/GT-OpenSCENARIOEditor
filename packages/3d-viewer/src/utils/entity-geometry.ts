/**
 * Extracts geometry parameters from ScenarioEntity definitions for 3D rendering.
 */

import type { ScenarioEntity, EntityType, BoundingBox } from '@osce/shared';

/**
 * Geometry parameters for rendering an entity as a 3D primitive.
 */
export interface EntityGeometryParams {
  width: number;
  length: number;
  height: number;
  centerX: number;
  centerY: number;
  centerZ: number;
}

// Default bounding boxes for entities without explicit definitions
const DEFAULT_VEHICLE_BB: BoundingBox = {
  center: { x: 1.4, y: 0, z: 0.9 },
  dimensions: { width: 2.0, length: 4.5, height: 1.8 },
};

const DEFAULT_PEDESTRIAN_BB: BoundingBox = {
  center: { x: 0, y: 0, z: 0.85 },
  dimensions: { width: 0.5, length: 0.5, height: 1.7 },
};

const DEFAULT_MISC_BB: BoundingBox = {
  center: { x: 0, y: 0, z: 0.5 },
  dimensions: { width: 1.0, length: 1.0, height: 1.0 },
};

/**
 * Extract geometry params from entity definition.
 * Falls back to sensible defaults for catalog references or missing data.
 */
export function getEntityGeometry(entity: ScenarioEntity): EntityGeometryParams {
  const bb = extractBoundingBox(entity);
  return {
    width: bb.dimensions.width,
    length: bb.dimensions.length,
    height: bb.dimensions.height,
    centerX: bb.center.x,
    centerY: bb.center.y,
    centerZ: bb.center.z,
  };
}

function extractBoundingBox(entity: ScenarioEntity): BoundingBox {
  const def = entity.definition;
  if ('boundingBox' in def && def.boundingBox) {
    return def.boundingBox;
  }
  // Catalog reference or missing — use defaults based on entity type
  return getDefaultBoundingBox(entity.type);
}

function getDefaultBoundingBox(entityType: EntityType): BoundingBox {
  switch (entityType) {
    case 'vehicle':
      return DEFAULT_VEHICLE_BB;
    case 'pedestrian':
      return DEFAULT_PEDESTRIAN_BB;
    case 'miscObject':
      return DEFAULT_MISC_BB;
    default:
      return DEFAULT_MISC_BB;
  }
}

// Entity type colors for 3D rendering
const ENTITY_COLORS: Record<string, string> = {
  vehicle: '#33CC33',
  vehicle_ego: '#3366FF',
  pedestrian: '#FF8800',
  miscObject: '#CCCC00',
};

/**
 * Get the display color for an entity type.
 * Ego vehicles get a distinct blue color.
 */
export function getEntityColor(entityType: EntityType, isEgo: boolean): string {
  if (entityType === 'vehicle' && isEgo) {
    return ENTITY_COLORS.vehicle_ego;
  }
  return ENTITY_COLORS[entityType] ?? '#999999';
}

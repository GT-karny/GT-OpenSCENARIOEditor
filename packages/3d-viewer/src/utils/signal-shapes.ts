/**
 * THREE.Shape wrappers for traffic signal bulb overlays.
 *
 * All shapes are generated from the canonical point-array paths in
 * @osce/opendrive-engine/signal-shape-paths.ts.
 * This file converts them to THREE.Shape objects and caches the results.
 */

import * as THREE from 'three';
import type { BulbFaceShape } from './signal-catalog.js';
import { getShapePath } from '@osce/opendrive-engine';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function shapeFromPoints(points: [number, number][]): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();
  return shape;
}

// ---------------------------------------------------------------------------
// Shape cache
// ---------------------------------------------------------------------------

const SHAPE_CACHE = new Map<BulbFaceShape, THREE.Shape>();

/**
 * Get the Three.js Shape for a given BulbFaceShape.
 * Returns null for 'circle' (uses default sphere, no overlay needed).
 * Shapes are cached for reuse across all signal instances.
 */
export function getShape(faceShape: BulbFaceShape): THREE.Shape | null {
  if (faceShape === 'circle') return null;

  let shape = SHAPE_CACHE.get(faceShape);
  if (!shape) {
    const path = getShapePath(faceShape);
    if (!path) return null;
    shape = shapeFromPoints(path);
    SHAPE_CACHE.set(faceShape, shape);
  }
  return shape;
}

// ---------------------------------------------------------------------------
// ShapeGeometry cache — avoids re-triangulating the same Shape per signal
// ---------------------------------------------------------------------------

const SHAPE_GEOMETRY_CACHE = new Map<BulbFaceShape, THREE.ShapeGeometry>();

/**
 * Get a cached ShapeGeometry for a given BulbFaceShape.
 * Returns null for 'circle' or unknown shapes.
 */
export function getShapeGeometry(faceShape: BulbFaceShape): THREE.ShapeGeometry | null {
  if (faceShape === 'circle') return null;

  let geo = SHAPE_GEOMETRY_CACHE.get(faceShape);
  if (!geo) {
    const shape = getShape(faceShape);
    if (!shape) return null;
    geo = new THREE.ShapeGeometry(shape);
    SHAPE_GEOMETRY_CACHE.set(faceShape, geo);
  }
  return geo;
}

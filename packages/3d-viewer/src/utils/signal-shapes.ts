/**
 * Arrow and pedestrian silhouette shapes for traffic signal rendering.
 *
 * All shapes are normalized to fit within a unit circle of radius ~0.7.
 * They are scaled to the bulb radius at render time.
 */

import * as THREE from 'three';
import type { BulbFaceShape } from './signal-catalog.js';

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

function rotatePoints(
  points: [number, number][],
  angleRad: number,
): [number, number][] {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return points.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos]);
}

// ---------------------------------------------------------------------------
// Arrow shapes
// ---------------------------------------------------------------------------

/** Straight-ahead arrow ↑ */
export function createArrowUpShape(): THREE.Shape {
  return shapeFromPoints([
    [0, 0.65],
    [-0.28, 0.2],
    [-0.12, 0.2],
    [-0.12, -0.5],
    [0.12, -0.5],
    [0.12, 0.2],
    [0.28, 0.2],
  ]);
}

/** Left arrow ← */
export function createArrowLeftShape(): THREE.Shape {
  return shapeFromPoints(rotatePoints(
    [[0, 0.65], [-0.28, 0.2], [-0.12, 0.2], [-0.12, -0.5], [0.12, -0.5], [0.12, 0.2], [0.28, 0.2]],
    Math.PI / 2,
  ));
}

/** Right arrow → */
export function createArrowRightShape(): THREE.Shape {
  return shapeFromPoints(rotatePoints(
    [[0, 0.65], [-0.28, 0.2], [-0.12, 0.2], [-0.12, -0.5], [0.12, -0.5], [0.12, 0.2], [0.28, 0.2]],
    -Math.PI / 2,
  ));
}

/** Upper-left combined arrow (straight + left) — single continuous closed path */
export function createArrowUpLeftShape(): THREE.Shape {
  const shape = new THREE.Shape();
  // Trace the entire outline as one continuous path:
  // Start bottom-right of shaft, go clockwise
  shape.moveTo(0.1, -0.45);
  // Up the right side of the shaft
  shape.lineTo(0.1, 0.2);
  // Right side of upward arrowhead
  shape.lineTo(0.25, 0.2);
  // Upward arrowhead tip
  shape.lineTo(0, 0.6);
  // Left side of upward arrowhead
  shape.lineTo(-0.25, 0.2);
  // Down to junction on left side
  shape.lineTo(-0.1, 0.2);
  // Left to left-branch stem
  shape.lineTo(-0.1, 0.13);
  // Left branch arrowhead upper edge
  shape.lineTo(-0.25, 0.2);
  // Left arrowhead tip
  shape.lineTo(-0.55, 0.05);
  // Left branch arrowhead lower edge
  shape.lineTo(-0.25, -0.1);
  // Back to shaft left side
  shape.lineTo(-0.1, -0.03);
  // Down left side of shaft
  shape.lineTo(-0.1, -0.45);
  shape.closePath();
  return shape;
}

/** Upper-right combined arrow (straight + right) — single continuous closed path */
export function createArrowUpRightShape(): THREE.Shape {
  const shape = new THREE.Shape();
  // Mirror of upper-left: trace the entire outline as one continuous path
  // Start bottom-left of shaft, go counter-clockwise
  shape.moveTo(-0.1, -0.45);
  // Up the left side of the shaft
  shape.lineTo(-0.1, 0.2);
  // Left side of upward arrowhead
  shape.lineTo(-0.25, 0.2);
  // Upward arrowhead tip
  shape.lineTo(0, 0.6);
  // Right side of upward arrowhead
  shape.lineTo(0.25, 0.2);
  // Down to junction on right side
  shape.lineTo(0.1, 0.2);
  // Right to right-branch stem
  shape.lineTo(0.1, 0.13);
  // Right branch arrowhead upper edge
  shape.lineTo(0.25, 0.2);
  // Right arrowhead tip
  shape.lineTo(0.55, 0.05);
  // Right branch arrowhead lower edge
  shape.lineTo(0.25, -0.1);
  // Back to shaft right side
  shape.lineTo(0.1, -0.03);
  // Down right side of shaft
  shape.lineTo(0.1, -0.45);
  shape.closePath();
  return shape;
}

/** Diagonal-left arrow ↖ */
export function createArrowDiagonalLeftShape(): THREE.Shape {
  return shapeFromPoints(rotatePoints(
    [[0, 0.65], [-0.28, 0.2], [-0.12, 0.2], [-0.12, -0.5], [0.12, -0.5], [0.12, 0.2], [0.28, 0.2]],
    Math.PI / 4,
  ));
}

/** Diagonal-right arrow ↗ */
export function createArrowDiagonalRightShape(): THREE.Shape {
  return shapeFromPoints(rotatePoints(
    [[0, 0.65], [-0.28, 0.2], [-0.12, 0.2], [-0.12, -0.5], [0.12, -0.5], [0.12, 0.2], [0.28, 0.2]],
    -Math.PI / 4,
  ));
}

/** Hook/turn-left arrow (curves down then left) */
export function createArrowTurnLeftShape(): THREE.Shape {
  const shape = new THREE.Shape();
  // Arrowhead pointing left
  shape.moveTo(-0.55, 0.15);
  shape.lineTo(-0.25, 0.4);
  shape.lineTo(-0.25, 0.23);
  // Curved shaft going right and down
  shape.quadraticCurveTo(0.1, 0.23, 0.1, -0.1);
  shape.lineTo(0.1, -0.5);
  shape.lineTo(-0.1, -0.5);
  shape.lineTo(-0.1, -0.1);
  shape.quadraticCurveTo(-0.1, 0.07, -0.25, 0.07);
  shape.lineTo(-0.25, -0.1);
  shape.closePath();
  return shape;
}

/** Hook/turn-right arrow (mirror of turn-left) */
export function createArrowTurnRightShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0.55, 0.15);
  shape.lineTo(0.25, 0.4);
  shape.lineTo(0.25, 0.23);
  shape.quadraticCurveTo(-0.1, 0.23, -0.1, -0.1);
  shape.lineTo(-0.1, -0.5);
  shape.lineTo(0.1, -0.5);
  shape.lineTo(0.1, -0.1);
  shape.quadraticCurveTo(0.1, 0.07, 0.25, 0.07);
  shape.lineTo(0.25, -0.1);
  shape.closePath();
  return shape;
}

/** U-turn arrow */
export function createArrowUturnShape(): THREE.Shape {
  const shape = new THREE.Shape();
  // Arrowhead pointing down-left
  shape.moveTo(-0.35, -0.1);
  shape.lineTo(-0.1, 0.15);
  shape.lineTo(-0.1, 0.0);
  // Curved top
  shape.quadraticCurveTo(-0.1, 0.4, 0.15, 0.4);
  shape.quadraticCurveTo(0.35, 0.4, 0.35, 0.1);
  shape.lineTo(0.35, -0.5);
  shape.lineTo(0.15, -0.5);
  shape.lineTo(0.15, 0.1);
  shape.quadraticCurveTo(0.15, 0.25, 0.0, 0.25);
  shape.quadraticCurveTo(-0.1, 0.25, -0.1, 0.15);
  shape.lineTo(-0.1, -0.25);
  shape.closePath();
  return shape;
}

/** Complex/combined arrow (simplified as double arrowheads) */
export function createArrowComplexShape(): THREE.Shape {
  // Simplified: two opposing arrowheads (down-split pattern)
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.5);
  shape.lineTo(-0.15, 0.2);
  shape.lineTo(-0.06, 0.2);
  shape.lineTo(-0.06, 0.0);
  shape.lineTo(-0.35, -0.35);
  shape.lineTo(-0.2, -0.35);
  shape.lineTo(0, -0.1);
  shape.lineTo(0.2, -0.35);
  shape.lineTo(0.35, -0.35);
  shape.lineTo(0.06, 0.0);
  shape.lineTo(0.06, 0.2);
  shape.lineTo(0.15, 0.2);
  shape.closePath();
  return shape;
}

// ---------------------------------------------------------------------------
// Pedestrian silhouettes
// ---------------------------------------------------------------------------

/** Standing person silhouette (red signal — stop) */
export function createPedestrianStopShape(): THREE.Shape {
  const shape = new THREE.Shape();
  // Standing figure — arms at sides, legs slightly apart
  // Start at left shoulder
  shape.moveTo(-0.12, 0.22);
  // Down left side of torso to shoulder
  shape.lineTo(-0.12, 0.15);
  // Left arm — from shoulder, angled down and out
  shape.lineTo(-0.38, -0.04);
  shape.lineTo(-0.34, -0.10);
  // Back to torso at armpit level
  shape.lineTo(-0.12, 0.06);
  // Down to hip
  shape.lineTo(-0.10, -0.08);
  // Left leg
  shape.lineTo(-0.16, -0.55);
  shape.lineTo(-0.09, -0.55);
  shape.lineTo(0, -0.18);
  // Right leg
  shape.lineTo(0.09, -0.55);
  shape.lineTo(0.16, -0.55);
  shape.lineTo(0.10, -0.08);
  // Up right side to armpit
  shape.lineTo(0.12, 0.06);
  // Right arm — from shoulder, angled down and out
  shape.lineTo(0.34, -0.10);
  shape.lineTo(0.38, -0.04);
  // Back to right shoulder
  shape.lineTo(0.12, 0.15);
  // Close at neck
  shape.lineTo(0.12, 0.22);
  shape.closePath();
  return shape;
}

/** Walking person silhouette (green signal — go) */
export function createPedestrianGoShape(): THREE.Shape {
  const shape = new THREE.Shape();
  // Walking figure — legs in stride, arms swinging dynamically
  // Start at left shoulder
  shape.moveTo(-0.06, 0.22);
  // Down left side to shoulder
  shape.lineTo(-0.10, 0.15);
  // Left arm forward — from shoulder, reaching forward-down
  shape.lineTo(-0.40, -0.06);
  shape.lineTo(-0.36, -0.12);
  // Back to torso at armpit
  shape.lineTo(-0.10, 0.06);
  // Down to hip
  shape.lineTo(-0.08, -0.08);
  // Left leg forward (stride)
  shape.lineTo(-0.25, -0.55);
  shape.lineTo(-0.18, -0.55);
  shape.lineTo(-0.02, -0.18);
  // Right leg back
  shape.lineTo(0.12, -0.55);
  shape.lineTo(0.19, -0.55);
  shape.lineTo(0.08, -0.08);
  // Up right side to armpit
  shape.lineTo(0.10, 0.06);
  // Right arm back — from shoulder, reaching back-down
  shape.lineTo(0.36, -0.12);
  shape.lineTo(0.40, -0.06);
  // Back to right shoulder
  shape.lineTo(0.10, 0.15);
  // Close at neck
  shape.lineTo(0.06, 0.22);
  shape.closePath();
  return shape;
}

// ---------------------------------------------------------------------------
// Shape cache
// ---------------------------------------------------------------------------

const SHAPE_CACHE = new Map<BulbFaceShape, THREE.Shape>();

const SHAPE_CREATORS: Partial<Record<BulbFaceShape, () => THREE.Shape>> = {
  'arrow-up': createArrowUpShape,
  'arrow-left': createArrowLeftShape,
  'arrow-right': createArrowRightShape,
  'arrow-up-left': createArrowUpLeftShape,
  'arrow-up-right': createArrowUpRightShape,
  'arrow-diagonal-left': createArrowDiagonalLeftShape,
  'arrow-diagonal-right': createArrowDiagonalRightShape,
  'arrow-turn-left': createArrowTurnLeftShape,
  'arrow-turn-right': createArrowTurnRightShape,
  'arrow-uturn': createArrowUturnShape,
  'arrow-complex': createArrowComplexShape,
  'pedestrian-stop': createPedestrianStopShape,
  'pedestrian-go': createPedestrianGoShape,
};

/**
 * Get the Three.js Shape for a given BulbFaceShape.
 * Returns null for 'circle' (uses default sphere, no overlay needed).
 * Shapes are cached for reuse across all signal instances.
 */
export function getShape(faceShape: BulbFaceShape): THREE.Shape | null {
  if (faceShape === 'circle') return null;

  let shape = SHAPE_CACHE.get(faceShape);
  if (!shape) {
    const creator = SHAPE_CREATORS[faceShape];
    if (!creator) return null;
    shape = creator();
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

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

/** Upper-left combined arrow (straight + left) */
export function createArrowUpLeftShape(): THREE.Shape {
  const shape = new THREE.Shape();
  // Main shaft pointing up
  shape.moveTo(-0.1, -0.45);
  shape.lineTo(0.1, -0.45);
  shape.lineTo(0.1, 0.05);
  // Left branch arrowhead
  shape.lineTo(0.0, 0.05);
  shape.lineTo(-0.45, 0.05);
  shape.lineTo(-0.25, 0.2);
  shape.lineTo(-0.55, 0.35);
  shape.lineTo(-0.25, -0.1);
  shape.lineTo(-0.45, 0.05);
  // Continue back to shaft top, then up arrowhead
  shape.moveTo(-0.1, 0.05);
  shape.lineTo(-0.1, 0.2);
  shape.lineTo(-0.25, 0.2);
  shape.lineTo(0, 0.6);
  shape.lineTo(0.25, 0.2);
  shape.lineTo(0.1, 0.2);
  shape.lineTo(0.1, 0.05);
  shape.closePath();
  return shape;
}

/** Upper-right combined arrow (straight + right) */
export function createArrowUpRightShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.1, -0.45);
  shape.lineTo(0.1, -0.45);
  shape.lineTo(0.1, 0.05);
  shape.lineTo(0.45, 0.05);
  shape.lineTo(0.25, 0.2);
  shape.lineTo(0.55, 0.35);
  shape.lineTo(0.25, -0.1);
  shape.lineTo(0.45, 0.05);
  shape.moveTo(0.1, 0.05);
  shape.lineTo(0.1, 0.2);
  shape.lineTo(0.25, 0.2);
  shape.lineTo(0, 0.6);
  shape.lineTo(-0.25, 0.2);
  shape.lineTo(-0.1, 0.2);
  shape.lineTo(-0.1, -0.45);
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
  // Standing figure — arms at sides, legs together
  // Body
  shape.moveTo(-0.1, 0.22);
  shape.lineTo(-0.1, -0.05);
  // Left arm
  shape.lineTo(-0.22, -0.15);
  shape.lineTo(-0.18, -0.2);
  shape.lineTo(-0.1, -0.12);
  // Left leg
  shape.lineTo(-0.1, -0.2);
  shape.lineTo(-0.15, -0.55);
  shape.lineTo(-0.08, -0.55);
  shape.lineTo(0, -0.25);
  // Right leg
  shape.lineTo(0.08, -0.55);
  shape.lineTo(0.15, -0.55);
  shape.lineTo(0.1, -0.2);
  // Right arm
  shape.lineTo(0.1, -0.12);
  shape.lineTo(0.18, -0.2);
  shape.lineTo(0.22, -0.15);
  shape.lineTo(0.1, -0.05);
  // Close torso
  shape.lineTo(0.1, 0.22);
  shape.closePath();
  return shape;
}

/** Walking person silhouette (green signal — go) */
export function createPedestrianGoShape(): THREE.Shape {
  const shape = new THREE.Shape();
  // Walking figure — legs apart in stride, arms swinging
  // Torso
  shape.moveTo(-0.06, 0.22);
  shape.lineTo(-0.08, 0.05);
  // Left arm forward
  shape.lineTo(-0.28, -0.1);
  shape.lineTo(-0.24, -0.15);
  shape.lineTo(-0.08, -0.02);
  // Left leg forward (stride)
  shape.lineTo(-0.12, -0.15);
  shape.lineTo(-0.25, -0.55);
  shape.lineTo(-0.18, -0.55);
  shape.lineTo(-0.02, -0.2);
  // Right leg back
  shape.lineTo(0.1, -0.55);
  shape.lineTo(0.17, -0.55);
  shape.lineTo(0.08, -0.15);
  shape.lineTo(0.08, -0.02);
  // Right arm back
  shape.lineTo(0.24, -0.15);
  shape.lineTo(0.28, -0.1);
  shape.lineTo(0.08, 0.05);
  // Close torso
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

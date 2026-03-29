/**
 * Arrow and pedestrian silhouette shape paths — pure JS, no THREE.js dependency.
 *
 * All shapes are normalized to fit within a unit circle of radius ~0.7.
 * Paths are represented as [x, y][] point arrays.
 *
 * Mirrors the shapes in @osce/3d-viewer signal-shapes.ts.
 */

import type { BulbFaceShape } from './signal-preset-types.js';

export type ShapePath = [number, number][];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rotatePoints(
  points: ShapePath,
  angleRad: number,
): ShapePath {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return points.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos]);
}

// ---------------------------------------------------------------------------
// Arrow shapes
// ---------------------------------------------------------------------------

const ARROW_UP_BASE: ShapePath = [
  [0, 0.65],
  [-0.28, 0.2],
  [-0.12, 0.2],
  [-0.12, -0.5],
  [0.12, -0.5],
  [0.12, 0.2],
  [0.28, 0.2],
];

function arrowUp(): ShapePath {
  return ARROW_UP_BASE;
}

function arrowLeft(): ShapePath {
  return rotatePoints(ARROW_UP_BASE, Math.PI / 2);
}

function arrowRight(): ShapePath {
  return rotatePoints(ARROW_UP_BASE, -Math.PI / 2);
}

function arrowUpLeft(): ShapePath {
  return [
    [0.1, -0.45],
    [0.1, 0.2],
    [0.25, 0.2],
    [0, 0.6],
    [-0.25, 0.2],
    [-0.1, 0.2],
    [-0.1, 0.13],
    [-0.25, 0.2],
    [-0.55, 0.05],
    [-0.25, -0.1],
    [-0.1, -0.03],
    [-0.1, -0.45],
  ];
}

function arrowUpRight(): ShapePath {
  return [
    [-0.1, -0.45],
    [-0.1, 0.2],
    [-0.25, 0.2],
    [0, 0.6],
    [0.25, 0.2],
    [0.1, 0.2],
    [0.1, 0.13],
    [0.25, 0.2],
    [0.55, 0.05],
    [0.25, -0.1],
    [0.1, -0.03],
    [0.1, -0.45],
  ];
}

function arrowDiagonalLeft(): ShapePath {
  return rotatePoints(ARROW_UP_BASE, Math.PI / 4);
}

function arrowDiagonalRight(): ShapePath {
  return rotatePoints(ARROW_UP_BASE, -Math.PI / 4);
}

function arrowTurnLeft(): ShapePath {
  // Approximated polyline from the quadratic curves in the THREE.Shape version.
  return [
    [-0.55, 0.15],
    [-0.25, 0.4],
    [-0.25, 0.23],
    [-0.05, 0.23],
    [0.1, 0.15],
    [0.1, -0.5],
    [-0.1, -0.5],
    [-0.1, -0.1],
    [-0.1, 0.07],
    [-0.25, 0.07],
    [-0.25, -0.1],
  ];
}

function arrowTurnRight(): ShapePath {
  // Mirror of turn-left
  return [
    [0.55, 0.15],
    [0.25, 0.4],
    [0.25, 0.23],
    [0.05, 0.23],
    [-0.1, 0.15],
    [-0.1, -0.5],
    [0.1, -0.5],
    [0.1, -0.1],
    [0.1, 0.07],
    [0.25, 0.07],
    [0.25, -0.1],
  ];
}

function arrowUturn(): ShapePath {
  // Approximated polyline from quadratic curves
  return [
    [-0.35, -0.1],
    [-0.1, 0.15],
    [-0.1, 0.0],
    [-0.05, 0.35],
    [0.15, 0.4],
    [0.35, 0.3],
    [0.35, -0.5],
    [0.15, -0.5],
    [0.15, 0.1],
    [0.15, 0.25],
    [0.0, 0.25],
    [-0.1, 0.2],
    [-0.1, -0.25],
  ];
}

function arrowComplex(): ShapePath {
  return [
    [0, 0.5],
    [-0.15, 0.2],
    [-0.06, 0.2],
    [-0.06, 0.0],
    [-0.35, -0.35],
    [-0.2, -0.35],
    [0, -0.1],
    [0.2, -0.35],
    [0.35, -0.35],
    [0.06, 0.0],
    [0.06, 0.2],
    [0.15, 0.2],
  ];
}

// ---------------------------------------------------------------------------
// Pedestrian silhouettes
// ---------------------------------------------------------------------------

function pedestrianStop(): ShapePath {
  return [
    [-0.12, 0.22],
    [-0.12, 0.15],
    [-0.38, -0.04],
    [-0.34, -0.10],
    [-0.12, 0.06],
    [-0.10, -0.08],
    [-0.16, -0.55],
    [-0.09, -0.55],
    [0, -0.18],
    [0.09, -0.55],
    [0.16, -0.55],
    [0.10, -0.08],
    [0.12, 0.06],
    [0.34, -0.10],
    [0.38, -0.04],
    [0.12, 0.15],
    [0.12, 0.22],
  ];
}

function pedestrianGo(): ShapePath {
  return [
    [-0.06, 0.22],
    [-0.10, 0.15],
    [-0.40, -0.06],
    [-0.36, -0.12],
    [-0.10, 0.06],
    [-0.08, -0.08],
    [-0.25, -0.55],
    [-0.18, -0.55],
    [-0.02, -0.18],
    [0.12, -0.55],
    [0.19, -0.55],
    [0.08, -0.08],
    [0.10, 0.06],
    [0.36, -0.12],
    [0.40, -0.06],
    [0.10, 0.15],
    [0.06, 0.22],
  ];
}

// ---------------------------------------------------------------------------
// Shape path cache + lookup
// ---------------------------------------------------------------------------

const SHAPE_CREATORS: Partial<Record<BulbFaceShape, () => ShapePath>> = {
  'arrow-up': arrowUp,
  'arrow-left': arrowLeft,
  'arrow-right': arrowRight,
  'arrow-up-left': arrowUpLeft,
  'arrow-up-right': arrowUpRight,
  'arrow-diagonal-left': arrowDiagonalLeft,
  'arrow-diagonal-right': arrowDiagonalRight,
  'arrow-turn-left': arrowTurnLeft,
  'arrow-turn-right': arrowTurnRight,
  'arrow-uturn': arrowUturn,
  'arrow-complex': arrowComplex,
  'pedestrian-stop': pedestrianStop,
  'pedestrian-go': pedestrianGo,
};

const SHAPE_CACHE = new Map<BulbFaceShape, ShapePath>();

/**
 * Get the 2D point-array path for a given BulbFaceShape.
 * Returns null for 'circle' (rendered as an arc, no polygon path needed).
 */
export function getShapePath(faceShape: BulbFaceShape): ShapePath | null {
  if (faceShape === 'circle') return null;

  let path = SHAPE_CACHE.get(faceShape);
  if (!path) {
    const creator = SHAPE_CREATORS[faceShape];
    if (!creator) return null;
    path = creator();
    SHAPE_CACHE.set(faceShape, path);
  }
  return path;
}

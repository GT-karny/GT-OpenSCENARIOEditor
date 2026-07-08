/**
 * Descriptor-based Canvas2D renderer for traffic signal icons.
 *
 * Thin wrapper over the existing engine rendering helpers (signal-head-renderer.ts,
 * signal-render-constants.ts, signal-shape-paths.ts).  Adds quadratic-curve ShapeCmd
 * support for turn/u-turn arrows that the 3D path approximations do not cover, and
 * inlines getBulbMode so the module has zero dependency on @osce/3d-viewer.
 *
 * Primary consumer: apps/web signal-icon-renderer.ts (re-exports this module).
 * Used by: intersection-timeline SignalIcon2D.tsx.
 */

import type { BulbColor, BulbFaceShape, SignalDescriptor } from './signal-preset-types.js';
import { BULB_COLORS, HOUSING_COLOR, OFF_BULB_COLORS } from './signal-render-constants.js';
import {
  computeBulbOffsets,
  drawPathOnCanvas,
  hexToRgba,
  roundRect,
} from './signal-head-renderer.js';
import { getShapePath } from './signal-shape-paths.js';

// ---------------------------------------------------------------------------
// Bulb state parsing (inlined to avoid @osce/3d-viewer dependency)
// ---------------------------------------------------------------------------

/** Bulb activation mode — subset of esmini LampMode used in editor UI. */
export type BulbMode = 'on' | 'off' | 'flashing';

const VALID_MODES = new Set<string>(['on', 'off', 'flashing']);

/**
 * Get the mode of a specific bulb from a state string.
 *
 * For positional format ("on;off;flashing"), returns the token at the given index.
 * For color name format ("red"), returns 'on' if matching bulb color, else 'off'.
 */
export function getBulbMode(stateStr: string, index: number, bulbColor: BulbColor): BulbMode {
  const lower = stateStr.toLowerCase().trim();

  if (lower.includes(';')) {
    const parts = lower.split(';').map((s) => s.trim());
    if (index < parts.length) {
      const token = parts[index];
      if (VALID_MODES.has(token)) return token as BulbMode;
      if (token === bulbColor) return 'on';
    }
    return 'off';
  }

  if (VALID_MODES.has(lower)) {
    return index === 0 ? (lower as BulbMode) : 'off';
  }

  if (lower.includes(bulbColor)) return 'on';
  return 'off';
}

// ---------------------------------------------------------------------------
// Quadratic-curve shape commands (turn / u-turn arrows)
//
// signal-shape-paths.ts provides polyline approximations for 3D texture use.
// This module carries the exact quadratic-curve encodings needed for 2D Canvas
// rendering so the icons match the original web implementation precisely.
// ---------------------------------------------------------------------------

type ShapeCmd =
  | { type: 'M'; x: number; y: number }
  | { type: 'L'; x: number; y: number }
  | { type: 'Q'; cx: number; cy: number; x: number; y: number }
  | { type: 'Z' };

const ARROW_TURN_LEFT: ShapeCmd[] = [
  { type: 'M', x: -0.55, y: 0.15 },
  { type: 'L', x: -0.25, y: 0.4 },
  { type: 'L', x: -0.25, y: 0.23 },
  { type: 'Q', cx: 0.1, cy: 0.23, x: 0.1, y: -0.1 },
  { type: 'L', x: 0.1, y: -0.5 },
  { type: 'L', x: -0.1, y: -0.5 },
  { type: 'L', x: -0.1, y: -0.1 },
  { type: 'Q', cx: -0.1, cy: 0.07, x: -0.25, y: 0.07 },
  { type: 'L', x: -0.25, y: -0.1 },
  { type: 'Z' },
];

const ARROW_TURN_RIGHT: ShapeCmd[] = [
  { type: 'M', x: 0.55, y: 0.15 },
  { type: 'L', x: 0.25, y: 0.4 },
  { type: 'L', x: 0.25, y: 0.23 },
  { type: 'Q', cx: -0.1, cy: 0.23, x: -0.1, y: -0.1 },
  { type: 'L', x: -0.1, y: -0.5 },
  { type: 'L', x: 0.1, y: -0.5 },
  { type: 'L', x: 0.1, y: -0.1 },
  { type: 'Q', cx: 0.1, cy: 0.07, x: 0.25, y: 0.07 },
  { type: 'L', x: 0.25, y: -0.1 },
  { type: 'Z' },
];

const ARROW_UTURN: ShapeCmd[] = [
  { type: 'M', x: -0.35, y: -0.1 },
  { type: 'L', x: -0.1, y: 0.15 },
  { type: 'L', x: -0.1, y: 0.0 },
  { type: 'Q', cx: -0.1, cy: 0.4, x: 0.15, y: 0.4 },
  { type: 'Q', cx: 0.35, cy: 0.4, x: 0.35, y: 0.1 },
  { type: 'L', x: 0.35, y: -0.5 },
  { type: 'L', x: 0.15, y: -0.5 },
  { type: 'L', x: 0.15, y: 0.1 },
  { type: 'Q', cx: 0.15, cy: 0.25, x: 0.0, y: 0.25 },
  { type: 'Q', cx: -0.1, cy: 0.25, x: -0.1, y: 0.15 },
  { type: 'L', x: -0.1, y: -0.25 },
  { type: 'Z' },
];

/** Shapes that require quadratic curves — cannot be represented as polylines. */
const CMD_SHAPES: Partial<Record<BulbFaceShape, ShapeCmd[]>> = {
  'arrow-turn-left': ARROW_TURN_LEFT,
  'arrow-turn-right': ARROW_TURN_RIGHT,
  'arrow-uturn': ARROW_UTURN,
};

// ---------------------------------------------------------------------------
// Internal drawing helpers
// ---------------------------------------------------------------------------

function drawCmdShape(
  ctx: CanvasRenderingContext2D,
  cmds: ShapeCmd[],
  cx: number,
  cy: number,
  scale: number,
): void {
  ctx.beginPath();
  for (const cmd of cmds) {
    switch (cmd.type) {
      case 'M':
        ctx.moveTo(cx + cmd.x * scale, cy - cmd.y * scale);
        break;
      case 'L':
        ctx.lineTo(cx + cmd.x * scale, cy - cmd.y * scale);
        break;
      case 'Q':
        ctx.quadraticCurveTo(
          cx + cmd.cx * scale,
          cy - cmd.cy * scale,
          cx + cmd.x * scale,
          cy - cmd.y * scale,
        );
        break;
      case 'Z':
        ctx.closePath();
        break;
    }
  }
  ctx.fill();
}

/**
 * Draw the icon overlay (arrow / pedestrian silhouette) on a bulb.
 * Dispatches to quadratic-curve cmd shapes for turn/u-turn arrows,
 * and to polyline paths (via getShapePath) for all other shapes.
 */
function drawDescriptorBulbOverlay(
  ctx: CanvasRenderingContext2D,
  faceShape: BulbFaceShape,
  isActive: boolean,
  cx: number,
  cy: number,
  bulbRadiusPx: number,
): void {
  if (faceShape === 'circle') return;

  const overlayScale = bulbRadiusPx * 1.2;
  ctx.fillStyle = isActive ? 'rgba(17,17,17,0.85)' : 'rgba(17,17,17,0.3)';

  const cmdShape = CMD_SHAPES[faceShape];
  if (cmdShape) {
    drawCmdShape(ctx, cmdShape, cx, cy, overlayScale);
  } else {
    const polyline = getShapePath(faceShape);
    if (polyline) drawPathOnCanvas(ctx, polyline, cx, cy, overlayScale);
  }

  // Pedestrian head circle (sits above the body silhouette)
  if (faceShape === 'pedestrian-stop' || faceShape === 'pedestrian-go') {
    ctx.beginPath();
    ctx.arc(cx, cy - 0.45 * overlayScale, 0.12 * overlayScale, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render a traffic signal icon onto a Canvas2D context.
 *
 * The caller is responsible for sizing the canvas (including DPR scaling).
 * This function fills the entire canvas area with the signal housing and bulbs.
 *
 * BULB_SPACING is sourced from signal-render-constants (0.38), unified with the
 * engine value.  Icons will appear slightly more spread than the previous web-only
 * renderer (which used 0.33).
 *
 * @param ctx        Canvas 2D context to draw into
 * @param descriptor SignalDescriptor from the signal catalog
 * @param activeState State string, e.g. "on;off;off" or "red" or "flashing;off;off"
 * @param width      Logical width of the canvas (pre-DPR)
 * @param height     Logical height of the canvas (pre-DPR)
 */
export function renderSignalToCanvas(
  ctx: CanvasRenderingContext2D,
  descriptor: SignalDescriptor,
  activeState: string,
  width: number,
  height: number,
): void {
  const { bulbs, bulbRadius, housing } = descriptor;
  const isHorizontal = descriptor.orientation === 'horizontal';

  ctx.clearRect(0, 0, width, height);

  // Scale factor: map housing world-units to pixel dimensions
  const scaleX = width / housing.width;
  const scaleY = height / housing.height;
  const scale = Math.min(scaleX, scaleY);

  // Housing background
  ctx.fillStyle = HOUSING_COLOR;
  roundRect(ctx, 0, 0, width, height, 4);
  ctx.fill();

  const offsets = computeBulbOffsets(bulbs.length);

  for (let i = 0; i < bulbs.length; i++) {
    const bulb = bulbs[i];
    const mode = getBulbMode(activeState, i, bulb.color);
    const isActive = mode === 'on' || mode === 'flashing';
    const color = isActive ? BULB_COLORS[bulb.color] : OFF_BULB_COLORS[bulb.color];

    let cx: number;
    let cy: number;
    if (isHorizontal) {
      cx = width / 2 - offsets[i] * scale;
      cy = height / 2;
    } else {
      cx = width / 2;
      cy = height / 2 - offsets[i] * scale;
    }
    const r = bulbRadius * scale;

    // Glow halo (active bulbs only)
    if (isActive) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.4);
      grad.addColorStop(0, hexToRgba(color, 0.4));
      grad.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Bulb circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Flashing: hatching overlay to signal intermittent state
    if (mode === 'flashing') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      for (let offset = -r * 2; offset < r * 2; offset += 4) {
        ctx.beginPath();
        ctx.moveTo(cx + offset, cy - r);
        ctx.lineTo(cx + offset + r, cy + r);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Shape overlay (arrow / pedestrian silhouette)
    drawDescriptorBulbOverlay(ctx, bulb.shape, isActive, cx, cy, r);
  }
}


/**
 * Pure Canvas2D renderer for traffic signal icons.
 *
 * Ported from @osce/3d-viewer signal-texture.ts but with zero THREE.js dependency.
 * Used by the Intersection Timeline panel for 2D signal state visualization.
 */

import type { SignalDescriptor, BulbColor, BulbFaceShape } from '@osce/3d-viewer';
import { getBulbMode } from '@osce/3d-viewer';

// ---------------------------------------------------------------------------
// Color constants (copied from signal-geometry.ts TRAFFIC_LIGHT)
// ---------------------------------------------------------------------------

const BULB_COLORS: Record<BulbColor, string> = {
  red: '#FF0000',
  yellow: '#FFAA00',
  green: '#00CC44',
};

const OFF_BULB_COLORS: Record<BulbColor, string> = {
  red: '#4A1010',
  yellow: '#3A2808',
  green: '#0A3A0A',
};

const HOUSING_COLOR = '#222222';

// ---------------------------------------------------------------------------
// Shape point arrays (extracted from signal-shapes.ts, no THREE dependency)
// ---------------------------------------------------------------------------

type PointArray = [number, number][];

function rotatePoints(points: PointArray, angleRad: number): PointArray {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return points.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos]);
}

const ARROW_UP: PointArray = [
  [0, 0.65], [-0.28, 0.2], [-0.12, 0.2], [-0.12, -0.5],
  [0.12, -0.5], [0.12, 0.2], [0.28, 0.2],
];

const ARROW_UP_LEFT: PointArray = [
  [0.1, -0.45], [0.1, 0.2], [0.25, 0.2], [0, 0.6], [-0.25, 0.2], [-0.1, 0.2],
  [-0.1, 0.13], [-0.25, 0.2], [-0.55, 0.05], [-0.25, -0.1], [-0.1, -0.03],
  [-0.1, -0.45],
];

const ARROW_UP_RIGHT: PointArray = [
  [-0.1, -0.45], [-0.1, 0.2], [-0.25, 0.2], [0, 0.6], [0.25, 0.2], [0.1, 0.2],
  [0.1, 0.13], [0.25, 0.2], [0.55, 0.05], [0.25, -0.1], [0.1, -0.03],
  [0.1, -0.45],
];

const ARROW_COMPLEX: PointArray = [
  [0, 0.5], [-0.15, 0.2], [-0.06, 0.2], [-0.06, 0.0], [-0.35, -0.35],
  [-0.2, -0.35], [0, -0.1], [0.2, -0.35], [0.35, -0.35], [0.06, 0.0],
  [0.06, 0.2], [0.15, 0.2],
];

const PEDESTRIAN_STOP: PointArray = [
  [-0.12, 0.22], [-0.12, 0.15], [-0.38, -0.04], [-0.34, -0.10], [-0.12, 0.06],
  [-0.10, -0.08], [-0.16, -0.55], [-0.09, -0.55], [0, -0.18], [0.09, -0.55],
  [0.16, -0.55], [0.10, -0.08], [0.12, 0.06], [0.34, -0.10], [0.38, -0.04],
  [0.12, 0.15], [0.12, 0.22],
];

const PEDESTRIAN_GO: PointArray = [
  [-0.06, 0.22], [-0.10, 0.15], [-0.40, -0.06], [-0.36, -0.12], [-0.10, 0.06],
  [-0.08, -0.08], [-0.25, -0.55], [-0.18, -0.55], [-0.02, -0.18], [0.12, -0.55],
  [0.19, -0.55], [0.08, -0.08], [0.10, 0.06], [0.36, -0.12], [0.40, -0.06],
  [0.10, 0.15], [0.06, 0.22],
];

// Curved shapes require quadraticCurveTo — encoded as command lists
type ShapeCmd = { type: 'M'; x: number; y: number }
  | { type: 'L'; x: number; y: number }
  | { type: 'Q'; cx: number; cy: number; x: number; y: number }
  | { type: 'Z' };

const ARROW_TURN_LEFT: ShapeCmd[] = [
  { type: 'M', x: -0.55, y: 0.15 }, { type: 'L', x: -0.25, y: 0.4 },
  { type: 'L', x: -0.25, y: 0.23 }, { type: 'Q', cx: 0.1, cy: 0.23, x: 0.1, y: -0.1 },
  { type: 'L', x: 0.1, y: -0.5 }, { type: 'L', x: -0.1, y: -0.5 },
  { type: 'L', x: -0.1, y: -0.1 }, { type: 'Q', cx: -0.1, cy: 0.07, x: -0.25, y: 0.07 },
  { type: 'L', x: -0.25, y: -0.1 }, { type: 'Z' },
];

const ARROW_TURN_RIGHT: ShapeCmd[] = [
  { type: 'M', x: 0.55, y: 0.15 }, { type: 'L', x: 0.25, y: 0.4 },
  { type: 'L', x: 0.25, y: 0.23 }, { type: 'Q', cx: -0.1, cy: 0.23, x: -0.1, y: -0.1 },
  { type: 'L', x: -0.1, y: -0.5 }, { type: 'L', x: 0.1, y: -0.5 },
  { type: 'L', x: 0.1, y: -0.1 }, { type: 'Q', cx: 0.1, cy: 0.07, x: 0.25, y: 0.07 },
  { type: 'L', x: 0.25, y: -0.1 }, { type: 'Z' },
];

const ARROW_UTURN: ShapeCmd[] = [
  { type: 'M', x: -0.35, y: -0.1 }, { type: 'L', x: -0.1, y: 0.15 },
  { type: 'L', x: -0.1, y: 0.0 },
  { type: 'Q', cx: -0.1, cy: 0.4, x: 0.15, y: 0.4 },
  { type: 'Q', cx: 0.35, cy: 0.4, x: 0.35, y: 0.1 },
  { type: 'L', x: 0.35, y: -0.5 }, { type: 'L', x: 0.15, y: -0.5 },
  { type: 'L', x: 0.15, y: 0.1 },
  { type: 'Q', cx: 0.15, cy: 0.25, x: 0.0, y: 0.25 },
  { type: 'Q', cx: -0.1, cy: 0.25, x: -0.1, y: 0.15 },
  { type: 'L', x: -0.1, y: -0.25 }, { type: 'Z' },
];

// Lookup map for point-array shapes
const POINT_SHAPES: Partial<Record<BulbFaceShape, PointArray>> = {
  'arrow-up': ARROW_UP,
  'arrow-left': rotatePoints(ARROW_UP, Math.PI / 2),
  'arrow-right': rotatePoints(ARROW_UP, -Math.PI / 2),
  'arrow-up-left': ARROW_UP_LEFT,
  'arrow-up-right': ARROW_UP_RIGHT,
  'arrow-diagonal-left': rotatePoints(ARROW_UP, Math.PI / 4),
  'arrow-diagonal-right': rotatePoints(ARROW_UP, -Math.PI / 4),
  'arrow-complex': ARROW_COMPLEX,
  'pedestrian-stop': PEDESTRIAN_STOP,
  'pedestrian-go': PEDESTRIAN_GO,
};

// Lookup map for curved shapes
const CMD_SHAPES: Partial<Record<BulbFaceShape, ShapeCmd[]>> = {
  'arrow-turn-left': ARROW_TURN_LEFT,
  'arrow-turn-right': ARROW_TURN_RIGHT,
  'arrow-uturn': ARROW_UTURN,
};

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPointsShape(
  ctx: CanvasRenderingContext2D,
  points: PointArray,
  cx: number, cy: number, scale: number,
): void {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(cx + points[0][0] * scale, cy - points[0][1] * scale);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(cx + points[i][0] * scale, cy - points[i][1] * scale);
  }
  ctx.closePath();
  ctx.fill();
}

function drawCmdShape(
  ctx: CanvasRenderingContext2D,
  cmds: ShapeCmd[],
  cx: number, cy: number, scale: number,
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
          cx + cmd.cx * scale, cy - cmd.cy * scale,
          cx + cmd.x * scale, cy - cmd.y * scale,
        );
        break;
      case 'Z':
        ctx.closePath();
        break;
    }
  }
  ctx.fill();
}

function drawBulbOverlay(
  ctx: CanvasRenderingContext2D,
  faceShape: BulbFaceShape,
  isActive: boolean,
  cx: number, cy: number, bulbRadiusPx: number,
): void {
  if (faceShape === 'circle') return;

  const overlayScale = bulbRadiusPx * 1.2;
  ctx.fillStyle = isActive ? 'rgba(17,17,17,0.85)' : 'rgba(17,17,17,0.3)';

  const points = POINT_SHAPES[faceShape];
  if (points) {
    drawPointsShape(ctx, points, cx, cy, overlayScale);
  } else {
    const cmds = CMD_SHAPES[faceShape];
    if (cmds) drawCmdShape(ctx, cmds, cx, cy, overlayScale);
  }

  // Pedestrian head circle
  if (faceShape === 'pedestrian-stop' || faceShape === 'pedestrian-go') {
    ctx.beginPath();
    ctx.arc(cx, cy - 0.45 * overlayScale, 0.12 * overlayScale, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Bulb offset computation
// ---------------------------------------------------------------------------

const BULB_SPACING = 0.33;

function computeBulbOffsets(count: number): number[] {
  const offsets: number[] = [];
  for (let i = 0; i < count; i++) {
    offsets.push(((count - 1) / 2 - i) * BULB_SPACING);
  }
  return offsets;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render a traffic signal icon onto a Canvas2D context.
 *
 * The canvas should be sized by the caller. This function fills the entire
 * canvas area with the signal housing and bulbs.
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

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Scale factor: map housing world-units to pixel dimensions
  const scaleX = width / housing.width;
  const scaleY = height / housing.height;
  const scale = Math.min(scaleX, scaleY);

  // Housing background
  ctx.fillStyle = HOUSING_COLOR;
  roundRect(ctx, 0, 0, width, height, 4);
  ctx.fill();

  // Bulbs
  const offsets = computeBulbOffsets(bulbs.length);

  for (let i = 0; i < bulbs.length; i++) {
    const bulb = bulbs[i];
    const mode = getBulbMode(activeState, i, bulb.color);
    const isActive = mode === 'on' || mode === 'flashing';
    const color = isActive ? BULB_COLORS[bulb.color] : OFF_BULB_COLORS[bulb.color];

    let cx: number, cy: number;
    if (isHorizontal) {
      cx = width / 2 - offsets[i] * scale;
      cy = height / 2;
    } else {
      cx = width / 2;
      cy = height / 2 - offsets[i] * scale;
    }
    const r = bulbRadius * scale;

    // Glow halo
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

    // Flashing hatching overlay
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
    drawBulbOverlay(ctx, bulb.shape, isActive, cx, cy, r);
  }
}

// ---------------------------------------------------------------------------
// Cache for ImageBitmap (optional optimization for timeline playback)
// ---------------------------------------------------------------------------

const bitmapCache = new Map<string, HTMLCanvasElement>();

export function buildIconCacheKey(descriptor: SignalDescriptor, activeState: string): string {
  const bulbKey = descriptor.bulbs.map((b) => `${b.color}:${b.shape}`).join(',');
  return `${descriptor.bulbs.length}|${bulbKey}|${descriptor.orientation ?? 'vertical'}|${activeState}`;
}

/**
 * Get a cached canvas with the signal rendered. Avoids re-drawing when the
 * same descriptor+state combination is requested multiple times (e.g., during
 * playback when multiple signals share the same state).
 */
export function getCachedSignalCanvas(
  descriptor: SignalDescriptor,
  activeState: string,
  width: number,
  height: number,
): HTMLCanvasElement {
  const key = `${buildIconCacheKey(descriptor, activeState)}|${width}x${height}`;
  const cached = bitmapCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  renderSignalToCanvas(ctx, descriptor, activeState, width, height);

  bitmapCache.set(key, canvas);
  return canvas;
}

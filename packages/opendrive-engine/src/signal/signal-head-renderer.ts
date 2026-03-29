/**
 * Pure Canvas2D renderer for traffic signal heads.
 *
 * No THREE.js dependency — renders a signal head preset onto an HTMLCanvasElement.
 * Used for:
 * - Visual configurator head previews (SVG <image>)
 * - Assembly thumbnails
 * - Palette icons
 */

import type { BulbFaceShape } from './signal-preset-types.js';
import type { SignalHeadPreset } from './signal-presets.js';
import { getPresetById } from './signal-presets.js';
import { getShapePath } from './signal-shape-paths.js';
import {
  PX_PER_UNIT,
  BULB_SPACING,
  HOUSING_PADDING,
  HOUSING_WIDTH,
  BULB_COLORS,
  OFF_BULB_COLORS,
  HOUSING_COLOR,
  BULB_RADIUS,
} from './signal-render-constants.js';

// ---------------------------------------------------------------------------
// Housing geometry (mirrors signal-catalog.ts logic)
// ---------------------------------------------------------------------------

function computeHousingDimensions(
  bulbCount: number,
  orientation: 'vertical' | 'horizontal',
): { width: number; height: number } {
  const span = (bulbCount - 1) * BULB_SPACING + 2 * (BULB_RADIUS + HOUSING_PADDING);
  if (orientation === 'horizontal') {
    return { width: span, height: HOUSING_WIDTH };
  }
  return { width: HOUSING_WIDTH, height: span };
}

// ---------------------------------------------------------------------------
// Canvas helpers
// ---------------------------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function computeBulbOffsets(count: number): number[] {
  const offsets: number[] = [];
  for (let i = 0; i < count; i++) {
    offsets.push(((count - 1) / 2 - i) * BULB_SPACING);
  }
  return offsets;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
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

function drawPathOnCanvas(
  ctx: CanvasRenderingContext2D,
  path: [number, number][],
  cx: number,
  cy: number,
  scale: number,
): void {
  if (path.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(cx + path[0][0] * scale, cy - path[0][1] * scale);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(cx + path[i][0] * scale, cy - path[i][1] * scale);
  }
  ctx.closePath();
  ctx.fill();
}

function drawBulbOverlay(
  ctx: CanvasRenderingContext2D,
  faceShape: BulbFaceShape,
  isActive: boolean,
  cx: number,
  cy: number,
  bulbRadiusPx: number,
): void {
  if (faceShape === 'circle') return;

  const path = getShapePath(faceShape);
  if (!path) return;

  const overlayScale = bulbRadiusPx * 1.2;
  ctx.fillStyle = isActive ? 'rgba(17,17,17,0.85)' : 'rgba(17,17,17,0.3)';
  drawPathOnCanvas(ctx, path, cx, cy, overlayScale);

  // Pedestrian head circle
  if (faceShape === 'pedestrian-stop' || faceShape === 'pedestrian-go') {
    ctx.beginPath();
    ctx.arc(cx, cy - 0.45 * overlayScale, 0.12 * overlayScale, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Rendering cache
// ---------------------------------------------------------------------------

const canvasCache = new Map<string, HTMLCanvasElement>();

function buildCacheKey(preset: SignalHeadPreset, active: boolean): string {
  return `${preset.id}|${active ? '1' : '0'}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render a signal head preset onto a Canvas2D element.
 *
 * @param presetId  ID of the built-in head preset (e.g., '3-light-vertical')
 * @param options   active: show lit state (default false = off/preview mode)
 * @returns The rendered HTMLCanvasElement, or null if the preset ID is unknown
 */
export function renderSignalHeadToCanvas(
  presetId: string,
  options?: { active?: boolean },
): HTMLCanvasElement | null {
  const preset = getPresetById(presetId);
  if (!preset) return null;

  const active = options?.active ?? false;
  const key = buildCacheKey(preset, active);
  const cached = canvasCache.get(key);
  if (cached) return cached;

  const { bulbs, orientation } = preset;
  const { width: hW, height: hH } = computeHousingDimensions(bulbs.length, orientation);
  const isHorizontal = orientation === 'horizontal';

  const w = Math.max(32, Math.ceil(hW * PX_PER_UNIT));
  const h = Math.max(32, Math.ceil(hH * PX_PER_UNIT));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Housing background
  ctx.fillStyle = HOUSING_COLOR;
  roundRect(ctx, 0, 0, w, h, 6);
  ctx.fill();

  // Bulbs
  const offsets = computeBulbOffsets(bulbs.length);
  const bulbR = BULB_RADIUS * PX_PER_UNIT;

  for (let i = 0; i < bulbs.length; i++) {
    const bulb = bulbs[i];
    const color = active ? BULB_COLORS[bulb.color] : OFF_BULB_COLORS[bulb.color];

    let cx: number, cy: number;
    if (isHorizontal) {
      cx = w / 2 - offsets[i] * PX_PER_UNIT;
      cy = h / 2;
    } else {
      cx = w / 2;
      cy = h / 2 - offsets[i] * PX_PER_UNIT;
    }

    // Glow (active only)
    if (active) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createRadialGradient(cx, cy, bulbR * 0.3, cx, cy, bulbR * 1.4);
      grad.addColorStop(0, hexToRgba(color, 0.4));
      grad.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, bulbR * 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Bulb circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, bulbR, 0, Math.PI * 2);
    ctx.fill();

    // Shape overlay
    drawBulbOverlay(ctx, bulb.shape, active, cx, cy, bulbR);
  }

  canvasCache.set(key, canvas);
  return canvas;
}

/**
 * Render a complete assembly preview onto a single canvas.
 * Each head is drawn at its (x, y) position in metres.
 *
 * @param heads Array of { presetId, x, y } placements
 * @param scale Pixels per metre for the output canvas (default 128)
 * @returns The rendered HTMLCanvasElement
 */
export function renderAssemblyThumbnail(
  heads: { presetId: string; x: number; y: number }[],
  scale = 128,
): HTMLCanvasElement {
  if (heads.length === 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    return canvas;
  }

  // Compute bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const headInfos = heads.map((h) => {
    const preset = getPresetById(h.presetId);
    const { width: hw, height: hh } = preset
      ? computeHousingDimensions(preset.bulbs.length, preset.orientation)
      : { width: 0.4, height: 0.7 };
    const x0 = h.x - hw / 2;
    const x1 = h.x + hw / 2;
    const y0 = h.y - hh / 2;
    const y1 = h.y + hh / 2;
    minX = Math.min(minX, x0);
    maxX = Math.max(maxX, x1);
    minY = Math.min(minY, y0);
    maxY = Math.max(maxY, y1);
    return { ...h, hw, hh };
  });

  const padding = 0.05; // metres
  const totalW = maxX - minX + 2 * padding;
  const totalH = maxY - minY + 2 * padding;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(16, Math.ceil(totalW * scale));
  canvas.height = Math.max(16, Math.ceil(totalH * scale));
  const ctx = canvas.getContext('2d')!;

  // Draw each head
  for (const head of headInfos) {
    const headCanvas = renderSignalHeadToCanvas(head.presetId);
    if (!headCanvas) continue;

    const dx = (head.x - head.hw / 2 - minX + padding) * scale;
    const dy = (head.y - head.hh / 2 - minY + padding) * scale;
    const dw = head.hw * scale;
    const dh = head.hh * scale;
    ctx.drawImage(headCanvas, dx, dy, dw, dh);
  }

  return canvas;
}

/** Clear the rendering cache (for testing). */
export function clearRenderCache(): void {
  canvasCache.clear();
}

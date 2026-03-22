/**
 * Canvas-based texture renderer for traffic signal heads.
 *
 * Renders housing, bulbs, overlays (arrows / pedestrian silhouettes), and glow
 * effects onto a single 2D canvas, then wraps it as a CanvasTexture.
 * Textures are keyed by descriptor shape + active state and cached indefinitely.
 *
 * This replaces the multi-mesh approach (housing box + sphere per bulb +
 * ShapeGeometry overlay per bulb) with a single textured PlaneGeometry,
 * cutting draw calls from ~10 per signal to 1.
 */

import * as THREE from 'three';
import type { SignalDescriptor, BulbColor, BulbFaceShape } from './signal-catalog.js';
import { TRAFFIC_LIGHT } from './signal-geometry.js';
import { isBulbActiveByIndex } from './parse-traffic-light-state.js';
import { getShape } from './signal-shapes.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Pixels per metre – controls texture sharpness vs VRAM usage. */
const PX_PER_UNIT = 256;

const BULB_SPACING = 0.33;

const BULB_COLORS: Record<BulbColor, string> = {
  red: TRAFFIC_LIGHT.bulbColors.red,
  yellow: TRAFFIC_LIGHT.bulbColors.yellow,
  green: TRAFFIC_LIGHT.bulbColors.green,
};

const OFF_BULB_COLORS: Record<BulbColor, string> = {
  red: TRAFFIC_LIGHT.offBulbColors.red,
  yellow: TRAFFIC_LIGHT.offBulbColors.yellow,
  green: TRAFFIC_LIGHT.offBulbColors.green,
};

const HOUSING_COLOR = TRAFFIC_LIGHT.housingColor;

// ---------------------------------------------------------------------------
// Helpers
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

/** Draw a rounded rectangle path (does NOT fill/stroke). */
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

/** Rasterise a cached THREE.Shape onto a Canvas2D context. */
function drawShapeOnCanvas(
  ctx: CanvasRenderingContext2D,
  shape: THREE.Shape,
  cx: number,
  cy: number,
  scale: number,
): void {
  const points = shape.getPoints(24);
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(cx + points[0].x * scale, cy - points[0].y * scale);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(cx + points[i].x * scale, cy - points[i].y * scale);
  }
  ctx.closePath();
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const textureCache = new Map<string, THREE.CanvasTexture>();

export function buildCacheKey(desc: SignalDescriptor, activeState?: string): string {
  const bulbKey = desc.bulbs.map((b) => `${b.color}:${b.shape}`).join(',');
  return `${desc.bulbs.length}|${bulbKey}|${desc.bulbRadius}|${desc.housing.width}:${desc.housing.height}|${desc.orientation ?? 'vertical'}|${activeState ?? ''}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Obtain a CanvasTexture for the given signal descriptor + active state.
 * Textures are cached so repeated calls with the same arguments return the same object.
 */
export function getSignalTexture(
  descriptor: SignalDescriptor,
  activeState?: string,
): THREE.CanvasTexture {
  const key = buildCacheKey(descriptor, activeState);
  const cached = textureCache.get(key);
  if (cached) return cached;

  const { bulbs, housing, bulbRadius } = descriptor;
  const isHorizontal = descriptor.orientation === 'horizontal';

  // Canvas dimensions
  const w = Math.max(32, Math.ceil(housing.width * PX_PER_UNIT));
  const h = Math.max(32, Math.ceil(housing.height * PX_PER_UNIT));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // -- Housing background (rounded rectangle) --
  ctx.fillStyle = HOUSING_COLOR;
  roundRect(ctx, 0, 0, w, h, 6);
  ctx.fill();

  // -- Bulbs --
  const offsets = computeBulbOffsets(bulbs.length);

  for (let i = 0; i < bulbs.length; i++) {
    const bulb = bulbs[i];
    const isActive = activeState ? isBulbActiveByIndex(activeState, i, bulb.color) : false;
    const color = isActive ? BULB_COLORS[bulb.color] : OFF_BULB_COLORS[bulb.color];

    let cx: number, cy: number;
    if (isHorizontal) {
      cx = w / 2 - offsets[i] * PX_PER_UNIT;
      cy = h / 2;
    } else {
      cx = w / 2;
      cy = h / 2 - offsets[i] * PX_PER_UNIT;
    }
    const r = bulbRadius * PX_PER_UNIT;

    // Glow halo behind the bulb (additive blending)
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

    // Shape overlay (arrow / pedestrian silhouette)
    drawBulbOverlay(ctx, bulb.shape, isActive, cx, cy, r);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  if (!isHorizontal) {
    // Vertical: rotate 90° CCW to align canvas vertical (bulb stack) with box X → world Z (up)
    texture.center.set(0.5, 0.5);
    texture.rotation = Math.PI / 2;
  }
  // Horizontal: no rotation needed (canvas width maps to box width in world)

  textureCache.set(key, texture);
  return texture;
}

// ---------------------------------------------------------------------------
// Material array cache (housing sides + textured front)
// ---------------------------------------------------------------------------

/** Lazily-created singleton material shared by all housing side/back faces. */
let _housingMat: THREE.MeshBasicMaterial | null = null;
function getHousingMaterial(): THREE.MeshBasicMaterial {
  if (!_housingMat) {
    _housingMat = new THREE.MeshBasicMaterial({ color: HOUSING_COLOR });
  }
  return _housingMat;
}

const materialArrayCache = new Map<string, THREE.MeshBasicMaterial[]>();

/**
 * Obtain the 6-element material array for a BoxGeometry signal head.
 * Order: [+X, -X, +Y, -Y, +Z(front), -Z(back)].
 * Cached by the same key as getSignalTexture.
 */
export function getSignalMaterials(
  descriptor: SignalDescriptor,
  activeState?: string,
): THREE.MeshBasicMaterial[] {
  const key = buildCacheKey(descriptor, activeState);
  const cached = materialArrayCache.get(key);
  if (cached) return cached;

  const tex = getSignalTexture(descriptor, activeState);
  const frontMat = new THREE.MeshBasicMaterial({ map: tex });
  const h = getHousingMaterial();
  const materials = [h, h, h, h, frontMat, h];
  materialArrayCache.set(key, materials);
  return materials;
}

// ---------------------------------------------------------------------------
// Internal: overlay drawing
// ---------------------------------------------------------------------------

function drawBulbOverlay(
  ctx: CanvasRenderingContext2D,
  faceShape: BulbFaceShape,
  isActive: boolean,
  cx: number,
  cy: number,
  bulbRadiusPx: number,
): void {
  if (faceShape === 'circle') return;

  const shape = getShape(faceShape);
  if (!shape) return;

  const overlayScale = bulbRadiusPx * 1.2;
  ctx.fillStyle = isActive ? 'rgba(17,17,17,0.85)' : 'rgba(17,17,17,0.3)';

  drawShapeOnCanvas(ctx, shape, cx, cy, overlayScale);

  // Pedestrian head circle
  if (faceShape === 'pedestrian-stop' || faceShape === 'pedestrian-go') {
    ctx.beginPath();
    ctx.arc(cx, cy - 0.45 * overlayScale, 0.12 * overlayScale, 0, Math.PI * 2);
    ctx.fill();
  }
}

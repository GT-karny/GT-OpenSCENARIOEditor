/**
 * Pure rendering functions for the 2D minimap overlay.
 * Works with OpenDRIVE road geometry and entity positions.
 */

import type { OpenDriveDocument } from '@osce/shared';
import { evaluateReferenceLineAtS } from '@osce/opendrive';
import type { WorldCoords } from './position-resolver.js';

export interface Point2D {
  x: number;
  y: number;
}

export interface MinimapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface MinimapRenderOptions {
  roadPolylines: Point2D[][];
  bounds: MinimapBounds;
  canvasSize: number;
  entities: { name: string; pos: WorldCoords; type: 'vehicle' | 'pedestrian' | 'miscObject' }[];
  selectedEntityId: string | null;
  entityIdMap: Map<string, string>; // name → id
  /** Camera position in OpenDRIVE coords (x, y) */
  cameraX: number;
  cameraY: number;
  /** Camera look-at direction angle in OpenDRIVE coords (radians) */
  cameraAngle: number;
  /** Current zoom level (used to keep icon sizes constant on screen) */
  zoom?: number;
}

/**
 * Sample road reference lines into 2D polylines.
 */
export function computeRoadPolylines(document: OpenDriveDocument): Point2D[][] {
  return document.roads.map((road) => {
    const points: Point2D[] = [];
    const step = Math.max(road.length / 100, 5);
    for (let s = 0; s <= road.length; s += step) {
      const pose = evaluateReferenceLineAtS(road.planView, s);
      points.push({ x: pose.x, y: pose.y });
    }
    // Ensure end point is included
    if (road.length > 0) {
      const endPose = evaluateReferenceLineAtS(road.planView, road.length);
      points.push({ x: endPose.x, y: endPose.y });
    }
    return points;
  });
}

/**
 * Compute bounding box of all road polylines with 10% padding.
 */
export function computeBounds(polylines: Point2D[][]): MinimapBounds | null {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const line of polylines) {
    for (const pt of line) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }
  }

  if (!isFinite(minX)) return null;

  const padX = Math.max((maxX - minX) * 0.1, 10);
  const padY = Math.max((maxY - minY) * 0.1, 10);
  return { minX: minX - padX, maxX: maxX + padX, minY: minY - padY, maxY: maxY + padY };
}

/**
 * Convert OpenDRIVE world coordinates to canvas pixel coordinates.
 * Y axis is flipped (canvas y increases downward).
 */
export function worldToCanvas(
  wx: number,
  wy: number,
  bounds: MinimapBounds,
  canvasSize: number,
): { cx: number; cy: number } {
  const rangeX = bounds.maxX - bounds.minX;
  const rangeY = bounds.maxY - bounds.minY;
  const scale = canvasSize / Math.max(rangeX, rangeY);
  const offsetX = (canvasSize - rangeX * scale) / 2;
  const offsetY = (canvasSize - rangeY * scale) / 2;

  return {
    cx: (wx - bounds.minX) * scale + offsetX,
    cy: canvasSize - ((wy - bounds.minY) * scale + offsetY), // flip Y
  };
}

/**
 * Convert canvas pixel coordinates back to OpenDRIVE world coordinates.
 */
export function canvasToWorld(
  cx: number,
  cy: number,
  bounds: MinimapBounds,
  canvasSize: number,
): { wx: number; wy: number } {
  const rangeX = bounds.maxX - bounds.minX;
  const rangeY = bounds.maxY - bounds.minY;
  const scale = canvasSize / Math.max(rangeX, rangeY);
  const offsetX = (canvasSize - rangeX * scale) / 2;
  const offsetY = (canvasSize - rangeY * scale) / 2;

  return {
    wx: (cx - offsetX) / scale + bounds.minX,
    wy: (canvasSize - cy - offsetY) / scale + bounds.minY, // flip Y back
  };
}

/**
 * Render static road layer to an offscreen canvas.
 */
export function renderRoadLayer(ctx: CanvasRenderingContext2D, polylines: Point2D[][], bounds: MinimapBounds, canvasSize: number, zoom = 1): void {
  ctx.strokeStyle = 'rgba(180, 180, 200, 0.8)';
  ctx.lineWidth = 2 / zoom;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const line of polylines) {
    if (line.length < 2) continue;
    ctx.beginPath();
    const first = worldToCanvas(line[0].x, line[0].y, bounds, canvasSize);
    ctx.moveTo(first.cx, first.cy);
    for (let i = 1; i < line.length; i++) {
      const pt = worldToCanvas(line[i].x, line[i].y, bounds, canvasSize);
      ctx.lineTo(pt.cx, pt.cy);
    }
    ctx.stroke();
  }
}

/**
 * Render dynamic layer (entities + camera) on top of the cached road layer.
 */
export function renderDynamicLayer(ctx: CanvasRenderingContext2D, options: MinimapRenderOptions): void {
  const { bounds, canvasSize, entities, selectedEntityId, entityIdMap, cameraX, cameraY, cameraAngle, zoom = 1 } = options;

  // Inverse zoom so icons stay the same screen-pixel size regardless of zoom
  const iz = 1 / zoom;

  // Draw entities
  for (const { name, pos, type } of entities) {
    const { cx, cy } = worldToCanvas(pos.x, pos.y, bounds, canvasSize);
    const entityId = entityIdMap.get(name);
    const isSelected = entityId === selectedEntityId;

    // Entity color by type
    let color: string;
    switch (type) {
      case 'vehicle':
        color = '#33CC33';
        break;
      case 'pedestrian':
        color = '#FF8833';
        break;
      default:
        color = '#AAAACC';
    }

    // Selected highlight ring
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(cx, cy, 7 * iz, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFCC00';
      ctx.lineWidth = 2 * iz;
      ctx.stroke();
    }

    // Entity dot
    ctx.beginPath();
    ctx.arc(cx, cy, (isSelected ? 5 : 4) * iz, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Draw camera indicator (triangle)
  const cam = worldToCanvas(cameraX, cameraY, bounds, canvasSize);
  const size = 8 * iz;
  // Camera angle: direction camera is looking, in OpenDRIVE coords
  // Convert to canvas coords (Y flipped)
  const angle = -cameraAngle;

  ctx.save();
  ctx.translate(cam.cx, cam.cy);
  ctx.rotate(angle);

  // Triangle pointing right (then rotated by angle)
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.6, -size * 0.5);
  ctx.lineTo(-size * 0.6, size * 0.5);
  ctx.closePath();
  ctx.fillStyle = 'rgba(100, 160, 255, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 1 * iz;
  ctx.stroke();

  ctx.restore();
}

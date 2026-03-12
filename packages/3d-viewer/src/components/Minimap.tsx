/**
 * Canvas 2D minimap overlay for the 3D viewer.
 * Shows road network, entity positions, and camera indicator.
 * Click to teleport camera to a world position.
 * Scroll to zoom, drag to pan.
 */

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import type { OpenDriveDocument, ScenarioEntity, SimulationFrame } from '@osce/shared';
import type { Vector3 } from 'three';
import type { MinimapSize } from '../store/viewer-types.js';
import type { WorldCoords } from '../utils/position-resolver.js';
import {
  computeRoadPolylines,
  computeBounds,
  renderRoadLayer,
  renderDynamicLayer,
  canvasToWorld,
} from '../utils/minimap-renderer.js';
import type { MinimapPositionMarker, MinimapRouteData } from '../utils/minimap-renderer.js';


interface MinimapProps {
  openDriveDocument: OpenDriveDocument | null;
  entityPositions: Map<string, WorldCoords>;
  entities: ScenarioEntity[];
  selectedEntityId: string | null;
  cameraStateRef: React.RefObject<{ position: Vector3; target: Vector3 }>;
  size: MinimapSize;
  onClickPosition: (worldX: number, worldY: number) => void;
  /** When provided, entity positions are taken from simulation frame instead of initial positions */
  currentFrame?: SimulationFrame | null;
  /** Position markers from actions/conditions */
  positionMarkers?: MinimapPositionMarker[];
  /** Route lines and waypoints to display */
  routes?: MinimapRouteData[];
}

const SIZE_MAP: Record<MinimapSize, number> = {
  small: 150,
  medium: 200,
  large: 280,
};

const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1;
const TARGET_FPS = 10;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const MIN_ZOOM = 1;
const MAX_ZOOM = 10;
const ZOOM_FACTOR = 1.15;
const DRAG_THRESHOLD = 3;

export const Minimap: React.FC<MinimapProps> = React.memo(({
  openDriveDocument,
  entityPositions,
  entities,
  selectedEntityId,
  cameraStateRef,
  size,
  onClickPosition,
  currentFrame,
  positionMarkers,
  routes,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastDrawRef = useRef(0);

  // Zoom & pan state (refs to avoid re-renders)
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  const canvasSize = SIZE_MAP[size];

  // Precompute road polylines and bounds (only when OpenDRIVE changes)
  const roadPolylines = useMemo(() => {
    if (!openDriveDocument) return [];
    return computeRoadPolylines(openDriveDocument);
  }, [openDriveDocument]);

  const bounds = useMemo(() => computeBounds(roadPolylines), [roadPolylines]);

  // Build entity name→id map
  const entityIdMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of entities) {
      map.set(e.name, e.id);
    }
    return map;
  }, [entities]);

  // Reset zoom/pan when bounds or canvas size change
  useEffect(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
  }, [bounds, canvasSize]);

  // Wheel zoom (non-passive to allow preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bounds) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvasSize / rect.width);
      const mouseY = (e.clientY - rect.top) * (canvasSize / rect.height);

      const oldZoom = zoomRef.current;
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom * factor));

      // Adjust pan to keep point under cursor fixed
      const pan = panRef.current;
      panRef.current = {
        x: mouseX - (mouseX - pan.x) * (newZoom / oldZoom),
        y: mouseY - (mouseY - pan.y) * (newZoom / oldZoom),
      };
      zoomRef.current = newZoom;

      // Reset pan when fully zoomed out
      if (newZoom <= MIN_ZOOM) {
        panRef.current = { x: 0, y: 0 };
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [bounds, canvasSize]);

  // Drag to pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      isDraggingRef.current = false;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...panRef.current };

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasSize / rect.width;
      const scaleY = canvasSize / rect.height;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - dragStartRef.current.x;
        const dy = moveEvent.clientY - dragStartRef.current.y;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          isDraggingRef.current = true;
        }
        if (isDraggingRef.current) {
          panRef.current = {
            x: panStartRef.current.x + dx * scaleX,
            y: panStartRef.current.y + dy * scaleY,
          };
        }
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [canvasSize],
  );

  // Animation loop (~10fps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bounds) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (now: number) => {
      rafRef.current = requestAnimationFrame(draw);

      if (now - lastDrawRef.current < FRAME_INTERVAL) return;
      lastDrawRef.current = now;

      const px = canvasSize * DPR;
      ctx.clearRect(0, 0, px, px);

      // Background (full canvas, not affected by zoom)
      ctx.save();
      ctx.scale(DPR, DPR);
      ctx.fillStyle = 'rgba(20, 20, 35, 0.85)';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Clip to canvas bounds and apply zoom/pan
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, canvasSize, canvasSize);
      ctx.clip();
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);

      // Draw roads (vector, crisp at any zoom)
      renderRoadLayer(ctx, roadPolylines, bounds, canvasSize, zoomRef.current);

      // Compute camera position in OpenDRIVE coords
      // Three.js camera position: (x, y, z) → OpenDRIVE: (x, -z)
      // Three.js target: (x, y, z) → OpenDRIVE: (x, -z)
      const camState = cameraStateRef.current;
      const camX = camState.position.x;
      const camY = -camState.position.z; // Three.js z → OpenDRIVE -y
      const targetX = camState.target.x;
      const targetY = -camState.target.z;
      const cameraAngle = Math.atan2(targetY - camY, targetX - camX);

      // Build entity list for rendering
      // During simulation, use frame positions; otherwise use initial positions
      const entityList: { name: string; pos: WorldCoords; type: 'vehicle' | 'pedestrian' | 'miscObject' }[] = [];
      if (currentFrame) {
        for (const obj of currentFrame.objects) {
          const entity = entities.find((e) => e.name === obj.name);
          if (entity) {
            entityList.push({ name: obj.name, pos: { x: obj.x, y: obj.y, z: obj.z, h: obj.h }, type: entity.type });
          }
        }
      } else {
        for (const entity of entities) {
          const pos = entityPositions.get(entity.name);
          if (pos) {
            entityList.push({ name: entity.name, pos, type: entity.type });
          }
        }
      }

      renderDynamicLayer(ctx, {
        roadPolylines,
        bounds,
        canvasSize,
        entities: entityList,
        selectedEntityId,
        entityIdMap,
        cameraX: camX,
        cameraY: camY,
        cameraAngle,
        zoom: zoomRef.current,
        positionMarkers,
        routes,
      });

      ctx.restore(); // zoom/pan clip
      ctx.restore(); // DPR
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [bounds, canvasSize, entities, entityPositions, selectedEntityId, entityIdMap, roadPolylines, cameraStateRef, currentFrame, positionMarkers, routes]);

  // Handle click to teleport (only if not dragging)
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDraggingRef.current) return;
      if (!bounds) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvasSize / rect.width);
      const mouseY = (e.clientY - rect.top) * (canvasSize / rect.height);

      // Undo zoom/pan to get base canvas coordinates
      const baseX = (mouseX - panRef.current.x) / zoomRef.current;
      const baseY = (mouseY - panRef.current.y) / zoomRef.current;

      const { wx, wy } = canvasToWorld(baseX, baseY, bounds, canvasSize);
      onClickPosition(wx, wy);
    },
    [bounds, canvasSize, onClickPosition],
  );

  if (!openDriveDocument || !bounds) return null;

  const px = canvasSize * DPR;

  return (
    <canvas
      ref={canvasRef}
      width={px}
      height={px}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: canvasSize,
        height: canvasSize,
        zIndex: 10,
        borderRadius: 8,
        border: '1px solid rgba(100, 100, 140, 0.4)',
        cursor: 'crosshair',
        pointerEvents: 'auto',
      }}
    />
  );
});

Minimap.displayName = 'Minimap';

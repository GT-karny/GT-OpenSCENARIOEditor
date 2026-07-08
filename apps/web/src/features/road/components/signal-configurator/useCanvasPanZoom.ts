/**
 * Pan/zoom hook for the assembly configurator SVG canvas.
 *
 * - Wheel: zoom (centered on cursor)
 * - Middle mouse drag: pan
 */

import { useCallback, useRef } from 'react';
import type { ViewTransform } from './useAssemblyConfigurator';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_FACTOR = 0.002;

interface UsePanZoomOptions {
  viewTransform: ViewTransform;
  setViewTransform: (vt: Partial<ViewTransform>) => void;
}

export function useCanvasPanZoom({ viewTransform, setViewTransform }: UsePanZoomOptions) {
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const onWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const delta = -e.deltaY * ZOOM_FACTOR;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewTransform.zoom * (1 + delta)));
      setViewTransform({ zoom: newZoom });
    },
    [viewTransform.zoom, setViewTransform],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      // Middle mouse button
      if (e.button === 1) {
        e.preventDefault();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        panStart.current = {
          x: e.clientX,
          y: e.clientY,
          panX: viewTransform.panX,
          panY: viewTransform.panY,
        };
      }
    },
    [viewTransform.panX, viewTransform.panY],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!panStart.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setViewTransform({
        panX: panStart.current.panX + dx / viewTransform.zoom,
        panY: panStart.current.panY + dy / viewTransform.zoom,
      });
    },
    [viewTransform.zoom, setViewTransform],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.button === 1) {
        panStart.current = null;
      }
    },
    [],
  );

  return { onWheel, onPointerDown, onPointerMove, onPointerUp };
}

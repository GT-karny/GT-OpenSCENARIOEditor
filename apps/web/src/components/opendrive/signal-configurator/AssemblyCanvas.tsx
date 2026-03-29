/**
 * SVG canvas for the assembly visual configurator.
 * Supports pan/zoom, drag-from-palette drop, and head selection/dragging.
 */

import { useCallback, useRef } from 'react';
import type { AssemblyHeadPlacement } from '@osce/opendrive-engine';
import { AssemblyCanvasGrid } from './AssemblyCanvasGrid';
import { AssemblyHeadItem } from './AssemblyHeadItem';
import { useCanvasPanZoom } from './useCanvasPanZoom';
import type { ViewTransform } from './useAssemblyConfigurator';

interface AssemblyCanvasProps {
  heads: AssemblyHeadPlacement[];
  selectedHeadIndex: number | null;
  viewTransform: ViewTransform;
  gridSnap: boolean;
  gridSize: number;
  onSelectHead: (index: number | null) => void;
  onMoveHead: (index: number, x: number, y: number) => void;
  onAddHead: (presetId: string, x: number, y: number) => void;
  setViewTransform: (vt: Partial<ViewTransform>) => void;
}

/** Visible extent in metres for the grid. */
const GRID_EXTENT = 3;

export function AssemblyCanvas({
  heads,
  selectedHeadIndex,
  viewTransform,
  gridSnap,
  gridSize,
  onSelectHead,
  onMoveHead,
  onAddHead,
  setViewTransform,
}: AssemblyCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const panZoom = useCanvasPanZoom({ viewTransform, setViewTransform });

  // Compute viewBox from transform
  const baseSize = 2; // metres visible at zoom=1
  const viewSize = baseSize / viewTransform.zoom;
  const vbX = -viewSize / 2 - viewTransform.panX;
  const vbY = -viewSize / 2 - viewTransform.panY;
  const viewBox = `${vbX} ${vbY} ${viewSize} ${viewSize}`;

  // Convert screen coords to SVG coords
  const screenToSvg = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const svgPt = pt.matrixTransform(ctm.inverse());
      return { x: svgPt.x, y: svgPt.y };
    },
    [],
  );

  // Drop handler for palette D&D
  const onDragOver = useCallback((e: React.DragEvent<SVGSVGElement>) => {
    if (e.dataTransfer.types.includes('application/x-signal-preset')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<SVGSVGElement>) => {
      e.preventDefault();
      const presetId = e.dataTransfer.getData('application/x-signal-preset');
      if (!presetId) return;
      const { x, y } = screenToSvg(e.clientX, e.clientY);
      onAddHead(presetId, x, y);
    },
    [screenToSvg, onAddHead],
  );

  // Click on empty space deselects
  const onCanvasClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.target === svgRef.current) {
        onSelectHead(null);
      }
    },
    [onSelectHead],
  );

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      className="w-full flex-1 bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)]"
      style={{ minHeight: 120 }}
      onWheel={panZoom.onWheel}
      onPointerDown={panZoom.onPointerDown}
      onPointerMove={panZoom.onPointerMove}
      onPointerUp={panZoom.onPointerUp}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onCanvasClick}
    >
      <AssemblyCanvasGrid
        gridSize={gridSize}
        showGrid={gridSnap}
        extent={GRID_EXTENT}
      />

      {heads.map((head, i) => (
        <AssemblyHeadItem
          key={i}
          head={head}
          index={i}
          selected={selectedHeadIndex === i}
          zoom={viewTransform.zoom}
          gridSnap={gridSnap}
          gridSize={gridSize}
          onSelect={onSelectHead}
          onMove={onMoveHead}
        />
      ))}
    </svg>
  );
}

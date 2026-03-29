/**
 * Individual draggable signal head on the assembly configurator canvas.
 * Renders a Canvas2D real preview as an SVG <image>.
 */

import { useRef, useCallback, useEffect, useState, memo } from 'react';
import type { AssemblyHeadPlacement } from '@osce/opendrive-engine';
import {
  getPresetById,
  computeHeadWidth,
  computeHeadHeight,
  renderSignalHeadToCanvas,
} from '@osce/opendrive-engine';

interface AssemblyHeadItemProps {
  head: AssemblyHeadPlacement;
  index: number;
  selected: boolean;
  zoom: number;
  gridSnap: boolean;
  gridSize: number;
  onSelect: (index: number) => void;
  onMove: (index: number, x: number, y: number) => void;
}

export const AssemblyHeadItem = memo(function AssemblyHeadItem({
  head,
  index,
  selected,
  zoom,
  gridSnap,
  gridSize,
  onSelect,
  onMove,
}: AssemblyHeadItemProps) {
  const preset = getPresetById(head.presetId);
  const bulbCount = preset?.bulbs.length ?? 3;
  const orientation = preset?.orientation ?? 'vertical';
  const w = computeHeadWidth(bulbCount, orientation);
  const h = computeHeadHeight(bulbCount, orientation);

  // Canvas2D preview as data URL
  const [imageUrl, setImageUrl] = useState<string>('');
  useEffect(() => {
    const canvas = renderSignalHeadToCanvas(head.presetId);
    if (canvas) {
      setImageUrl(canvas.toDataURL());
    }
  }, [head.presetId]);

  // Drag state
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    svgEl: SVGSVGElement;
  } | null>(null);

  const getSvgPoint = useCallback((clientX: number, clientY: number, svg: SVGSVGElement) => {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      onSelect(index);

      const svg = (e.currentTarget as Element).closest('svg') as SVGSVGElement;
      if (!svg) return;
      (e.target as Element).setPointerCapture?.(e.pointerId);

      const svgPt = getSvgPoint(e.clientX, e.clientY, svg);
      dragRef.current = {
        startX: svgPt.x,
        startY: svgPt.y,
        origX: head.x,
        origY: head.y,
        svgEl: svg,
      };
    },
    [index, head.x, head.y, onSelect, getSvgPoint],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const svgPt = getSvgPoint(e.clientX, e.clientY, dragRef.current.svgEl);
      let newX = dragRef.current.origX + (svgPt.x - dragRef.current.startX);
      let newY = dragRef.current.origY + (svgPt.y - dragRef.current.startY);
      if (gridSnap) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }
      onMove(index, newX, newY);
    },
    [index, gridSnap, gridSize, onMove, getSvgPoint],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const strokeWidth = 0.015 / zoom;

  return (
    <g
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ cursor: 'grab' }}
    >
      {/* Selection highlight */}
      {selected && (
        <rect
          x={head.x - w / 2 - 0.02}
          y={head.y - h / 2 - 0.02}
          width={w + 0.04}
          height={h + 0.04}
          fill="none"
          stroke="var(--color-accent-vivid)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${0.03} ${0.02}`}
        />
      )}

      {/* Head image */}
      {imageUrl ? (
        <image
          href={imageUrl}
          x={head.x - w / 2}
          y={head.y - h / 2}
          width={w}
          height={h}
        />
      ) : (
        <rect
          x={head.x - w / 2}
          y={head.y - h / 2}
          width={w}
          height={h}
          fill="var(--color-glass-2)"
          stroke="var(--color-glass-edge)"
          strokeWidth={strokeWidth}
        />
      )}
    </g>
  );
});

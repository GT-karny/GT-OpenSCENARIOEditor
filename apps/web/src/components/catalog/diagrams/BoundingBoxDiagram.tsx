import { useRef, useState, useEffect, useMemo } from 'react';
import type { BoundingBox } from '@osce/shared';
import type { HighlightKey } from './types';
import { computeViewport, toSvgSide } from './svg-utils';
import { DimensionLine } from './DimensionLine';
import { CenterMarker } from './CenterMarker';
import { GroundLine } from './GroundLine';

interface BoundingBoxDiagramProps {
  boundingBox: BoundingBox;
  highlighted: HighlightKey;
  onHighlight: (key: HighlightKey) => void;
}

export function BoundingBoxDiagram({
  boundingBox: bb,
  highlighted,
  onHighlight,
}: BoundingBoxDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 250 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const bbX0 = bb.center.x - bb.dimensions.length / 2;
  const bbZ0 = bb.center.z - bb.dimensions.height / 2;

  const xMin = Math.min(bbX0, 0);
  const xMax = Math.max(bbX0 + bb.dimensions.length, 0);
  const zMin = Math.min(bbZ0, 0);
  const zMax = Math.max(bbZ0 + bb.dimensions.height, 0);

  const layout = useMemo(
    () => computeViewport(size.w, size.h, xMin, xMax, zMin, zMax, 1.5),
    [size.w, size.h, xMin, xMax, zMin, zMax],
  );

  const topLeft = toSvgSide(bbX0, bbZ0 + bb.dimensions.height, layout);
  const bottomLeft = toSvgSide(bbX0, bbZ0, layout);
  const bottomRight = toSvgSide(bbX0 + bb.dimensions.length, bbZ0, layout);
  const topRight = toSvgSide(bbX0 + bb.dimensions.length, bbZ0 + bb.dimensions.height, layout);

  const center = toSvgSide(bb.center.x, bb.center.z, layout);
  const ground = toSvgSide(0, 0, layout);

  const bbStroke =
    highlighted === 'bb-length' || highlighted === 'bb-height'
      ? 'rgba(190,180,240,0.45)'
      : 'rgba(180,170,230,0.22)';
  const bbFill =
    highlighted === 'bb-length' || highlighted === 'bb-height'
      ? 'rgba(155,132,232,0.08)'
      : 'rgba(155,132,232,0.04)';

  const centerHighlighted = highlighted === 'bb-center-x' || highlighted === 'bb-center-z';

  const dimOffset = 18;

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${layout.viewBoxWidth} ${layout.viewBoxHeight}`}
      >
        {/* Ground line */}
        <GroundLine
          y={ground.y}
          x1={toSvgSide(bbX0 - 0.3, 0, layout).x}
          x2={toSvgSide(bbX0 + bb.dimensions.length + 0.3, 0, layout).x}
        />

        {/* BoundingBox */}
        <rect
          x={topLeft.x}
          y={topLeft.y}
          width={bottomRight.x - topLeft.x}
          height={bottomRight.y - topLeft.y}
          fill={bbFill}
          stroke={bbStroke}
          strokeWidth={1}
          rx={2}
        />

        {/* Center marker */}
        <CenterMarker x={center.x} y={center.y} highlighted={centerHighlighted} />

        {/* Dimension: length (bottom) */}
        <DimensionLine
          x1={bottomLeft.x}
          y1={bottomLeft.y}
          x2={bottomRight.x}
          y2={bottomRight.y}
          value={bb.dimensions.length}
          offset={dimOffset}
          highlightKey="bb-length"
          highlighted={highlighted}
          onHighlight={onHighlight}
        />

        {/* Dimension: height (right) */}
        <DimensionLine
          x1={bottomRight.x}
          y1={bottomRight.y}
          x2={topRight.x}
          y2={topRight.y}
          value={bb.dimensions.height}
          offset={dimOffset}
          highlightKey="bb-height"
          highlighted={highlighted}
          onHighlight={onHighlight}
        />
      </svg>
    </div>
  );
}

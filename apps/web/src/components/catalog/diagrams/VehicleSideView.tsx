import { useRef, useState, useEffect, useMemo } from 'react';
import type { BoundingBox, Axles } from '@osce/shared';
import type { HighlightKey } from './types';
import { computeViewport, toSvgSide, m2px } from './svg-utils';
import { DimensionLine } from './DimensionLine';
import { CenterMarker } from './CenterMarker';
import { GroundLine } from './GroundLine';

interface VehicleSideViewProps {
  boundingBox: BoundingBox;
  axles: Axles;
  highlighted: HighlightKey;
  onHighlight: (key: HighlightKey) => void;
}

export function VehicleSideView({
  boundingBox: bb,
  axles,
  highlighted,
  onHighlight,
}: VehicleSideViewProps) {
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

  // BoundingBox rear-bottom in world coords
  const bbX0 = bb.center.x - bb.dimensions.length / 2;
  const bbZ0 = bb.center.z - bb.dimensions.height / 2;

  // Compute world bounds including axles and wheels
  const fWR = axles.frontAxle.wheelDiameter / 2;
  const rWR = axles.rearAxle.wheelDiameter / 2;

  const xMin = Math.min(bbX0, axles.rearAxle.positionX - rWR, axles.frontAxle.positionX - fWR);
  const xMax = Math.max(bbX0 + bb.dimensions.length, axles.rearAxle.positionX + rWR, axles.frontAxle.positionX + fWR);
  const zMin = Math.min(bbZ0, 0, axles.rearAxle.positionZ - rWR, axles.frontAxle.positionZ - fWR);
  const zMax = Math.max(bbZ0 + bb.dimensions.height, axles.frontAxle.positionZ + fWR, axles.rearAxle.positionZ + rWR);

  const layout = useMemo(
    () => computeViewport(size.w, size.h, xMin, xMax, zMin, zMax, 1.8),
    [size.w, size.h, xMin, xMax, zMin, zMax],
  );

  // BoundingBox SVG rect
  const bbTopLeft = toSvgSide(bbX0, bbZ0 + bb.dimensions.height, layout);
  const bbW = m2px(bb.dimensions.length, layout);
  const bbH = m2px(bb.dimensions.height, layout);

  // Wheels
  const frontWheel = toSvgSide(axles.frontAxle.positionX, axles.frontAxle.positionZ, layout);
  const frontR = m2px(axles.frontAxle.wheelDiameter / 2, layout);
  const rearWheel = toSvgSide(axles.rearAxle.positionX, axles.rearAxle.positionZ, layout);
  const rearR = m2px(axles.rearAxle.wheelDiameter / 2, layout);

  // Center marker
  const center = toSvgSide(bb.center.x, bb.center.z, layout);

  // Ground line
  const ground = toSvgSide(0, 0, layout);
  const groundX1 = toSvgSide(bbX0 - 0.5, 0, layout).x;
  const groundX2 = toSvgSide(bbX0 + bb.dimensions.length + 0.5, 0, layout).x;

  // Dimension line helper: bottom of bb in SVG
  const bbBottom = toSvgSide(bbX0, bbZ0, layout);
  const bbRight = toSvgSide(bbX0 + bb.dimensions.length, bbZ0, layout);
  const bbTopRight = toSvgSide(bbX0 + bb.dimensions.length, bbZ0 + bb.dimensions.height, layout);

  const dimOffset = 18;

  // Wheel highlight states
  const frontWheelStroke =
    highlighted === 'front-axle-posX' || highlighted === 'front-axle-wheelDia' || highlighted === 'front-axle-posZ'
      ? '#7B88E8'
      : 'rgba(123,136,232,0.35)';
  const rearWheelStroke =
    highlighted === 'rear-axle-posX' || highlighted === 'rear-axle-wheelDia' || highlighted === 'rear-axle-posZ'
      ? '#7B88E8'
      : 'rgba(123,136,232,0.35)';

  const bbStroke =
    highlighted === 'bb-length' || highlighted === 'bb-height' || highlighted === 'bb-center-x' || highlighted === 'bb-center-z'
      ? 'rgba(190,180,240,0.45)'
      : 'rgba(180,170,230,0.22)';
  const bbFill =
    highlighted === 'bb-length' || highlighted === 'bb-height'
      ? 'rgba(155,132,232,0.08)'
      : 'rgba(155,132,232,0.04)';

  const centerHighlighted = highlighted === 'bb-center-x' || highlighted === 'bb-center-z';

  // Front direction arrow — at BB front center (side view)
  const arrowCenter = toSvgSide(bbX0 + bb.dimensions.length, bb.center.z, layout);
  const arrowSize = 8;

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${layout.viewBoxWidth} ${layout.viewBoxHeight}`}
      >
        {/* Ground line */}
        <GroundLine y={ground.y} x1={groundX1} x2={groundX2} />

        {/* BoundingBox */}
        <rect
          x={bbTopLeft.x}
          y={bbTopLeft.y}
          width={bbW}
          height={bbH}
          fill={bbFill}
          stroke={bbStroke}
          strokeWidth={1}
          rx={2}
        />

        {/* Front direction arrow */}
        <polygon
          points={`${arrowCenter.x - arrowSize},${arrowCenter.y - arrowSize * 0.7} ${arrowCenter.x + 2},${arrowCenter.y} ${arrowCenter.x - arrowSize},${arrowCenter.y + arrowSize * 0.7}`}
          fill="rgba(232,201,66,0.3)"
          stroke="rgba(232,201,66,0.5)"
          strokeWidth={0.8}
        />

        {/* Rear wheel */}
        <circle
          cx={rearWheel.x}
          cy={rearWheel.y}
          r={Math.max(rearR, 3)}
          fill="rgba(123,136,232,0.06)"
          stroke={rearWheelStroke}
          strokeWidth={1.2}
        />

        {/* Front wheel */}
        <circle
          cx={frontWheel.x}
          cy={frontWheel.y}
          r={Math.max(frontR, 3)}
          fill="rgba(123,136,232,0.06)"
          stroke={frontWheelStroke}
          strokeWidth={1.2}
        />

        {/* Center marker */}
        <CenterMarker x={center.x} y={center.y} highlighted={centerHighlighted} />

        {/* Dimension: total length (below) */}
        <DimensionLine
          x1={bbBottom.x}
          y1={bbBottom.y}
          x2={bbRight.x}
          y2={bbRight.y}
          value={bb.dimensions.length}
          offset={dimOffset}
          highlightKey="bb-length"
          highlighted={highlighted}
          onHighlight={onHighlight}
        />

        {/* Dimension: total height (right side) */}
        <DimensionLine
          x1={bbRight.x}
          y1={bbRight.y}
          x2={bbTopRight.x}
          y2={bbTopRight.y}
          value={bb.dimensions.height}
          offset={dimOffset}
          highlightKey="bb-height"
          highlighted={highlighted}
          onHighlight={onHighlight}
        />

        {/* Dimension: front axle posX (from rear axle to front axle, along ground) */}
        {axles.frontAxle.positionX > 0 && (
          <DimensionLine
            x1={rearWheel.x}
            y1={ground.y}
            x2={frontWheel.x}
            y2={ground.y}
            value={axles.frontAxle.positionX - axles.rearAxle.positionX}
            offset={dimOffset + 20}
            highlightKey="front-axle-posX"
            highlighted={highlighted}
            onHighlight={onHighlight}
          />
        )}

        {/* Dimension: front wheel diameter (vertical beside front wheel) */}
        {axles.frontAxle.wheelDiameter > 0 && (
          <DimensionLine
            x1={frontWheel.x}
            y1={toSvgSide(axles.frontAxle.positionX, axles.frontAxle.positionZ - axles.frontAxle.wheelDiameter / 2, layout).y}
            x2={frontWheel.x}
            y2={toSvgSide(axles.frontAxle.positionX, axles.frontAxle.positionZ + axles.frontAxle.wheelDiameter / 2, layout).y}
            value={axles.frontAxle.wheelDiameter}
            offset={dimOffset * 1.2}
            highlightKey="front-axle-wheelDia"
            highlighted={highlighted}
            onHighlight={onHighlight}
          />
        )}

        {/* Label: SIDE VIEW */}
        <text
          x={6}
          y={14}
          fill="rgba(255,255,255,0.18)"
          fontSize={8}
          fontFamily="var(--font-display, var(--font-mono, monospace))"
          textAnchor="start"
          letterSpacing="0.1em"
        >
          SIDE
        </text>
      </svg>
    </div>
  );
}

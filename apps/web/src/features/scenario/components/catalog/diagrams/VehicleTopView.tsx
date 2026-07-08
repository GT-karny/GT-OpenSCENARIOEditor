import { useRef, useState, useEffect, useMemo } from 'react';
import type { BoundingBox, Axles } from '@osce/shared';
import type { HighlightKey } from './types';
import { computeViewport, toSvgTop, m2px } from './svg-utils';
import { DimensionLine } from './DimensionLine';
import { CenterMarker } from './CenterMarker';

interface VehicleTopViewProps {
  boundingBox: BoundingBox;
  axles: Axles;
  highlighted: HighlightKey;
  onHighlight: (key: HighlightKey) => void;
}

const WHEEL_ASPECT = 0.35; // wheel width/diameter ratio for top view rectangles

export function VehicleTopView({
  boundingBox: bb,
  axles,
  highlighted,
  onHighlight,
}: VehicleTopViewProps) {
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

  const w = bb.dimensions.width;
  const bbX0 = bb.center.x - bb.dimensions.length / 2;

  // Compute world bounds including axles and wheels
  const fTW = axles.frontAxle.trackWidth / 2;
  const rTW = axles.rearAxle.trackWidth / 2;
  const fWR = axles.frontAxle.wheelDiameter / 2; // half-length of wheel in X
  const rWR = axles.rearAxle.wheelDiameter / 2;

  const xMin = Math.min(bbX0, axles.rearAxle.positionX - rWR, axles.frontAxle.positionX - fWR);
  const xMax = Math.max(bbX0 + bb.dimensions.length, axles.rearAxle.positionX + rWR, axles.frontAxle.positionX + fWR);
  const yMin = -Math.max(w / 2, fTW, rTW);
  const yMax = Math.max(w / 2, fTW, rTW);

  const layout = useMemo(
    () => computeViewport(size.w, size.h, xMin, xMax, yMin, yMax, 1.8),
    [size.w, size.h, xMin, xMax, yMin, yMax],
  );

  // BoundingBox SVG rect
  const bbTL = toSvgTop(bbX0, w / 2, layout, w);
  const bbBR = toSvgTop(bbX0 + bb.dimensions.length, -w / 2, layout, w);
  const bbW = bbBR.x - bbTL.x;
  const bbH = bbBR.y - bbTL.y;

  // Center marker
  const center = toSvgTop(bb.center.x, bb.center.y, layout, w);

  // Axle helpers — wheelW = longitudinal (X), wheelH = lateral (Y)
  const drawAxle = (posX: number, trackWidth: number, wheelDia: number) => {
    const left = toSvgTop(posX, trackWidth / 2, layout, w);
    const right = toSvgTop(posX, -trackWidth / 2, layout, w);
    const wheelW = m2px(wheelDia, layout);                   // rolling direction (X)
    const wheelH = m2px(wheelDia * WHEEL_ASPECT, layout);    // lateral (Y)
    return { left, right, wheelW, wheelH };
  };

  const front = drawAxle(axles.frontAxle.positionX, axles.frontAxle.trackWidth, axles.frontAxle.wheelDiameter);
  const rear = drawAxle(axles.rearAxle.positionX, axles.rearAxle.trackWidth, axles.rearAxle.wheelDiameter);

  const bbStroke =
    highlighted === 'bb-length' || highlighted === 'bb-width' || highlighted === 'bb-center-x' || highlighted === 'bb-center-y'
      ? 'rgba(190,180,240,0.45)'
      : 'rgba(180,170,230,0.22)';
  const bbFill =
    highlighted === 'bb-length' || highlighted === 'bb-width'
      ? 'rgba(155,132,232,0.08)'
      : 'rgba(155,132,232,0.04)';

  const frontHighlight =
    highlighted === 'front-axle-posX' || highlighted === 'front-axle-trackW';
  const rearHighlight =
    highlighted === 'rear-axle-posX' || highlighted === 'rear-axle-trackW';

  const axleStroke = (active: boolean) => (active ? '#7B88E8' : 'rgba(123,136,232,0.35)');
  const axleFill = (active: boolean) => (active ? 'rgba(123,136,232,0.12)' : 'rgba(123,136,232,0.06)');

  const centerHighlighted = highlighted === 'bb-center-x' || highlighted === 'bb-center-y';

  // Dimension line positions
  const dimOffset = 18;
  const bbBottomLeft = toSvgTop(bbX0, -w / 2, layout, w);
  const bbBottomRight = toSvgTop(bbX0 + bb.dimensions.length, -w / 2, layout, w);
  const bbTopRight = toSvgTop(bbX0 + bb.dimensions.length, w / 2, layout, w);

  // Front direction arrow — at BB front center
  const arrowTip = toSvgTop(bbX0 + bb.dimensions.length, 0, layout, w);
  const arrowSize = 8;

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${layout.viewBoxWidth} ${layout.viewBoxHeight}`}
      >
        {/* BoundingBox */}
        <rect
          x={bbTL.x}
          y={bbTL.y}
          width={bbW}
          height={bbH}
          fill={bbFill}
          stroke={bbStroke}
          strokeWidth={1}
          rx={2}
        />

        {/* Front direction arrow */}
        <polygon
          points={`${arrowTip.x - arrowSize},${arrowTip.y - arrowSize * 0.7} ${arrowTip.x + 2},${arrowTip.y} ${arrowTip.x - arrowSize},${arrowTip.y + arrowSize * 0.7}`}
          fill="rgba(232,201,66,0.3)"
          stroke="rgba(232,201,66,0.5)"
          strokeWidth={0.8}
        />

        {/* Rear axle */}
        <line
          x1={rear.left.x}
          y1={rear.left.y}
          x2={rear.right.x}
          y2={rear.right.y}
          stroke={axleStroke(rearHighlight)}
          strokeWidth={0.8}
          strokeDasharray="3,2"
        />
        {/* Rear wheels */}
        <rect
          x={rear.left.x - rear.wheelW / 2}
          y={rear.left.y - rear.wheelH / 2}
          width={rear.wheelW}
          height={rear.wheelH}
          fill={axleFill(rearHighlight)}
          stroke={axleStroke(rearHighlight)}
          strokeWidth={1}
          rx={1}
        />
        <rect
          x={rear.right.x - rear.wheelW / 2}
          y={rear.right.y - rear.wheelH / 2}
          width={rear.wheelW}
          height={rear.wheelH}
          fill={axleFill(rearHighlight)}
          stroke={axleStroke(rearHighlight)}
          strokeWidth={1}
          rx={1}
        />

        {/* Front axle */}
        <line
          x1={front.left.x}
          y1={front.left.y}
          x2={front.right.x}
          y2={front.right.y}
          stroke={axleStroke(frontHighlight)}
          strokeWidth={0.8}
          strokeDasharray="3,2"
        />
        {/* Front wheels */}
        <rect
          x={front.left.x - front.wheelW / 2}
          y={front.left.y - front.wheelH / 2}
          width={front.wheelW}
          height={front.wheelH}
          fill={axleFill(frontHighlight)}
          stroke={axleStroke(frontHighlight)}
          strokeWidth={1}
          rx={1}
        />
        <rect
          x={front.right.x - front.wheelW / 2}
          y={front.right.y - front.wheelH / 2}
          width={front.wheelW}
          height={front.wheelH}
          fill={axleFill(frontHighlight)}
          stroke={axleStroke(frontHighlight)}
          strokeWidth={1}
          rx={1}
        />

        {/* Center marker */}
        <CenterMarker x={center.x} y={center.y} highlighted={centerHighlighted} />

        {/* Dimension: total length (bottom) */}
        <DimensionLine
          x1={bbBottomLeft.x}
          y1={bbBottomLeft.y}
          x2={bbBottomRight.x}
          y2={bbBottomRight.y}
          value={bb.dimensions.length}
          offset={dimOffset}
          highlightKey="bb-length"
          highlighted={highlighted}
          onHighlight={onHighlight}
        />

        {/* Dimension: total width (right side) */}
        <DimensionLine
          x1={bbBottomRight.x}
          y1={bbBottomRight.y}
          x2={bbTopRight.x}
          y2={bbTopRight.y}
          value={bb.dimensions.width}
          offset={dimOffset}
          highlightKey="bb-width"
          highlighted={highlighted}
          onHighlight={onHighlight}
        />

        {/* Dimension: front track width */}
        {axles.frontAxle.trackWidth > 0 && (
          <DimensionLine
            x1={front.left.x}
            y1={front.left.y}
            x2={front.right.x}
            y2={front.right.y}
            value={axles.frontAxle.trackWidth}
            offset={-dimOffset * 0.7}
            highlightKey="front-axle-trackW"
            highlighted={highlighted}
            onHighlight={onHighlight}
          />
        )}

        {/* Label: TOP VIEW */}
        <text
          x={6}
          y={14}
          fill="rgba(255,255,255,0.18)"
          fontSize={8}
          fontFamily="var(--font-display, var(--font-mono, monospace))"
          textAnchor="start"
          letterSpacing="0.1em"
        >
          TOP
        </text>
      </svg>
    </div>
  );
}

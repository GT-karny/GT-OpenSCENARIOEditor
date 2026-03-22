import { useMemo, useState, useCallback, useRef } from 'react';
import type { OdrElevation } from '@osce/shared';
import { cn } from '@/lib/utils';

interface ElevationGraphEditorProps {
  /** Elevation profile records */
  elevations: OdrElevation[];
  /** Total road length */
  roadLength: number;
  /** Current s-position (shown as vertical indicator line) */
  sPosition: number;
  /** Callback when a control point is dragged to a new elevation */
  onControlPointChange?: (index: number, newA: number) => void;
  /** Callback when the s-position indicator is clicked/dragged */
  onSPositionChange?: (s: number) => void;
  /** Additional CSS classes */
  className?: string;
}

/** Evaluate cubic polynomial: a + b*ds + c*ds^2 + d*ds^3 */
function evalCubic(a: number, b: number, c: number, d: number, ds: number): number {
  return a + ds * (b + ds * (c + ds * d));
}

/** Evaluate elevation at a given s position */
function evaluateElevationAt(elevations: readonly OdrElevation[], s: number): number {
  if (elevations.length === 0) return 0;

  let record = elevations[0];
  for (const e of elevations) {
    if (e.s <= s) {
      record = e;
    } else {
      break;
    }
  }

  const ds = s - record.s;
  return evalCubic(record.a, record.b, record.c, record.d, ds);
}

const SVG_PADDING_LEFT = 50;
const SVG_PADDING_RIGHT = 20;
const SVG_PADDING_TOP = 20;
const SVG_PADDING_BOTTOM = 30;
const CONTROL_POINT_RADIUS = 5;
const CURVE_SAMPLES = 200;

/**
 * SVG-based elevation profile graph editor.
 * Shows the elevation curve along the road with interactive control points.
 */
export function ElevationGraphEditor({
  elevations,
  roadLength,
  sPosition,
  onControlPointChange,
  onSPositionChange,
  className,
}: ElevationGraphEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<{
    index: number;
    startY: number;
    startA: number;
  } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [viewOffset, setViewOffset] = useState(0);
  const [viewScale, setViewScale] = useState(1);

  const svgWidth = 800;
  const svgHeight = 200;
  const plotWidth = svgWidth - SVG_PADDING_LEFT - SVG_PADDING_RIGHT;
  const plotHeight = svgHeight - SVG_PADDING_TOP - SVG_PADDING_BOTTOM;

  const visibleSStart = viewOffset;
  const visibleSEnd = viewOffset + roadLength / viewScale;

  const { zMin, zMax } = useMemo(() => {
    if (elevations.length === 0) return { zMin: -1, zMax: 1 };

    let min = Infinity;
    let max = -Infinity;
    const steps = Math.max(CURVE_SAMPLES, Math.ceil(roadLength));
    for (let i = 0; i <= steps; i++) {
      const s = (i / steps) * roadLength;
      const z = evaluateElevationAt(elevations, s);
      if (z < min) min = z;
      if (z > max) max = z;
    }

    const range = max - min;
    const pad = range > 0 ? range * 0.15 : 1;
    return { zMin: min - pad, zMax: max + pad };
  }, [elevations, roadLength]);

  const sToX = useCallback(
    (s: number) =>
      SVG_PADDING_LEFT + ((s - visibleSStart) / (visibleSEnd - visibleSStart)) * plotWidth,
    [visibleSStart, visibleSEnd, plotWidth],
  );

  const zToY = useCallback(
    (z: number) => {
      const zRange = zMax - zMin;
      if (zRange === 0) return SVG_PADDING_TOP + plotHeight / 2;
      return SVG_PADDING_TOP + (1 - (z - zMin) / zRange) * plotHeight;
    },
    [zMin, zMax, plotHeight],
  );

  const yToZ = useCallback(
    (y: number) => {
      const zRange = zMax - zMin;
      return zMax - ((y - SVG_PADDING_TOP) / plotHeight) * zRange;
    },
    [zMin, zMax, plotHeight],
  );

  const xToS = useCallback(
    (x: number) =>
      visibleSStart + ((x - SVG_PADDING_LEFT) / plotWidth) * (visibleSEnd - visibleSStart),
    [visibleSStart, visibleSEnd, plotWidth],
  );

  const curvePath = useMemo(() => {
    if (elevations.length === 0 || roadLength <= 0) return '';
    const points: string[] = [];
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const s = visibleSStart + (i / CURVE_SAMPLES) * (visibleSEnd - visibleSStart);
      if (s < 0 || s > roadLength) continue;
      const z = evaluateElevationAt(elevations, s);
      points.push(`${i === 0 ? 'M' : 'L'}${sToX(s).toFixed(2)},${zToY(z).toFixed(2)}`);
    }
    return points.join(' ');
  }, [elevations, roadLength, visibleSStart, visibleSEnd, sToX, zToY]);

  const areaPath = useMemo(() => {
    if (!curvePath) return '';
    const baseY = zToY(zMin);
    const startX = sToX(Math.max(visibleSStart, 0));
    const endX = sToX(Math.min(visibleSEnd, roadLength));
    return `${curvePath} L${endX.toFixed(2)},${baseY.toFixed(2)} L${startX.toFixed(2)},${baseY.toFixed(2)} Z`;
  }, [curvePath, zToY, sToX, zMin, visibleSStart, visibleSEnd, roadLength]);

  const { sGridLines, zGridLines } = useMemo(() => {
    const sRange = visibleSEnd - visibleSStart;
    const sStep = computeGridStep(sRange, 8);
    const sLines: number[] = [];
    for (let s = Math.ceil(visibleSStart / sStep) * sStep; s <= visibleSEnd; s += sStep) {
      sLines.push(s);
    }
    const zRange = zMax - zMin;
    const zStep = computeGridStep(zRange, 5);
    const zLines: number[] = [];
    for (let z = Math.ceil(zMin / zStep) * zStep; z <= zMax; z += zStep) {
      zLines.push(z);
    }
    return { sGridLines: sLines, zGridLines: zLines };
  }, [visibleSStart, visibleSEnd, zMin, zMax]);

  const handleControlPointMouseDown = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!onControlPointChange) return;
      setDragState({ index, startY: e.clientY, startA: elevations[index].a });
    },
    [elevations, onControlPointChange],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState || !svgRef.current || !onControlPointChange) return;
      const svgRect = svgRef.current.getBoundingClientRect();
      const svgY = ((e.clientY - svgRect.top) / svgRect.height) * svgHeight;
      onControlPointChange(dragState.index, yToZ(svgY));
    },
    [dragState, onControlPointChange, yToZ, svgHeight],
  );

  const handleMouseUp = useCallback(() => setDragState(null), []);

  const handleChartClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragState || !onSPositionChange || !svgRef.current) return;
      const svgRect = svgRef.current.getBoundingClientRect();
      const svgX = ((e.clientX - svgRect.left) / svgRect.width) * svgWidth;
      const s = xToS(svgX);
      if (s >= 0 && s <= roadLength) onSPositionChange(s);
    },
    [dragState, onSPositionChange, svgWidth, xToS, roadLength],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(1, Math.min(20, viewScale * zoomFactor));
        const visibleRange = roadLength / newScale;
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (svgRect) {
          const mouseRatio = (e.clientX - svgRect.left) / svgRect.width;
          const mouseS = visibleSStart + mouseRatio * (visibleSEnd - visibleSStart);
          setViewOffset(
            Math.max(0, Math.min(roadLength - visibleRange, mouseS - mouseRatio * visibleRange)),
          );
        }
        setViewScale(newScale);
      } else {
        const panAmount = (e.deltaX || e.deltaY) * ((roadLength / viewScale / plotWidth) * 2);
        const maxOffset = Math.max(0, roadLength - roadLength / viewScale);
        setViewOffset((prev) => Math.max(0, Math.min(maxOffset, prev + panAmount)));
      }
    },
    [viewScale, roadLength, visibleSStart, visibleSEnd, plotWidth],
  );

  const sIndicatorX = sToX(sPosition);
  const currentZ = evaluateElevationAt(elevations, sPosition);

  if (elevations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-[var(--color-text-muted)]">
        No elevation data
      </div>
    );
  }

  return (
    <div className={cn('w-full h-full', className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full select-none"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleChartClick}
        onWheel={handleWheel}
      >
        <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="var(--color-bg-deep, #09061A)" rx={4} />

        <defs>
          <clipPath id="elevation-plot-area">
            <rect x={SVG_PADDING_LEFT} y={SVG_PADDING_TOP} width={plotWidth} height={plotHeight} />
          </clipPath>
          <linearGradient id="elevation-fill-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-vivid)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--color-accent-vivid)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <g>
          {sGridLines.map((s) => {
            const x = sToX(s);
            return (
              <g key={`s-grid-${s}`}>
                <line x1={x} y1={SVG_PADDING_TOP} x2={x} y2={SVG_PADDING_TOP + plotHeight} stroke="rgba(180, 170, 230, 0.06)" strokeWidth={1} />
                <text x={x} y={svgHeight - 8} textAnchor="middle" fill="var(--color-text-tertiary)" fontSize={8} fontFamily="var(--font-mono)">
                  {s.toFixed(s % 1 === 0 ? 0 : 1)}
                </text>
              </g>
            );
          })}
          {zGridLines.map((z) => {
            const y = zToY(z);
            return (
              <g key={`z-grid-${z}`}>
                <line x1={SVG_PADDING_LEFT} y1={y} x2={SVG_PADDING_LEFT + plotWidth} y2={y} stroke="rgba(180, 170, 230, 0.06)" strokeWidth={1} />
                <text x={SVG_PADDING_LEFT - 6} y={y + 3} textAnchor="end" fill="var(--color-text-tertiary)" fontSize={8} fontFamily="var(--font-mono)">
                  {z.toFixed(z % 1 === 0 ? 0 : 1)}
                </text>
              </g>
            );
          })}
        </g>

        {/* Axis labels */}
        <text x={svgWidth / 2} y={svgHeight - 1} textAnchor="middle" fill="var(--color-text-tertiary)" fontSize={9} fontFamily="var(--font-display)" letterSpacing="0.08em">
          S (m)
        </text>
        <text x={10} y={svgHeight / 2} textAnchor="middle" fill="var(--color-text-tertiary)" fontSize={9} fontFamily="var(--font-display)" letterSpacing="0.08em" transform={`rotate(-90, 10, ${svgHeight / 2})`}>
          Z (m)
        </text>

        {/* Plot area border */}
        <rect x={SVG_PADDING_LEFT} y={SVG_PADDING_TOP} width={plotWidth} height={plotHeight} fill="none" stroke="rgba(180, 170, 230, 0.08)" strokeWidth={1} />

        {/* Clipped plot content */}
        <g clipPath="url(#elevation-plot-area)">
          {areaPath && <path d={areaPath} fill="url(#elevation-fill-gradient)" />}
          {curvePath && (
            <path d={curvePath} fill="none" stroke="var(--color-accent-vivid)" strokeWidth={1.5} strokeLinejoin="round" />
          )}

          {/* Current s-position indicator */}
          {sPosition >= visibleSStart && sPosition <= visibleSEnd && (
            <g>
              <line x1={sIndicatorX} y1={SVG_PADDING_TOP} x2={sIndicatorX} y2={SVG_PADDING_TOP + plotHeight} stroke="var(--color-primary)" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
              <circle cx={sIndicatorX} cy={zToY(currentZ)} r={3} fill="var(--color-primary)" stroke="var(--color-background)" strokeWidth={1} />
              <text x={sIndicatorX + 6} y={zToY(currentZ) - 6} fill="var(--color-primary)" fontSize={8} fontFamily="var(--font-mono)">
                z={currentZ.toFixed(2)}
              </text>
            </g>
          )}

          {/* Control points */}
          {elevations.map((elev, i) => {
            const x = sToX(elev.s);
            const y = zToY(elev.a);
            const isHovered = hoveredPoint === i;
            const isDragging = dragState?.index === i;
            const isActive = isHovered || isDragging;
            if (elev.s < visibleSStart || elev.s > visibleSEnd) return null;

            return (
              <g key={`cp-${i}`}>
                {isActive && (
                  <line x1={x} y1={y} x2={x} y2={SVG_PADDING_TOP + plotHeight} stroke="var(--color-accent-vivid)" strokeWidth={0.5} strokeDasharray="2 2" opacity={0.4} />
                )}
                <circle
                  cx={x} cy={y}
                  r={isActive ? CONTROL_POINT_RADIUS + 1 : CONTROL_POINT_RADIUS}
                  fill={isDragging ? 'var(--color-accent-vivid)' : isHovered ? 'var(--color-accent-bright)' : 'var(--color-glass-3)'}
                  stroke={isActive ? 'var(--color-accent-vivid)' : 'var(--color-glass-edge-bright)'}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={onControlPointChange ? 'cursor-grab' : 'cursor-default'}
                  style={isDragging ? { cursor: 'grabbing' } : undefined}
                  onMouseDown={(e) => handleControlPointMouseDown(i, e)}
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <title>s={elev.s.toFixed(2)}, a={elev.a.toFixed(3)}, b={elev.b.toFixed(3)}, c={elev.c.toFixed(3)}, d={elev.d.toFixed(3)}</title>
                </circle>
                {isActive && (
                  <g>
                    <rect x={x + 8} y={y - 20} width={70} height={16} rx={2} fill="var(--color-popover)" stroke="var(--color-glass-edge-mid)" strokeWidth={0.5} />
                    <text x={x + 12} y={y - 9} fill="var(--color-text-primary)" fontSize={8} fontFamily="var(--font-mono)">
                      s={elev.s.toFixed(1)} z={elev.a.toFixed(2)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {viewScale > 1 && (
          <text x={svgWidth - SVG_PADDING_RIGHT} y={SVG_PADDING_TOP - 6} textAnchor="end" fill="var(--color-text-tertiary)" fontSize={8} fontFamily="var(--font-mono)">
            {viewScale.toFixed(1)}x
          </text>
        )}
      </svg>
    </div>
  );
}

function computeGridStep(range: number, targetLines: number): number {
  if (range <= 0) return 1;
  const rawStep = range / targetLines;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  let niceStep: number;
  if (normalized <= 1) niceStep = 1;
  else if (normalized <= 2) niceStep = 2;
  else if (normalized <= 5) niceStep = 5;
  else niceStep = 10;
  return niceStep * magnitude;
}

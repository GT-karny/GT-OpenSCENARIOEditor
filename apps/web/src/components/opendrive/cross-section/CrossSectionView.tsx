import { useMemo, useCallback } from 'react';
import type { OdrLaneSection, OdrLane, OdrSuperelevation } from '@osce/shared';
import { cn } from '@/lib/utils';

/** Color mapping for OpenDRIVE lane types */
const LANE_TYPE_COLORS: Record<string, string> = {
  driving: 'rgba(120, 120, 140, 0.6)',
  shoulder: 'rgba(80, 160, 80, 0.5)',
  sidewalk: 'rgba(160, 160, 170, 0.5)',
  border: 'rgba(60, 60, 70, 0.7)',
  median: 'rgba(200, 180, 60, 0.5)',
  parking: 'rgba(100, 130, 200, 0.4)',
  biking: 'rgba(60, 180, 60, 0.4)',
  restricted: 'rgba(200, 80, 80, 0.4)',
  curb: 'rgba(80, 80, 90, 0.7)',
  stop: 'rgba(200, 60, 60, 0.5)',
  none: 'rgba(80, 80, 90, 0.3)',
};

/** Color mapping for road mark colors */
const ROAD_MARK_COLORS: Record<string, string> = {
  white: 'rgba(255, 255, 255, 0.9)',
  yellow: 'rgba(255, 210, 50, 0.9)',
  blue: 'rgba(80, 120, 240, 0.9)',
  red: 'rgba(220, 60, 60, 0.9)',
  green: 'rgba(60, 200, 60, 0.9)',
  standard: 'rgba(255, 255, 255, 0.9)',
};

interface LaneRenderData {
  lane: OdrLane;
  x: number;
  width: number;
  color: string;
}

interface CrossSectionViewProps {
  /** Lane section to render */
  laneSection: OdrLaneSection;
  /** S offset within the lane section (ds from section start) */
  dsFromSectionStart: number;
  /** Superelevation records for tilt visualization */
  superelevation?: OdrSuperelevation[];
  /** S position along the road (for evaluating superelevation) */
  sPosition?: number;
  /** Currently selected lane ID */
  selectedLaneId?: number | null;
  /** Callback when a lane is clicked */
  onLaneSelect?: (laneId: number) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Evaluate cubic polynomial: a + b*ds + c*ds^2 + d*ds^3
 */
function evalCubic(a: number, b: number, c: number, d: number, ds: number): number {
  return a + ds * (b + ds * (c + ds * d));
}

/**
 * Compute lane width at a given ds from section start.
 */
function computeWidth(lane: OdrLane, ds: number): number {
  if (lane.width.length === 0) return 0;

  let record = lane.width[0];
  for (const w of lane.width) {
    if (w.sOffset <= ds) {
      record = w;
    } else {
      break;
    }
  }

  const localDs = ds - record.sOffset;
  return evalCubic(record.a, record.b, record.c, record.d, localDs);
}

/**
 * Evaluate superelevation at a given s position.
 */
function evaluateSuperelevation(
  records: readonly OdrSuperelevation[],
  s: number,
): number {
  if (records.length === 0) return 0;

  let record = records[0];
  for (const r of records) {
    if (r.s <= s) {
      record = r;
    } else {
      break;
    }
  }

  const ds = s - record.s;
  return evalCubic(record.a, record.b, record.c, record.d, ds);
}

/**
 * SVG-based cross-section visualization of a road at a given s-position.
 * Renders lanes as colored rectangles with lane IDs and road marks.
 */
export function CrossSectionView({
  laneSection,
  dsFromSectionStart,
  superelevation,
  sPosition = 0,
  selectedLaneId,
  onLaneSelect,
  className,
}: CrossSectionViewProps) {
  const { lanes, totalWidth, maxLeftWidth } = useMemo(() => {
    const result: LaneRenderData[] = [];

    const sortedLeft = [...laneSection.leftLanes].sort((a, b) => a.id - b.id);
    const sortedRight = [...laneSection.rightLanes].sort((a, b) => b.id - a.id);

    let leftOffset = 0;
    for (const lane of sortedLeft) {
      const w = computeWidth(lane, dsFromSectionStart);
      result.push({
        lane,
        x: leftOffset,
        width: w,
        color: LANE_TYPE_COLORS[lane.type] ?? LANE_TYPE_COLORS.none,
      });
      leftOffset += w;
    }

    let rightOffset = 0;
    for (const lane of sortedRight) {
      const w = computeWidth(lane, dsFromSectionStart);
      result.push({
        lane,
        x: rightOffset,
        width: w,
        color: LANE_TYPE_COLORS[lane.type] ?? LANE_TYPE_COLORS.none,
      });
      rightOffset += w;
    }

    return {
      lanes: result,
      totalWidth: leftOffset + rightOffset,
      maxLeftWidth: leftOffset,
    };
  }, [laneSection, dsFromSectionStart]);

  const svgPadding = 40;
  const laneHeight = 60;
  const labelAreaHeight = 24;
  const tiltAreaHeight = 20;
  const svgWidth = 600;
  const svgHeight = laneHeight + labelAreaHeight * 2 + tiltAreaHeight;

  const contentWidth = svgWidth - svgPadding * 2;
  const scale = totalWidth > 0 ? contentWidth / totalWidth : 1;
  const centerX = svgPadding + maxLeftWidth * scale;
  const laneY = labelAreaHeight + tiltAreaHeight;

  const superElevAngle = useMemo(() => {
    if (!superelevation || superelevation.length === 0) return 0;
    return evaluateSuperelevation(superelevation, sPosition);
  }, [superelevation, sPosition]);

  const tiltDeg = superElevAngle * (180 / Math.PI) * 3;

  const handleLaneClick = useCallback(
    (laneId: number) => {
      onLaneSelect?.(laneId);
    },
    [onLaneSelect],
  );

  const getRoadMarkColor = (lane: OdrLane): string => {
    if (lane.roadMarks.length === 0) return 'rgba(255, 255, 255, 0.2)';
    let mark = lane.roadMarks[0];
    for (const rm of lane.roadMarks) {
      if (rm.sOffset <= dsFromSectionStart) mark = rm;
      else break;
    }
    return ROAD_MARK_COLORS[mark.color ?? 'standard'] ?? ROAD_MARK_COLORS.standard;
  };

  const getRoadMarkDash = (lane: OdrLane): string | undefined => {
    if (lane.roadMarks.length === 0) return undefined;
    let mark = lane.roadMarks[0];
    for (const rm of lane.roadMarks) {
      if (rm.sOffset <= dsFromSectionStart) mark = rm;
      else break;
    }
    if (mark.type === 'broken' || mark.type === 'broken broken') return '4 3';
    return undefined;
  };

  return (
    <div className={cn('w-full h-full', className)}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="var(--color-bg-deep, #09061A)" rx={4} />

        <line
          x1={svgPadding} y1={laneY + laneHeight / 2}
          x2={svgWidth - svgPadding} y2={laneY + laneHeight / 2}
          stroke="rgba(180, 170, 230, 0.04)" strokeWidth={1}
        />

        <g transform={`rotate(${tiltDeg}, ${centerX}, ${laneY + laneHeight / 2})`}>
          {/* Left lanes */}
          {lanes
            .filter((l) => l.lane.id > 0)
            .sort((a, b) => a.lane.id - b.lane.id)
            .map((laneData) => {
              const sortedLeft = [...laneSection.leftLanes].sort((a, b) => a.id - b.id);
              let cumOffset = 0;
              for (const l of sortedLeft) {
                if (l.id < laneData.lane.id) cumOffset += computeWidth(l, dsFromSectionStart);
              }
              const x = centerX - (cumOffset + laneData.width) * scale;
              const w = laneData.width * scale;
              const isSelected = selectedLaneId === laneData.lane.id;

              return (
                <g key={`lane-${laneData.lane.id}`}>
                  <rect
                    x={x} y={laneY} width={Math.max(w, 1)} height={laneHeight}
                    fill={laneData.color}
                    stroke={isSelected ? 'var(--color-accent-vivid)' : 'rgba(180, 170, 230, 0.1)'}
                    strokeWidth={isSelected ? 2 : 0.5}
                    className="cursor-pointer transition-all duration-150"
                    onClick={() => handleLaneClick(laneData.lane.id)}
                  >
                    <title>Lane {laneData.lane.id} ({laneData.lane.type})</title>
                  </rect>
                  <line
                    x1={x} y1={laneY} x2={x} y2={laneY + laneHeight}
                    stroke={getRoadMarkColor(laneData.lane)} strokeWidth={1.5}
                    strokeDasharray={getRoadMarkDash(laneData.lane)}
                  />
                  <text
                    x={x + w / 2} y={laneY + laneHeight + 14} textAnchor="middle"
                    fill={isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)'}
                    fontSize={9} fontFamily="var(--font-mono)"
                  >
                    {laneData.lane.id}
                  </text>
                  {w > 30 && (
                    <text
                      x={x + w / 2} y={laneY + laneHeight / 2 + 3} textAnchor="middle"
                      fill="rgba(255, 255, 255, 0.5)" fontSize={7} fontFamily="var(--font-body)"
                    >
                      {laneData.lane.type}
                    </text>
                  )}
                </g>
              );
            })}

          {/* Right lanes */}
          {lanes
            .filter((l) => l.lane.id < 0)
            .sort((a, b) => b.lane.id - a.lane.id)
            .map((laneData) => {
              const sortedRight = [...laneSection.rightLanes].sort((a, b) => b.id - a.id);
              let cumOffset = 0;
              for (const l of sortedRight) {
                if (l.id > laneData.lane.id) cumOffset += computeWidth(l, dsFromSectionStart);
              }
              const x = centerX + cumOffset * scale;
              const w = laneData.width * scale;
              const isSelected = selectedLaneId === laneData.lane.id;

              return (
                <g key={`lane-${laneData.lane.id}`}>
                  <rect
                    x={x} y={laneY} width={Math.max(w, 1)} height={laneHeight}
                    fill={laneData.color}
                    stroke={isSelected ? 'var(--color-accent-vivid)' : 'rgba(180, 170, 230, 0.1)'}
                    strokeWidth={isSelected ? 2 : 0.5}
                    className="cursor-pointer transition-all duration-150"
                    onClick={() => handleLaneClick(laneData.lane.id)}
                  >
                    <title>Lane {laneData.lane.id} ({laneData.lane.type})</title>
                  </rect>
                  <line
                    x1={x + w} y1={laneY} x2={x + w} y2={laneY + laneHeight}
                    stroke={getRoadMarkColor(laneData.lane)} strokeWidth={1.5}
                    strokeDasharray={getRoadMarkDash(laneData.lane)}
                  />
                  <text
                    x={x + w / 2} y={laneY + laneHeight + 14} textAnchor="middle"
                    fill={isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)'}
                    fontSize={9} fontFamily="var(--font-mono)"
                  >
                    {laneData.lane.id}
                  </text>
                  {w > 30 && (
                    <text
                      x={x + w / 2} y={laneY + laneHeight / 2 + 3} textAnchor="middle"
                      fill="rgba(255, 255, 255, 0.5)" fontSize={7} fontFamily="var(--font-body)"
                    >
                      {laneData.lane.type}
                    </text>
                  )}
                </g>
              );
            })}

          {/* Center lane reference line */}
          <line
            x1={centerX} y1={laneY - 4} x2={centerX} y2={laneY + laneHeight + 4}
            stroke="var(--color-accent-vivid)" strokeWidth={2} strokeDasharray="3 2"
          />
          <text
            x={centerX} y={laneY + laneHeight + 14} textAnchor="middle"
            fill="var(--color-accent-vivid)" fontSize={9} fontFamily="var(--font-mono)" fontWeight={600}
          >
            0
          </text>
          <rect
            x={centerX - 4} y={laneY} width={8} height={laneHeight}
            fill="transparent" className="cursor-pointer"
            onClick={() => handleLaneClick(0)}
          >
            <title>Center Lane (id=0)</title>
          </rect>
        </g>

        {/* Superelevation indicator */}
        {Math.abs(superElevAngle) > 0.001 && (
          <text
            x={svgWidth - svgPadding} y={12} textAnchor="end"
            fill="var(--color-text-tertiary)" fontSize={8} fontFamily="var(--font-mono)"
          >
            tilt: {(superElevAngle * (180 / Math.PI)).toFixed(2)}°
          </text>
        )}

        <text
          x={svgPadding + 4} y={12}
          fill="var(--color-text-tertiary)" fontSize={8} fontFamily="var(--font-display)" letterSpacing="0.08em"
        >
          LEFT
        </text>
        <text
          x={svgWidth - svgPadding - 4} y={svgHeight - 4} textAnchor="end"
          fill="var(--color-text-tertiary)" fontSize={8} fontFamily="var(--font-display)" letterSpacing="0.08em"
        >
          RIGHT
        </text>
      </svg>
    </div>
  );
}

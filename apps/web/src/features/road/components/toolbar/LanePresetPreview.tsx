/**
 * SVG cross-section preview for a lane preset.
 * Draws lane rectangles color-coded by type with a center line.
 */

import type { ReactElement } from 'react';

interface LanePresetPreviewProps {
  leftLanes: Array<{ type: string; width: number }>;
  rightLanes: Array<{ type: string; width: number }>;
  className?: string;
}

const LANE_COLORS: Record<string, string> = {
  driving: '#5a6a8a',
  shoulder: '#3a4a5a',
  sidewalk: '#7a7a6a',
  border: '#2a2a3a',
};

function getLaneColor(type: string): string {
  return LANE_COLORS[type] ?? '#4a4a5a';
}

export function LanePresetPreview({ leftLanes, rightLanes, className }: LanePresetPreviewProps) {
  const totalLeftWidth = leftLanes.reduce((sum, l) => sum + l.width, 0);
  const totalRightWidth = rightLanes.reduce((sum, l) => sum + l.width, 0);
  const totalWidth = totalLeftWidth + totalRightWidth;
  if (totalWidth === 0) return null;

  const svgWidth = 160;
  const svgHeight = 32;
  const padding = 4;
  const laneHeight = svgHeight - padding * 2;
  const scale = (svgWidth - padding * 2) / totalWidth;

  const centerX = padding + totalLeftWidth * scale;

  // Left lanes (drawn from center outward)
  const leftRects: ReactElement[] = [];
  let x = centerX;
  for (let i = 0; i < leftLanes.length; i++) {
    const lane = leftLanes[i];
    const w = lane.width * scale;
    x -= w;
    leftRects.push(
      <rect
        key={`left-${i}`}
        x={x}
        y={padding}
        width={w}
        height={laneHeight}
        fill={getLaneColor(lane.type)}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={0.5}
      />,
    );
  }

  // Right lanes (drawn from center outward)
  const rightRects: ReactElement[] = [];
  x = centerX;
  for (let i = 0; i < rightLanes.length; i++) {
    const lane = rightLanes[i];
    const w = lane.width * scale;
    rightRects.push(
      <rect
        key={`right-${i}`}
        x={x}
        y={padding}
        width={w}
        height={laneHeight}
        fill={getLaneColor(lane.type)}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={0.5}
      />,
    );
    x += w;
  }

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className={className}
    >
      {leftRects}
      {rightRects}
      {/* Center line */}
      <line
        x1={centerX}
        y1={padding - 1}
        x2={centerX}
        y2={svgHeight - padding + 1}
        stroke="#c4a832"
        strokeWidth={1.5}
      />
    </svg>
  );
}

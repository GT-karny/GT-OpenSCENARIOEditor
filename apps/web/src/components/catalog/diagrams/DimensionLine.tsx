import type { HighlightKey } from './types';
import { fmt } from './svg-utils';

interface DimensionLineProps {
  /** Start point (SVG coords) */
  x1: number;
  y1: number;
  /** End point (SVG coords) */
  x2: number;
  y2: number;
  /** The value in meters */
  value: number;
  /** Offset perpendicular to the line for extension lines (SVG px) */
  offset?: number;
  /** Extension line length beyond the measurement line (SVG px) */
  extensionExtra?: number;
  /** Label side relative to line direction */
  labelSide?: 'start' | 'end';
  /** Highlight key for hover interaction */
  highlightKey?: HighlightKey;
  highlighted?: HighlightKey;
  onHighlight?: (key: HighlightKey) => void;
}

const ARROW_SIZE = 4;

export function DimensionLine({
  x1,
  y1,
  x2,
  y2,
  value,
  offset = 0,
  extensionExtra = 4,
  highlightKey,
  highlighted,
  onHighlight,
}: DimensionLineProps) {
  const isActive = highlightKey != null && highlighted === highlightKey;

  const stroke = isActive ? '#9B84E8' : 'rgba(255,255,255,0.20)';
  const textFill = isActive ? '#B8ABEB' : 'rgba(255,255,255,0.50)';

  // Direction vector
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;

  // Normal perpendicular to the line
  const nx = -dy / len;
  const ny = dx / len;

  // Extension line endpoints (from object surface to dimension line)
  const ext1Start = { x: x1, y: y1 };
  const ext1End = { x: x1 + nx * (offset + extensionExtra), y: y1 + ny * (offset + extensionExtra) };
  const ext2Start = { x: x2, y: y2 };
  const ext2End = { x: x2 + nx * (offset + extensionExtra), y: y2 + ny * (offset + extensionExtra) };

  // Dimension line endpoints (at the offset distance)
  const d1 = { x: x1 + nx * offset, y: y1 + ny * offset };
  const d2 = { x: x2 + nx * offset, y: y2 + ny * offset };

  // Arrowhead points
  const ux = dx / len;
  const uy = dy / len;
  const arrow1 = [
    `${d1.x},${d1.y}`,
    `${d1.x + ux * ARROW_SIZE + nx * ARROW_SIZE * 0.4},${d1.y + uy * ARROW_SIZE + ny * ARROW_SIZE * 0.4}`,
    `${d1.x + ux * ARROW_SIZE - nx * ARROW_SIZE * 0.4},${d1.y + uy * ARROW_SIZE - ny * ARROW_SIZE * 0.4}`,
  ].join(' ');
  const arrow2 = [
    `${d2.x},${d2.y}`,
    `${d2.x - ux * ARROW_SIZE + nx * ARROW_SIZE * 0.4},${d2.y - uy * ARROW_SIZE + ny * ARROW_SIZE * 0.4}`,
    `${d2.x - ux * ARROW_SIZE - nx * ARROW_SIZE * 0.4},${d2.y - uy * ARROW_SIZE - ny * ARROW_SIZE * 0.4}`,
  ].join(' ');

  // Label position at midpoint, offset slightly along normal
  const midX = (d1.x + d2.x) / 2;
  const midY = (d1.y + d2.y) / 2;
  const isVertical = Math.abs(dx) < Math.abs(dy);
  const labelOffset = isVertical ? 12 : 10;
  const labelX = midX + nx * labelOffset;
  const labelY = midY + ny * labelOffset;

  const textRotation = isVertical ? -90 : 0;

  return (
    <g
      data-highlight-key={highlightKey}
      onMouseEnter={() => onHighlight?.(highlightKey ?? null)}
      onMouseLeave={() => onHighlight?.(null)}
      style={{ cursor: 'default' }}
    >
      {/* Extension lines */}
      {offset > 0 && (
        <>
          <line
            x1={ext1Start.x}
            y1={ext1Start.y}
            x2={ext1End.x}
            y2={ext1End.y}
            stroke={stroke}
            strokeWidth={0.5}
            strokeDasharray="2,2"
          />
          <line
            x1={ext2Start.x}
            y1={ext2Start.y}
            x2={ext2End.x}
            y2={ext2End.y}
            stroke={stroke}
            strokeWidth={0.5}
            strokeDasharray="2,2"
          />
        </>
      )}

      {/* Dimension line */}
      <line
        x1={d1.x}
        y1={d1.y}
        x2={d2.x}
        y2={d2.y}
        stroke={stroke}
        strokeWidth={isActive ? 1.2 : 0.8}
      />

      {/* Arrowheads */}
      <polygon points={arrow1} fill={stroke} />
      <polygon points={arrow2} fill={stroke} />

      {/* Value label */}
      <text
        x={labelX}
        y={labelY}
        fill={textFill}
        fontSize={9}
        fontFamily="var(--font-mono, monospace)"
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(${textRotation}, ${labelX}, ${labelY})`}
      >
        {fmt(value)}
      </text>
    </g>
  );
}

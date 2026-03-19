/**
 * SVG front-view preview of a signal assembly.
 * Shows the pole, optional arm, and all signal heads.
 * Interactive: click a head to select it, buttons to add/remove.
 */

import type { OdrSignal } from '@osce/shared';
import type { SignalAssemblyMetadata } from '@osce/opendrive-engine';
import { Button } from '../../ui/button';

interface SignalAssemblyPreviewProps {
  assembly: SignalAssemblyMetadata;
  signals: OdrSignal[];
  selectedHeadId?: string;
  onSelectHead: (signalId: string) => void;
  onAddHead: () => void;
  onRemoveHead: (signalId: string) => void;
  onChangePoleType: (poleType: 'straight' | 'arm') => void;
}

// Layout constants for the SVG preview
const SVG_WIDTH = 200;
const SVG_HEIGHT = 250;
const POLE_X = 100;
const POLE_TOP = 30;
const POLE_BOTTOM = 210;
const HEAD_WIDTH = 24;
const HEAD_HEIGHT = 40;
const ARM_LENGTH_PX = 60;

/** Color mapping for head positions. */
const POSITION_COLORS: Record<string, string> = {
  top: 'var(--color-accent)',
  arm: 'var(--color-info)',
  lower: 'var(--color-warning)',
};

export function SignalAssemblyPreview({
  assembly,
  signals,
  selectedHeadId,
  onSelectHead,
  onAddHead,
  onRemoveHead,
  onChangePoleType,
}: SignalAssemblyPreviewProps) {
  const isArm = assembly.poleType === 'arm';

  // Map signal IDs to head positions for rendering
  const heads = assembly.headPositions.map((hp) => {
    const signal = signals.find((s) => s.id === hp.signalId);
    return { ...hp, signal };
  });

  // Compute Y positions for heads
  const getHeadY = (position: string, index: number): number => {
    switch (position) {
      case 'top':
        return POLE_TOP + 10;
      case 'arm':
        return POLE_TOP + 10;
      case 'lower':
        return POLE_TOP + 60 + index * 50;
      default:
        return POLE_TOP + 30 + index * 50;
    }
  };

  const getHeadX = (position: string): number => {
    if (position === 'arm' && isArm) {
      return POLE_X + ARM_LENGTH_PX;
    }
    return POLE_X;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
          Assembly Preview
        </h3>
        <select
          value={assembly.poleType}
          onChange={(e) => onChangePoleType(e.target.value as 'straight' | 'arm')}
          className="h-6 text-xs bg-[var(--color-glass-1)] text-[var(--color-text-primary)] border border-[var(--color-glass-edge)] rounded-none px-1"
        >
          <option value="straight">Straight</option>
          <option value="arm">Arm</option>
        </select>
      </div>

      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)]"
      >
        {/* Ground line */}
        <line
          x1={POLE_X - 30}
          y1={POLE_BOTTOM + 10}
          x2={POLE_X + 30}
          y2={POLE_BOTTOM + 10}
          stroke="var(--color-glass-edge)"
          strokeWidth={2}
        />

        {/* Vertical pole */}
        <line
          x1={POLE_X}
          y1={POLE_TOP}
          x2={POLE_X}
          y2={POLE_BOTTOM + 10}
          stroke="var(--color-text-secondary)"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Horizontal arm (if arm type) */}
        {isArm && (
          <line
            x1={POLE_X}
            y1={POLE_TOP}
            x2={POLE_X + ARM_LENGTH_PX}
            y2={POLE_TOP}
            stroke="var(--color-text-secondary)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {/* Signal heads */}
        {heads.map((head, i) => {
          const hx = getHeadX(head.position);
          const hy = getHeadY(head.position, i);
          const isSelected = head.signalId === selectedHeadId;
          const fillColor = POSITION_COLORS[head.position] ?? 'var(--color-text-secondary)';

          return (
            <g
              key={head.signalId}
              onClick={() => onSelectHead(head.signalId)}
              style={{ cursor: 'pointer' }}
            >
              {/* Selection highlight */}
              {isSelected && (
                <rect
                  x={hx - HEAD_WIDTH / 2 - 3}
                  y={hy - HEAD_HEIGHT / 2 - 3}
                  width={HEAD_WIDTH + 6}
                  height={HEAD_HEIGHT + 6}
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />
              )}

              {/* Head housing */}
              <rect
                x={hx - HEAD_WIDTH / 2}
                y={hy - HEAD_HEIGHT / 2}
                width={HEAD_WIDTH}
                height={HEAD_HEIGHT}
                rx={2}
                fill="var(--color-glass-2)"
                stroke={fillColor}
                strokeWidth={1.5}
              />

              {/* Bulb indicators (simplified: 3 circles for standard traffic light) */}
              <circle cx={hx} cy={hy - 12} r={4} fill="#FF4444" opacity={0.8} />
              <circle cx={hx} cy={hy} r={4} fill="#FFAA00" opacity={0.8} />
              <circle cx={hx} cy={hy + 12} r={4} fill="#44CC44" opacity={0.8} />

              {/* Position label */}
              <text
                x={hx + HEAD_WIDTH / 2 + 6}
                y={hy + 3}
                fill="var(--color-text-secondary)"
                fontSize={9}
                fontFamily="monospace"
              >
                {head.position}
              </text>
            </g>
          );
        })}

        {/* Empty state hint */}
        {heads.length === 0 && (
          <text
            x={SVG_WIDTH / 2}
            y={SVG_HEIGHT / 2}
            textAnchor="middle"
            fill="var(--color-text-secondary)"
            fontSize={11}
          >
            No signal heads
          </text>
        )}
      </svg>

      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-6 text-xs rounded-none"
          onClick={onAddHead}
        >
          Add Head
        </Button>
        {selectedHeadId && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs rounded-none text-[var(--color-danger)]"
            onClick={() => onRemoveHead(selectedHeadId)}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

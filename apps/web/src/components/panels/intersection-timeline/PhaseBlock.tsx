/**
 * Individual phase block in the timeline — width proportional to duration,
 * colored by dominant signal state using inline styles.
 */

import { memo } from 'react';
import type { TrafficSignalPhase } from '@osce/shared';
import { phaseBlockColor } from '../../../lib/phase-color';

interface PhaseBlockProps {
  phase: TrafficSignalPhase;
  totalDuration: number;
  isSelected: boolean;
  isActive: boolean;
  onClick: () => void;
}

export const PhaseBlock = memo(function PhaseBlock({
  phase,
  totalDuration,
  isSelected,
  isActive,
  onClick,
}: PhaseBlockProps) {
  const widthPercent = totalDuration > 0 ? (phase.duration / totalDuration) * 100 : 0;
  const colors = phaseBlockColor(phase.trafficSignalStates);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative h-full overflow-hidden rounded-none transition-all
        ${isSelected ? 'ring-1 ring-[var(--color-accent)] glow-sm' : ''}
      `}
      style={{
        width: `${widthPercent}%`,
        minWidth: widthPercent > 0 ? 4 : 0,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: colors.border,
        filter: isActive ? 'brightness(1.25)' : undefined,
      }}
    >
      <div className="flex flex-col items-center justify-center h-full px-1 gap-0">
        <span
          className="text-[10px] font-medium truncate max-w-full leading-tight"
          style={{ color: colors.label }}
        >
          {phase.name}
        </span>
        <span className="text-[9px] text-[var(--color-text-secondary)] leading-tight">
          {phase.duration}s
        </span>
      </div>
    </button>
  );
});

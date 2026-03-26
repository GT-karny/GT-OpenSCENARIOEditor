/**
 * Scrollable viewport containing signal icon column, time ruler, and phase tracks.
 */

import { memo, useCallback, useRef } from 'react';
import type { TrafficSignalController } from '@osce/shared';
import type { SignalDescriptor } from '@osce/3d-viewer';
import { ControllerRow } from './ControllerRow';
import { TimelinePlayhead } from './TimelinePlayhead';
import type { SelectedPhase } from '../../../hooks/use-signal-timeline';

interface TimelineViewportProps {
  controllers: TrafficSignalController[];
  currentTime: number;
  totalDuration: number;
  selectedPhase: SelectedPhase | null;
  onSelectPhase: (phase: SelectedPhase | null) => void;
  onSeek: (time: number) => void;
  signalDescriptors: Map<string, SignalDescriptor>;
  defaultDescriptor: SignalDescriptor;
}

/** Time ruler with tick marks */
function TimeRuler({ totalDuration }: { totalDuration: number }) {
  if (totalDuration <= 0) return null;

  // Determine tick interval: aim for 5-15 ticks
  let interval = 5;
  if (totalDuration > 120) interval = 30;
  else if (totalDuration > 60) interval = 15;
  else if (totalDuration > 30) interval = 10;

  const ticks: number[] = [];
  for (let t = 0; t <= totalDuration; t += interval) {
    ticks.push(t);
  }

  return (
    <div className="flex items-end h-4 relative ml-[120px] mr-0.5 border-b border-[var(--color-glass-edge)]">
      {ticks.map((t) => {
        const left = (t / totalDuration) * 100;
        return (
          <div
            key={t}
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: `${left}%` }}
          >
            <span className="text-[8px] text-[var(--color-text-secondary)] font-mono tabular-nums leading-none mb-0.5">
              {t}s
            </span>
            <div className="w-[1px] h-1 bg-[var(--color-glass-edge)]" />
          </div>
        );
      })}
    </div>
  );
}

export const TimelineViewport = memo(function TimelineViewport({
  controllers,
  currentTime,
  totalDuration,
  selectedPhase,
  onSelectPhase,
  onSeek,
  signalDescriptors,
  defaultDescriptor,
}: TimelineViewportProps) {
  const trackAreaRef = useRef<HTMLDivElement>(null);

  // Click on track area background to seek
  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (totalDuration <= 0) return;
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      // Account for the left label column (120px)
      const trackLeft = rect.left + 120;
      const trackWidth = rect.width - 120;
      if (e.clientX < trackLeft) return;
      const ratio = Math.max(0, Math.min(1, (e.clientX - trackLeft) / trackWidth));
      onSeek(ratio * totalDuration);
    },
    [totalDuration, onSeek],
  );

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <TimeRuler totalDuration={totalDuration} />

      <div
        ref={trackAreaRef}
        className="relative"
        onClick={handleTrackClick}
      >
        {/* Playhead overlays the track area */}
        <div className="absolute top-0 bottom-0 left-[120px] right-0.5">
          <TimelinePlayhead
            currentTime={currentTime}
            totalDuration={totalDuration}
            onSeek={onSeek}
          />
        </div>

        {/* Controller rows */}
        {controllers.map((ctrl) => (
          <ControllerRow
            key={ctrl.id}
            controller={ctrl}
            currentTime={currentTime}
            selectedPhase={selectedPhase}
            onSelectPhase={onSelectPhase}
            signalDescriptors={signalDescriptors}
            defaultDescriptor={defaultDescriptor}
          />
        ))}

        {controllers.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-[var(--color-text-secondary)]">
            No traffic signal controllers defined
          </div>
        )}
      </div>
    </div>
  );
});

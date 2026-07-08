/**
 * Draggable playhead vertical line for the timeline.
 */

import { memo, useCallback, useRef } from 'react';

interface TimelinePlayheadProps {
  currentTime: number;
  totalDuration: number;
  onSeek: (time: number) => void;
}

export const TimelinePlayhead = memo(function TimelinePlayhead({
  currentTime,
  totalDuration,
  onSeek,
}: TimelinePlayheadProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const leftPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const container = containerRef.current?.parentElement;
      if (!container || totalDuration <= 0) return;

      const updateTime = (clientX: number) => {
        const rect = container.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        onSeek(ratio * totalDuration);
      };

      updateTime(e.clientX);

      const onMove = (ev: PointerEvent) => updateTime(ev.clientX);
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [totalDuration, onSeek],
  );

  return (
    <div
      ref={containerRef}
      className="absolute top-0 bottom-0 z-10 pointer-events-none"
      style={{ left: `${leftPercent}%` }}
    >
      {/* Handle (draggable) */}
      <div
        className="absolute -top-1 -left-[5px] w-[10px] h-3 bg-[var(--color-accent)] pointer-events-auto cursor-ew-resize"
        style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
        onPointerDown={handlePointerDown}
      />
      {/* Line */}
      <div className="absolute top-2 bottom-0 left-0 w-[2px] bg-[var(--color-accent)] opacity-80" />
    </div>
  );
});

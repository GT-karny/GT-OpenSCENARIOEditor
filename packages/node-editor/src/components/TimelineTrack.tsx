/**
 * Per-entity horizontal track in the timeline.
 */

import { TimelineEvent, type TimelineEventData } from './TimelineEvent.js';
import type { TimeAxisConfig } from '../utils/compute-time-axis.js';
import { ENTITY_LABEL_WIDTH } from '../utils/timeline-constants.js';

export interface TimelineTrackProps {
  entityName: string;
  entityType: string;
  events: TimelineEventData[];
  onEventClick: (eventId: string) => void;
  pixelsPerSecond: number;
  timeAxisConfig: TimeAxisConfig;
}

export function TimelineTrack({
  entityName,
  entityType,
  events,
  onEventClick,
  pixelsPerSecond,
  timeAxisConfig,
}: TimelineTrackProps) {
  const gridSize = timeAxisConfig.tickInterval * pixelsPerSecond;

  return (
    <div
      className="flex"
      style={{ borderBottom: '1px solid var(--color-glass-edge, rgba(180, 170, 230, 0.07))' }}
    >
      {/* Entity label */}
      <div
        className="shrink-0 px-2 py-2"
        style={{
          width: ENTITY_LABEL_WIDTH,
          background: 'var(--color-glass-1, rgba(20, 14, 48, 0.48))',
          borderRight: '1px solid var(--color-glass-edge, rgba(180, 170, 230, 0.07))',
        }}
      >
        <div
          className="truncate"
          style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary, rgba(255, 255, 255, 0.48))' }}
        >
          {entityName}
        </div>
        <div style={{ fontSize: 9, color: 'var(--color-text-tertiary, rgba(255, 255, 255, 0.20))' }}>
          {entityType}
        </div>
      </div>

      {/* Event area with vertical grid lines */}
      <div
        className="relative flex-1 h-12 overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, var(--color-glass-edge, rgba(180, 170, 230, 0.07)) 0px, var(--color-glass-edge, rgba(180, 170, 230, 0.07)) 1px, transparent 1px, transparent ${gridSize}px)`,
          backgroundSize: `${gridSize}px 100%`,
        }}
      >
        <div className="relative h-full" style={{ width: timeAxisConfig.totalWidth }}>
          {events.map((event) => (
            <TimelineEvent
              key={event.eventId}
              event={event}
              onClick={onEventClick}
              pixelsPerSecond={pixelsPerSecond}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

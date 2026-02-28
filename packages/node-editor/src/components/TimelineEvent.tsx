/**
 * Clickable event block in the timeline with APEX glass styling.
 */

import { useState, type CSSProperties } from 'react';
import { getActionTypeLabel } from '../utils/action-display.js';
import { MIN_EVENT_WIDTH } from '../utils/timeline-constants.js';

export interface TimelineEventData {
  eventId: string;
  eventName: string;
  actionTypes: string[];
  startTime: number | null;
  selected: boolean;
}

export interface TimelineEventProps {
  event: TimelineEventData;
  onClick: (eventId: string) => void;
  pixelsPerSecond: number;
}

const selectedStyle: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(155, 132, 232, 0.25), rgba(123, 136, 232, 0.18))',
  borderColor: 'var(--color-glass-edge-bright, rgba(190, 180, 240, 0.22))',
  color: 'var(--color-text-primary, rgba(255, 255, 255, 0.93))',
  boxShadow: '0 0 8px rgba(155, 132, 232, 0.15)',
};

const unselectedStyle: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(155, 132, 232, 0.10), rgba(123, 136, 232, 0.06))',
  borderColor: 'var(--color-glass-edge, rgba(180, 170, 230, 0.07))',
  color: 'var(--color-text-secondary, rgba(255, 255, 255, 0.48))',
};

const hoverStyle: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(155, 132, 232, 0.18), rgba(123, 136, 232, 0.12))',
  borderColor: 'var(--color-glass-edge-bright, rgba(190, 180, 240, 0.15))',
  color: 'var(--color-text-primary, rgba(255, 255, 255, 0.93))',
};

export function TimelineEvent({ event, onClick, pixelsPerSecond }: TimelineEventProps) {
  const [hovered, setHovered] = useState(false);
  const width = Math.max(MIN_EVENT_WIDTH, event.actionTypes.length * 30);
  const left = event.startTime != null ? event.startTime * pixelsPerSecond : 0;

  const resolvedStyle = event.selected
    ? selectedStyle
    : hovered
      ? hoverStyle
      : unselectedStyle;

  return (
    <button
      onClick={() => onClick(event.eventId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="absolute h-8 rounded text-[10px] px-2 flex items-center gap-1 border transition-colors cursor-pointer truncate"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        top: '50%',
        transform: 'translateY(-50%)',
        ...resolvedStyle,
      }}
      title={event.eventName}
    >
      <span className="font-medium truncate">{event.eventName}</span>
      {event.actionTypes.length > 0 && (
        <span className="truncate" style={{ opacity: 0.6 }}>
          [{event.actionTypes.map(getActionTypeLabel).join(', ')}]
        </span>
      )}
    </button>
  );
}

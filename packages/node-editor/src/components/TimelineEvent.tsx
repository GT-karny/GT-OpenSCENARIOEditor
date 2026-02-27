/**
 * Clickable event block in the timeline.
 */

import { getActionTypeLabel } from '../utils/action-display.js';

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

export function TimelineEvent({ event, onClick, pixelsPerSecond }: TimelineEventProps) {
  const width = Math.max(80, (event.actionTypes.length * 30));
  const left = event.startTime != null ? event.startTime * pixelsPerSecond : 0;

  return (
    <button
      onClick={() => onClick(event.eventId)}
      className={`
        absolute h-8 rounded text-[10px] px-2 flex items-center gap-1
        border transition-colors cursor-pointer truncate
        ${event.selected
          ? 'bg-blue-100 border-blue-500 text-blue-800'
          : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
        }
      `}
      style={{ left: `${left}px`, width: `${width}px` }}
      title={event.eventName}
    >
      <span className="font-medium truncate">{event.eventName}</span>
      {event.actionTypes.length > 0 && (
        <span className="opacity-60 truncate">
          [{event.actionTypes.map(getActionTypeLabel).join(', ')}]
        </span>
      )}
    </button>
  );
}

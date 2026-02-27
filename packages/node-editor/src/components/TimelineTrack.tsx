/**
 * Per-entity horizontal track in the timeline.
 */

import { TimelineEvent, type TimelineEventData } from './TimelineEvent.js';

export interface TimelineTrackProps {
  entityName: string;
  entityType: string;
  events: TimelineEventData[];
  onEventClick: (eventId: string) => void;
  pixelsPerSecond: number;
}

export function TimelineTrack({ entityName, entityType, events, onEventClick, pixelsPerSecond }: TimelineTrackProps) {
  return (
    <div className="flex border-b border-gray-200">
      <div className="w-32 shrink-0 px-2 py-2 bg-gray-50 border-r border-gray-200">
        <div className="text-xs font-semibold truncate">{entityName}</div>
        <div className="text-[10px] text-gray-400">{entityType}</div>
      </div>
      <div className="relative flex-1 h-12 overflow-hidden">
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
  );
}

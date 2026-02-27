/**
 * Timeline panel showing per-entity event tracks.
 */

import { useContext } from 'react';
import { EditorStoreContext } from './NodeEditorProvider.js';
import { TimelineTrack } from './TimelineTrack.js';
import { useTimelineData } from '../hooks/use-timeline-sync.js';

export interface TimelineViewProps {
  className?: string;
  pixelsPerSecond?: number;
}

export function TimelineView({ className, pixelsPerSecond = 40 }: TimelineViewProps) {
  const store = useContext(EditorStoreContext);
  const tracks = useTimelineData();

  const handleEventClick = (eventId: string) => {
    store?.getState().setSelectedElementIds([eventId]);
  };

  if (tracks.length === 0) {
    return (
      <div className={`p-4 text-sm text-gray-400 ${className ?? ''}`}>
        No entities in scenario
      </div>
    );
  }

  return (
    <div className={`flex flex-col border-t border-gray-300 overflow-auto ${className ?? ''}`}>
      {/* Time axis header */}
      <div className="flex border-b border-gray-300 bg-gray-50">
        <div className="w-32 shrink-0 px-2 py-1 text-[10px] font-medium text-gray-500 border-r border-gray-200">
          Entity
        </div>
        <div className="flex-1 px-2 py-1 text-[10px] font-medium text-gray-500">
          Time / Events →
        </div>
      </div>

      {/* Entity tracks */}
      {tracks.map((track) => (
        <TimelineTrack
          key={track.entityName}
          entityName={track.entityName}
          entityType={track.entityType}
          events={track.events}
          onEventClick={handleEventClick}
          pixelsPerSecond={pixelsPerSecond}
        />
      ))}
    </div>
  );
}

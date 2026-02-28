/**
 * Timeline panel showing per-entity event tracks with time axis ruler.
 */

import { useContext, useMemo } from 'react';
import { useTranslation } from '@osce/i18n';
import { EditorStoreContext } from './NodeEditorProvider.js';
import { TimelineRuler } from './TimelineRuler.js';
import { TimelineTrack } from './TimelineTrack.js';
import { useTimelineData } from '../hooks/use-timeline-sync.js';
import { computeTimeAxisConfig } from '../utils/compute-time-axis.js';

export interface TimelineViewProps {
  className?: string;
  pixelsPerSecond?: number;
}

export function TimelineView({ className, pixelsPerSecond = 40 }: TimelineViewProps) {
  const { t } = useTranslation('common');
  const store = useContext(EditorStoreContext);
  const tracks = useTimelineData();

  const timeAxisConfig = useMemo(
    () => computeTimeAxisConfig(tracks, pixelsPerSecond),
    [tracks, pixelsPerSecond],
  );

  const handleEventClick = (eventId: string) => {
    store?.getState().setSelectedElementIds([eventId]);
  };

  if (tracks.length === 0) {
    return (
      <div
        className={`p-4 text-sm ${className ?? ''}`}
        style={{ color: 'var(--color-text-secondary, rgba(255, 255, 255, 0.48))' }}
      >
        {t('timeline.noEntities')}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-auto ${className ?? ''}`}
      style={{ borderTop: '1px solid var(--color-glass-edge, rgba(180, 170, 230, 0.07))' }}
    >
      {/* Time axis ruler */}
      <TimelineRuler config={timeAxisConfig} />

      {/* Entity tracks */}
      {tracks.map((track) => (
        <TimelineTrack
          key={track.entityName}
          entityName={track.entityName}
          entityType={track.entityType}
          events={track.events}
          onEventClick={handleEventClick}
          pixelsPerSecond={pixelsPerSecond}
          timeAxisConfig={timeAxisConfig}
        />
      ))}
    </div>
  );
}

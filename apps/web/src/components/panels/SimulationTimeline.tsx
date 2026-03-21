import { useMemo, useCallback, useState, useRef } from 'react';
import { useTranslation } from '@osce/i18n';
import { Timer, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import type { StoryBoardEvent, StoryBoardElementType } from '@osce/shared';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useSimulationStore } from '../../stores/simulation-store';
import { useEditorStore } from '../../stores/editor-store';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import {
  buildIdToFullPathMap,
  getRunningIntervals,
  type RunningInterval,
} from '../../lib/fullpath-mapping';

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4] as const;

/** Color for each StoryBoard element type (matches node-editor color-map) */
const ELEMENT_TYPE_COLORS: Record<StoryBoardElementType, string> = {
  storyboard: '#94a3b8',
  story: '#7B88E8',
  act: '#9B84E8',
  maneuverGroup: '#B8ABEB',
  maneuver: '#D0C6F2',
  event: '#E8C942',
  action: '#E8A05A',
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
}

function IdleView() {
  const { t } = useTranslation('common');

  return (
    <div data-testid="simulation-timeline-idle" className="flex items-center justify-center py-4 shrink-0">
      <div className="text-center text-muted-foreground">
        <Timer className="mx-auto mb-2 h-8 w-8" />
        <p className="text-sm font-medium">{t('panels.timeline')}</p>
        <p className="text-xs mt-1">{t('labels.simulationPlayback')}</p>
      </div>
    </div>
  );
}

function RunningView() {
  const { t } = useTranslation('common');
  const frameCount = useSimulationStore((s) => s.frames.length);
  const frames = useSimulationStore((s) => s.frames);
  const currentTime = frames.length > 0 ? frames[frames.length - 1].time : 0;

  return (
    <div data-testid="simulation-timeline-running" className="flex items-center justify-center py-4 shrink-0">
      <div className="text-center text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--color-warning, #f59e0b)' }}
          />
          <span className="text-sm font-medium">{t('labels.simulating')}</span>
        </div>
        <p className="text-xs tabular-nums">
          {t('labels.frames', { count: frameCount })} | {formatTime(currentTime)}
        </p>
      </div>
    </div>
  );
}

/**
 * Running interval bar(s) overlaid on the seek bar area.
 * Shows when a hovered or selected element was in "running" state.
 */
function ElementIntervalOverlay({
  intervals,
  totalTime,
  variant,
}: {
  intervals: RunningInterval[];
  totalTime: number;
  variant: 'hover' | 'selected';
}) {
  if (intervals.length === 0 || totalTime <= 0) return null;

  const color = variant === 'selected' ? 'var(--color-accent-1, #9B84E8)' : 'rgba(52, 211, 153, 0.6)';
  const opacity = variant === 'selected' ? 0.35 : 0.25;

  return (
    <>
      {intervals.map((iv, i) => {
        const left = (iv.start / totalTime) * 100;
        const width = ((iv.end - iv.start) / totalTime) * 100;
        return (
          <div
            key={i}
            className="absolute top-0 h-full rounded-sm pointer-events-none"
            style={{
              left: `${left}%`,
              width: `${Math.max(width, 0.5)}%`,
              backgroundColor: color,
              opacity,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
        );
      })}
    </>
  );
}

/** Clustered marker for the event lane */
interface MarkerCluster {
  /** Position as fraction 0–1 */
  position: number;
  /** Primary color (from the highest-priority event in cluster) */
  color: string;
  /** Tooltip text */
  label: string;
  /** Timestamp for seek */
  timestamp: number;
  /** Number of events in this cluster */
  count: number;
}

/**
 * Event markers rendered below the seek bar.
 * Shows colored dots at each storyboard event timestamp.
 * Clusters events that fall within the same pixel.
 */
function EventMarkerLane({
  events,
  totalTime,
  onSeekToTime,
}: {
  events: StoryBoardEvent[];
  totalTime: number;
  onSeekToTime: (time: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCluster, setHoveredCluster] = useState<MarkerCluster | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Only show "running" state transitions — the most interesting moments
  const markers = useMemo(() => {
    if (totalTime <= 0 || events.length === 0) return [];

    // Filter to running/complete transitions (skip init/standby noise)
    const significant = events.filter(
      (e) => (e.state === 'running' || e.state === 'complete') && e.elementType !== 'storyboard',
    );

    // Cluster by position (group events within 1% of timeline)
    const clusterThreshold = 0.01;
    const clusters: MarkerCluster[] = [];

    for (const ev of significant) {
      const pos = ev.timestamp / totalTime;
      const existing = clusters.find((c) => Math.abs(c.position - pos) < clusterThreshold);
      if (existing) {
        existing.count++;
        existing.label += `\n${ev.name} → ${ev.state}`;
      } else {
        clusters.push({
          position: pos,
          color: ELEMENT_TYPE_COLORS[ev.elementType] ?? '#94a3b8',
          label: `${ev.name} → ${ev.state}`,
          timestamp: ev.timestamp,
          count: 1,
        });
      }
    }

    return clusters;
  }, [events, totalTime]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, cluster: MarkerCluster) => {
      setHoveredCluster(cluster);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    },
    [],
  );

  if (markers.length === 0) return null;

  return (
    <div ref={containerRef} className="relative h-2.5 mx-2">
      {markers.map((cluster, i) => (
        <button
          key={i}
          className="absolute top-0.5 -translate-x-1/2 rounded-full transition-transform hover:scale-150 cursor-pointer"
          style={{
            left: `${cluster.position * 100}%`,
            width: cluster.count > 1 ? 5 : 4,
            height: cluster.count > 1 ? 5 : 4,
            backgroundColor: cluster.color,
            boxShadow: `0 0 4px ${cluster.color}88`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSeekToTime(cluster.timestamp);
          }}
          onMouseMove={(e) => handleMouseMove(e, cluster)}
          onMouseLeave={() => setHoveredCluster(null)}
        />
      ))}
      {/* Tooltip */}
      {hoveredCluster && (
        <div
          className="fixed z-50 px-2 py-1 text-[9px] leading-tight rounded bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] text-[var(--color-text-primary)] pointer-events-none whitespace-pre max-w-[200px] truncate"
          style={{
            left: tooltipPos.x + 8,
            top: tooltipPos.y - 28,
          }}
        >
          {hoveredCluster.label}
          {hoveredCluster.count > 1 && ` (+${hoveredCluster.count - 1})`}
        </div>
      )}
    </div>
  );
}

function PlaybackControls() {
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const currentFrameIndex = useSimulationStore((s) => s.currentFrameIndex);
  const frames = useSimulationStore((s) => s.frames);
  const playbackSpeed = useSimulationStore((s) => s.playbackSpeed);
  const storyBoardEvents = useSimulationStore((s) => s.storyBoardEvents);
  const { play, pause, seekTo, setSpeed } = useSimulationStore.getState();

  // Editor selection state for reverse-lookup interval bars
  const hoveredElementId = useEditorStore((s) => s.selection.hoveredElementId);
  const selectedElementIds = useEditorStore((s) => s.selection.selectedElementIds);
  const scenarioStoreApi = useScenarioStoreApi();

  const totalFrames = frames.length;
  const currentTime = totalFrames > 0 ? (frames[currentFrameIndex]?.time ?? 0) : 0;
  const totalTime = totalFrames > 0 ? (frames[totalFrames - 1]?.time ?? 0) : 0;

  // Build reverse map (element ID → fullPath) for interval lookup
  const idToFullPath = useMemo(() => {
    if (storyBoardEvents.length === 0) return new Map<string, string>();
    return buildIdToFullPathMap(scenarioStoreApi.getState().document);
  }, [storyBoardEvents, scenarioStoreApi]);

  // Running intervals for hovered element
  const hoveredIntervals = useMemo((): RunningInterval[] => {
    if (!hoveredElementId || totalTime <= 0) return [];
    const fullPath = idToFullPath.get(hoveredElementId);
    if (!fullPath) return [];
    return getRunningIntervals(storyBoardEvents, fullPath, totalTime);
  }, [hoveredElementId, idToFullPath, storyBoardEvents, totalTime]);

  // Running intervals for selected element(s) — use first selected
  const selectedIntervals = useMemo((): RunningInterval[] => {
    if (selectedElementIds.length === 0 || totalTime <= 0) return [];
    const firstId = selectedElementIds[0];
    const fullPath = idToFullPath.get(firstId);
    if (!fullPath) return [];
    return getRunningIntervals(storyBoardEvents, fullPath, totalTime);
  }, [selectedElementIds, idToFullPath, storyBoardEvents, totalTime]);

  /** Seek to a specific simulation time by finding closest frame */
  const handleSeekToTime = useCallback(
    (time: number) => {
      if (frames.length === 0) return;
      let bestIdx = 0;
      for (let i = 1; i < frames.length; i++) {
        if (Math.abs(frames[i].time - time) < Math.abs(frames[bestIdx].time - time)) {
          bestIdx = i;
        }
      }
      seekTo(bestIdx);
    },
    [frames, seekTo],
  );

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleSeek = (value: number[]) => {
    seekTo(value[0]);
  };

  return (
    <div role="group" aria-label="Simulation playback controls" data-testid="playback-controls" className="flex items-center gap-3 h-full px-4">
      {/* Transport controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Skip to start"
          onClick={() => seekTo(0)}
          disabled={totalFrames === 0}
        >
          <SkipBack className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
          onClick={handlePlayPause}
          disabled={totalFrames === 0}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Skip to end"
          onClick={() => seekTo(totalFrames - 1)}
          disabled={totalFrames === 0}
        >
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Seek bar + interval overlays + event markers */}
      <div className="flex-1 mx-2 flex flex-col justify-center">
        <div className="relative">
          <Slider
            aria-label="Seek simulation timeline"
            min={0}
            max={Math.max(totalFrames - 1, 0)}
            step={1}
            value={[currentFrameIndex]}
            onValueChange={handleSeek}
            disabled={totalFrames === 0}
            className="cursor-pointer relative z-10"
          />
          {/* Running interval overlays (behind the slider thumb) */}
          <ElementIntervalOverlay intervals={selectedIntervals} totalTime={totalTime} variant="selected" />
          <ElementIntervalOverlay intervals={hoveredIntervals} totalTime={totalTime} variant="hover" />
        </div>
        <EventMarkerLane
          events={storyBoardEvents}
          totalTime={totalTime}
          onSeekToTime={handleSeekToTime}
        />
      </div>

      {/* Time display */}
      <span data-testid="time-display" className="text-[10px] tabular-nums text-[var(--color-text-tertiary)] min-w-[100px] text-center">
        {formatTime(currentTime)} / {formatTime(totalTime)}
      </span>

      {/* Speed selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Playback speed"
            className="text-[10px] h-6 px-2 min-w-[40px]"
          >
            {playbackSpeed}x
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SPEED_OPTIONS.map((speed) => (
            <DropdownMenuItem
              key={speed}
              onClick={() => setSpeed(speed)}
              className={playbackSpeed === speed ? 'font-bold' : ''}
            >
              {speed}x
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function SimulationTimeline() {
  const status = useSimulationStore((s) => s.status);
  const hasFrames = useSimulationStore((s) => s.frames.length > 0);

  if (status === 'running') {
    return <RunningView />;
  }

  if ((status === 'completed' || status === 'error') && hasFrames) {
    return <PlaybackControls />;
  }

  // idle or error without frames
  return <IdleView />;
}

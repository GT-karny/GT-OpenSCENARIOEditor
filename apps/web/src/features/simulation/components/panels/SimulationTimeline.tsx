import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '@osce/i18n';
import { Timer, Play, Pause, SkipBack, SkipForward, ZoomOut, Eye, EyeOff } from 'lucide-react';
import type {
  StoryBoardEvent,
  StoryBoardElementType,
  Condition,
  SimulationTimeCondition,
} from '@osce/shared';
import { Button } from '../../../../components/ui/button';
import { Slider } from '../../../../components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { useSimulationStore } from '../../stores/simulation-store';
import { useEditorStore } from '../../../../stores/editor-store';
import { useScenarioStore, useScenarioStoreApi } from '../../../../stores/use-scenario-store';
import {
  buildIdToFullPathMap,
  getRunningIntervals,
  type RunningInterval,
} from '../../../../lib/fullpath-mapping';
import {
  buildTimeTriggerTargets,
  type TimeTriggerTarget,
} from '../../../../lib/timeline-trigger-mapping';
import {
  fullViewport,
  clamp,
  timeToFraction,
  fractionToTime,
  zoomViewport,
  type TimelineViewport,
} from '../../../../lib/timeline-viewport';

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4] as const;

/** Drop-time snap resolution, in seconds. */
const SNAP_SECONDS = 0.1;

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

/** Snap a time to the nearest {@link SNAP_SECONDS} and clamp to `[0, totalTime]`. */
function snapAndClamp(time: number, totalTime: number): number {
  const snapped = Math.round(time / SNAP_SECONDS) * SNAP_SECONDS;
  return clamp(Number(snapped.toFixed(3)), 0, totalTime);
}

function IdleView() {
  const { t } = useTranslation('common');

  return (
    <div
      data-testid="simulation-timeline-idle"
      className="flex items-center justify-center py-4 shrink-0"
    >
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
  const frames = useSimulationStore(useShallow((s) => s.frames));
  const currentTime = frames.length > 0 ? frames[frames.length - 1].time : 0;

  return (
    <div
      data-testid="simulation-timeline-running"
      className="flex items-center justify-center py-4 shrink-0"
    >
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

/** Clustered marker for the event lane (non-draggable, ambiguous triggers). */
interface MarkerCluster {
  /** Position as a simulation time (seconds) — mapped to pixels via the viewport. */
  timestamp: number;
  /** Primary color (from the highest-priority event in cluster) */
  color: string;
  /** Tooltip text */
  label: string;
  /** Number of events in this cluster */
  count: number;
}

/**
 * Marker lane rendered below the seek bar. Events whose element has a single
 * SimulationTimeCondition are drawn as draggable blocks; everything else is a
 * clustered, non-draggable dot (as before). Positions map through the shared
 * viewport so they stay pixel-aligned with the slider at any zoom.
 */
function EventMarkerLane({
  events,
  totalTime,
  viewport,
  onSeekToTime,
  selectedIntervals,
  targetsByFullPath,
  onCommitTime,
}: {
  events: StoryBoardEvent[];
  totalTime: number;
  viewport: TimelineViewport;
  onSeekToTime: (time: number) => void;
  selectedIntervals?: RunningInterval[];
  targetsByFullPath: Map<string, TimeTriggerTarget>;
  onCommitTime: (target: TimeTriggerTarget, newTime: number) => void;
}) {
  const { t } = useTranslation('common');
  const laneRef = useRef<HTMLDivElement>(null);
  const [hoveredCluster, setHoveredCluster] = useState<MarkerCluster | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  // Live ghost position (seconds) for the block currently being dragged.
  const [dragState, setDragState] = useState<{ elementId: string; time: number } | null>(null);

  // Split events into draggable time-trigger blocks vs. ambiguous dots.
  const { blocks, dotClusters } = useMemo(() => {
    if (totalTime <= 0 || events.length === 0) {
      return { blocks: [] as TimeTriggerTarget[], dotClusters: [] as MarkerCluster[] };
    }

    // One block per distinct element that has a single time trigger.
    const seen = new Set<string>();
    const blocksOut: TimeTriggerTarget[] = [];
    for (const ev of events) {
      const target = targetsByFullPath.get(ev.fullPath);
      if (!target || seen.has(target.elementId)) continue;
      seen.add(target.elementId);
      blocksOut.push(target);
    }

    // Remaining significant transitions become dots (ambiguous / no time cond).
    const significant = events.filter(
      (e) =>
        (e.state === 'running' || e.state === 'complete') &&
        e.elementType !== 'storyboard' &&
        !targetsByFullPath.has(e.fullPath),
    );

    const clusterThreshold = totalTime * 0.01;
    const clusters: MarkerCluster[] = [];
    for (const ev of significant) {
      const existing = clusters.find(
        (c) => Math.abs(c.timestamp - ev.timestamp) < clusterThreshold,
      );
      if (existing) {
        existing.count++;
        existing.label += `\n${ev.name} → ${ev.state}`;
      } else {
        clusters.push({
          timestamp: ev.timestamp,
          color: ELEMENT_TYPE_COLORS[ev.elementType] ?? '#94a3b8',
          label: `${ev.name} → ${ev.state}`,
          count: 1,
        });
      }
    }

    return { blocks: blocksOut, dotClusters: clusters };
  }, [events, totalTime, targetsByFullPath]);

  const handleMouseMove = useCallback((e: React.MouseEvent, cluster: MarkerCluster) => {
    setHoveredCluster(cluster);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  /** Convert a client X coordinate to a simulation time via the lane geometry. */
  const clientXToTime = useCallback(
    (clientX: number): number => {
      const rect = laneRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return viewport.start;
      const frac = clamp((clientX - rect.left) / rect.width, 0, 1);
      return fractionToTime(frac, viewport);
    },
    [viewport],
  );

  /** Begin dragging an event block. */
  const startBlockDrag = useCallback(
    (e: React.PointerEvent, target: TimeTriggerTarget) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragState({ elementId: target.elementId, time: target.currentValue });

      const move = (ev: PointerEvent) => {
        const time = snapAndClamp(clientXToTime(ev.clientX), totalTime);
        setDragState({ elementId: target.elementId, time });
      };
      const up = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        const time = snapAndClamp(clientXToTime(ev.clientX), totalTime);
        setDragState(null);
        if (time !== target.currentValue) {
          onCommitTime(target, time);
        }
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [clientXToTime, totalTime, onCommitTime],
  );

  if (blocks.length === 0 && dotClusters.length === 0) return null;

  const renderIntervalLines = (intervals: RunningInterval[] | undefined, color: string) => {
    if (!intervals || intervals.length === 0 || totalTime <= 0) return null;
    return intervals.map((iv, i) => {
      const left = timeToFraction(iv.start, viewport) * 100;
      const width = (timeToFraction(iv.end, viewport) - timeToFraction(iv.start, viewport)) * 100;
      if (left > 100 || left + width < 0) return null;
      return (
        <div
          key={i}
          className="absolute top-[3px] h-[2px] pointer-events-none"
          style={{
            left: `${left}%`,
            width: `${Math.max(width, 0.3)}%`,
            backgroundColor: color,
            boxShadow: `0 0 4px ${color}`,
          }}
        />
      );
    });
  };

  return (
    <div ref={laneRef} className="relative h-2.5 mx-2">
      {/* Running interval lines (behind markers) */}
      {renderIntervalLines(selectedIntervals, 'rgba(52, 211, 153, 0.6)')}

      {/* Ambiguous / non-time markers (non-draggable dots) */}
      {dotClusters.map((cluster, i) => {
        const pos = timeToFraction(cluster.timestamp, viewport);
        if (pos < 0 || pos > 1) return null;
        return (
          <button
            key={`dot-${i}`}
            className="absolute top-0.5 -translate-x-1/2 rounded-full transition-transform hover:scale-150 cursor-pointer"
            style={{
              left: `${pos * 100}%`,
              width: cluster.count > 1 ? 5 : 4,
              height: cluster.count > 1 ? 5 : 4,
              backgroundColor: cluster.color,
              boxShadow: `0 0 4px ${cluster.color}88`,
            }}
            title={t('timeline.ambiguousTrigger')}
            onClick={(e) => {
              e.stopPropagation();
              onSeekToTime(cluster.timestamp);
            }}
            onMouseMove={(e) => handleMouseMove(e, cluster)}
            onMouseLeave={() => setHoveredCluster(null)}
          />
        );
      })}

      {/* Draggable event blocks (single SimulationTimeCondition) */}
      {blocks.map((target) => {
        const isDragging = dragState?.elementId === target.elementId;
        const time = isDragging ? dragState.time : target.currentValue;
        const pos = timeToFraction(time, viewport);
        if (pos < -0.02 || pos > 1.02) return null;
        return (
          <button
            key={`block-${target.elementId}`}
            data-testid={`event-block-${target.elementId}`}
            data-time={time.toFixed(3)}
            className="absolute top-0 -translate-x-1/2 rounded-none cursor-ew-resize touch-none transition-transform hover:scale-y-125"
            style={{
              left: `${pos * 100}%`,
              width: 6,
              height: 10,
              backgroundColor: ELEMENT_TYPE_COLORS.event,
              boxShadow: isDragging
                ? `0 0 6px ${ELEMENT_TYPE_COLORS.event}`
                : `0 0 4px ${ELEMENT_TYPE_COLORS.event}88`,
              outline: isDragging ? `1px solid var(--color-text-primary)` : 'none',
            }}
            title={t('timeline.eventBlock')}
            onPointerDown={(e) => startBlockDrag(e, target)}
            onClick={(e) => e.stopPropagation()}
          />
        );
      })}

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
  const { t } = useTranslation('common');
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const currentFrameIndex = useSimulationStore((s) => s.currentFrameIndex);
  const frames = useSimulationStore(useShallow((s) => s.frames));
  const playbackSpeed = useSimulationStore((s) => s.playbackSpeed);
  const storyBoardEvents = useSimulationStore((s) => s.storyBoardEvents);
  const { play, pause, seekTo, setSpeed } = useSimulationStore.getState();

  // Editor selection state for reverse-lookup interval lines
  const selectedElementIds = useEditorStore(useShallow((s) => s.selection.selectedElementIds));
  // Toggle: reveal simulator-generated synthetic objects (hidden by default).
  const showSimGeneratedObjects = useEditorStore(
    (s) => s.preferences.showSimGeneratedObjects,
  );
  const updatePreferences = useEditorStore((s) => s.updatePreferences);
  const scenarioStoreApi = useScenarioStoreApi();
  // Reactive document slice — drives the reverse trigger map so blocks follow
  // undo/redo and property-editor edits.
  const document = useScenarioStore((s) => s.document);

  const totalFrames = frames.length;
  const currentTime = totalFrames > 0 ? (frames[currentFrameIndex]?.time ?? 0) : 0;
  const totalTime = totalFrames > 0 ? (frames[totalFrames - 1]?.time ?? 0) : 0;

  // Local, non-persisted zoom viewport. Reset whenever the timeline length
  // changes (new run) so we always start fully zoomed out.
  const [viewport, setViewport] = useState<TimelineViewport>(() => fullViewport(totalTime));
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setViewport(fullViewport(totalTime));
  }, [totalTime]);

  // DOM-observable mirror of the lead entity's simulated position at the current
  // frame. Lets E2E tests assert that frames actually flow to the viewer (the
  // value changes as playback advances) without reaching into the Three.js canvas.
  const leadObject = totalFrames > 0 ? frames[currentFrameIndex]?.objects[0] : undefined;
  const leadPos = leadObject ? `${leadObject.x.toFixed(3)},${leadObject.y.toFixed(3)}` : '';

  // Build reverse map (element ID → fullPath) for interval lookup
  const idToFullPath = useMemo(() => {
    if (storyBoardEvents.length === 0) return new Map<string, string>();
    return buildIdToFullPathMap(document);
  }, [storyBoardEvents, document]);

  // Draggable time-trigger targets, keyed by fullPath (recomputed on document
  // change or when a new run produces events).
  const timeTriggerTargets = useMemo(() => {
    if (storyBoardEvents.length === 0) return new Map<string, TimeTriggerTarget>();
    return buildTimeTriggerTargets(document).byFullPath;
  }, [storyBoardEvents, document]);

  // Running intervals for selected element(s) — use first selected
  const selectedIntervals = useMemo((): RunningInterval[] => {
    if (selectedElementIds.length === 0 || totalTime <= 0) return [];
    const firstId = selectedElementIds[0];
    const fullPath = idToFullPath.get(firstId);
    if (!fullPath) return [];
    return getRunningIntervals(storyBoardEvents, fullPath, totalTime);
  }, [selectedElementIds, idToFullPath, storyBoardEvents, totalTime]);

  /** Seek to a specific simulation time by finding the closest frame. */
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

  /** Commit a dragged event block's new trigger time as one undoable edit. */
  const handleCommitTime = useCallback(
    (target: TimeTriggerTarget, newTime: number) => {
      // Re-read the live condition so the Partial we write only touches `value`
      // while preserving the discriminated-union shape expected by the store.
      const doc = scenarioStoreApi.getState().document;
      const current = buildTimeTriggerTargets(doc).byFullPath.get(target.fullPath);
      if (!current) return;
      const inner: SimulationTimeCondition = {
        type: 'simulationTime',
        value: newTime,
        // Preserve the existing comparison rule.
        rule: current.rule,
      };
      const updates: Partial<Condition> = {
        condition: { kind: 'byValue', valueCondition: inner },
      };
      scenarioStoreApi.getState().updateCondition(current.conditionId, updates);
    },
    [scenarioStoreApi],
  );

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  /** Ctrl+wheel zooms the viewport around the cursor. */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey || totalTime <= 0) return;
      e.preventDefault();
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const focusFraction = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      // Wheel up (negative deltaY) zooms in.
      const zoomDelta = -e.deltaY * 0.0015;
      setViewport((vp) => zoomViewport(vp, focusFraction, zoomDelta, totalTime));
    },
    [totalTime],
  );

  /** Scrub: pointer-down/drag anywhere on the track seeks continuously. */
  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Ignore drags that originate on an event block (they own the gesture).
      if ((e.target as HTMLElement).closest('[data-testid^="event-block-"]')) return;
      if (totalTime <= 0) return;
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;

      const seekAt = (clientX: number) => {
        const frac = clamp((clientX - rect.left) / rect.width, 0, 1);
        handleSeekToTime(fractionToTime(frac, viewport));
      };
      seekAt(e.clientX);

      const move = (ev: PointerEvent) => seekAt(ev.clientX);
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [handleSeekToTime, viewport, totalTime],
  );

  const isZoomed = viewport.start > 0 || viewport.end < totalTime - 1e-6;

  // Slider maps frame index -> viewport fraction so the thumb stays aligned
  // with the (possibly zoomed) time window. We drive the slider in a 0..1000
  // fractional space and translate back to a frame on change.
  const sliderFraction = totalTime > 0 ? clamp(timeToFraction(currentTime, viewport), 0, 1) : 0;

  const handleSliderChange = (value: number[]) => {
    const frac = value[0] / 1000;
    handleSeekToTime(fractionToTime(frac, viewport));
  };

  return (
    <div
      role="group"
      aria-label="Simulation playback controls"
      data-testid="playback-controls"
      className="flex items-center gap-3 h-full px-4"
    >
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
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
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

      {/* Seek bar + event markers with interval lines */}
      <div
        ref={trackRef}
        data-testid="timeline-viewport"
        data-zoom-start={viewport.start.toFixed(3)}
        data-zoom-end={viewport.end.toFixed(3)}
        className="flex-1 mx-2 flex flex-col justify-center"
        onWheel={handleWheel}
        onPointerDown={handleTrackPointerDown}
        title={t('timeline.zoomHint')}
      >
        <Slider
          aria-label="Seek simulation timeline"
          min={0}
          max={1000}
          step={1}
          value={[sliderFraction * 1000]}
          onValueChange={handleSliderChange}
          disabled={totalFrames === 0}
          className="cursor-pointer"
        />
        <EventMarkerLane
          events={storyBoardEvents}
          totalTime={totalTime}
          viewport={viewport}
          onSeekToTime={handleSeekToTime}
          selectedIntervals={selectedIntervals}
          targetsByFullPath={timeTriggerTargets}
          onCommitTime={handleCommitTime}
        />
      </div>

      {/* Reset-zoom button (only useful when zoomed) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        aria-label={t('timeline.resetZoom')}
        title={t('timeline.resetZoom')}
        onClick={() => setViewport(fullViewport(totalTime))}
        disabled={totalFrames === 0 || !isZoomed}
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </Button>

      {/* Time display */}
      <span
        data-testid="time-display"
        className="text-[10px] tabular-nums text-[var(--color-text-tertiary)] min-w-[100px] text-center"
      >
        {formatTime(currentTime)} / {formatTime(totalTime)}
      </span>

      {/* Hidden DOM mirror of the lead entity position (E2E observability only) */}
      <span
        data-testid="sim-lead-position"
        data-frame-index={currentFrameIndex}
        className="sr-only"
      >
        {leadPos}
      </span>

      {/* Toggle: show simulator-generated synthetic objects (crosswalks/bridges/
          objectReference clones with id >= 900000000), hidden by default. */}
      <Button
        variant="ghost"
        size="icon"
        className={
          'h-7 w-7 ' +
          (showSimGeneratedObjects
            ? 'text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-secondary)]')
        }
        aria-label="Show simulator-generated objects"
        aria-pressed={showSimGeneratedObjects}
        title="Show simulator-generated objects"
        onClick={() =>
          updatePreferences({ showSimGeneratedObjects: !showSimGeneratedObjects })
        }
      >
        {showSimGeneratedObjects ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
      </Button>

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

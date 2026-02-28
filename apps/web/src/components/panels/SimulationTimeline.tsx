import { useTranslation } from '@osce/i18n';
import { Timer, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useSimulationStore } from '../../stores/simulation-store';

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4] as const;

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
}

function IdleView() {
  const { t } = useTranslation('common');

  return (
    <div data-testid="simulation-timeline-idle" className="flex items-center justify-center h-full">
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
    <div data-testid="simulation-timeline-running" className="flex items-center justify-center h-full">
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

function PlaybackControls() {
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const currentFrameIndex = useSimulationStore((s) => s.currentFrameIndex);
  const frames = useSimulationStore((s) => s.frames);
  const playbackSpeed = useSimulationStore((s) => s.playbackSpeed);
  const { play, pause, seekTo, setSpeed } = useSimulationStore.getState();

  const totalFrames = frames.length;
  const currentTime = totalFrames > 0 ? (frames[currentFrameIndex]?.time ?? 0) : 0;
  const totalTime = totalFrames > 0 ? (frames[totalFrames - 1]?.time ?? 0) : 0;

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

      {/* Seek bar */}
      <div className="flex-1 mx-2">
        <Slider
          aria-label="Seek simulation timeline"
          min={0}
          max={Math.max(totalFrames - 1, 0)}
          step={1}
          value={[currentFrameIndex]}
          onValueChange={handleSeek}
          disabled={totalFrames === 0}
          className="cursor-pointer"
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

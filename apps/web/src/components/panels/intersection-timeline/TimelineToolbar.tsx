/**
 * Toolbar for the Intersection Timeline panel.
 * Play/pause, speed selector, time display, close button.
 */

import { memo } from 'react';
import { Play, Pause, RotateCcw, X, TrafficCone } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { SPEED_OPTIONS } from '../../../hooks/use-signal-timeline';
import type { PlaybackSpeed } from '../../../hooks/use-signal-timeline';

interface TimelineToolbarProps {
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  currentTime: number;
  totalDuration: number;
  onTogglePlay: () => void;
  onSetSpeed: (speed: PlaybackSpeed) => void;
  onReset: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
}

export const TimelineToolbar = memo(function TimelineToolbar({
  isPlaying,
  playbackSpeed,
  currentTime,
  totalDuration,
  onTogglePlay,
  onSetSpeed,
  onReset,
  onClose,
  children,
}: TimelineToolbarProps) {
  return (
    <div className="flex items-center gap-2 h-8 px-2 border-b border-[var(--color-glass-edge)] bg-[var(--color-glass-1)]">
      <TrafficCone className="size-3.5 text-[var(--color-text-secondary)]" />
      <span className="text-[11px] font-medium text-[var(--color-text-primary)]">
        Signal Timeline
      </span>

      {children}

      <div className="flex-1" />

      {/* Transport controls */}
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={onReset}
        title="Reset"
      >
        <RotateCcw className="size-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={onTogglePlay}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="size-3" /> : <Play className="size-3" />}
      </Button>

      {/* Speed selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] font-mono">
            {playbackSpeed}x
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[60px]">
          {SPEED_OPTIONS.map((speed) => (
            <DropdownMenuItem
              key={speed}
              onClick={() => onSetSpeed(speed)}
              className={`text-xs ${speed === playbackSpeed ? 'font-bold' : ''}`}
            >
              {speed}x
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Time display */}
      <span className="text-[10px] font-mono text-[var(--color-text-secondary)] tabular-nums min-w-[90px] text-right">
        {formatTime(currentTime)} / {formatTime(totalDuration)}
      </span>

      {/* Close */}
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={onClose}
        title="Close"
      >
        <X className="size-3" />
      </Button>
    </div>
  );
});

/**
 * Playback state management for the Intersection Timeline panel.
 *
 * Provides currentTime, play/pause, speed control, and phase lookup.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TrafficSignalController, TrafficSignalPhase } from '@osce/shared';

const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;
export type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];
export { SPEED_OPTIONS };

export interface SelectedPhase {
  controllerId: string;
  phaseIndex: number;
}

export interface ActivePhaseResult {
  phase: TrafficSignalPhase;
  index: number;
}

/**
 * Compute total cycle duration for a single controller.
 */
export function getControllerCycleDuration(controller: TrafficSignalController): number {
  return controller.phases.reduce((sum, p) => sum + p.duration, 0);
}

/**
 * Compute total cycle duration across all controllers (max of all).
 */
export function getTotalCycleDuration(controllers: TrafficSignalController[]): number {
  if (controllers.length === 0) return 0;
  return Math.max(...controllers.map(getControllerCycleDuration));
}

/**
 * Get the active phase for a controller at a given time.
 * Accounts for controller delay and wraps around the cycle.
 */
export function getActivePhase(
  controller: TrafficSignalController,
  time: number,
): ActivePhaseResult | null {
  const totalDuration = getControllerCycleDuration(controller);
  if (totalDuration === 0 || controller.phases.length === 0) return null;

  // Apply delay offset and wrap
  let elapsed = ((time - (controller.delay ?? 0)) % totalDuration + totalDuration) % totalDuration;

  for (let i = 0; i < controller.phases.length; i++) {
    const phase = controller.phases[i];
    if (elapsed < phase.duration) {
      return { phase, index: i };
    }
    elapsed -= phase.duration;
  }

  // Fallback (shouldn't happen due to modulo)
  return { phase: controller.phases[0], index: 0 };
}

/**
 * Get the state string for a specific signal at a given time.
 */
export function getSignalStateAtTime(
  controller: TrafficSignalController,
  signalId: string,
  time: number,
): string {
  const active = getActivePhase(controller, time);
  if (!active) return '';
  const signalState = active.phase.trafficSignalStates.find(
    (s) => s.trafficSignalId === signalId,
  );
  return signalState?.state ?? '';
}

export interface SignalTimelineHook {
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  selectedPhase: SelectedPhase | null;
  setCurrentTime: (time: number) => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setSelectedPhase: (phase: SelectedPhase | null) => void;
  reset: () => void;
}

export function useSignalTimeline(totalDuration: number): SignalTimelineHook {
  const [currentTime, setCurrentTimeState] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [selectedPhase, setSelectedPhase] = useState<SelectedPhase | null>(null);

  const lastFrameTime = useRef<number>(0);
  const rafId = useRef<number>(0);

  const setCurrentTime = useCallback(
    (time: number) => {
      setCurrentTimeState(totalDuration > 0 ? ((time % totalDuration) + totalDuration) % totalDuration : 0);
    },
    [totalDuration],
  );

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTimeState(0);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || totalDuration <= 0) {
      cancelAnimationFrame(rafId.current);
      return;
    }

    lastFrameTime.current = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;

      setCurrentTimeState((prev) => {
        const next = prev + dt * playbackSpeed;
        return next >= totalDuration ? next % totalDuration : next;
      });

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId.current);
    };
  }, [isPlaying, playbackSpeed, totalDuration]);

  // Clamp currentTime when totalDuration changes
  useEffect(() => {
    if (totalDuration > 0 && currentTime >= totalDuration) {
      setCurrentTimeState(currentTime % totalDuration);
    }
  }, [totalDuration, currentTime]);

  return {
    currentTime,
    isPlaying,
    playbackSpeed,
    selectedPhase,
    setCurrentTime,
    togglePlay,
    setPlaybackSpeed,
    setSelectedPhase,
    reset,
  };
}

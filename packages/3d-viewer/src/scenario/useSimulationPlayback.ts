/**
 * Hook for simulation playback state machine.
 * Provides play/pause/seek controls and current frame interpolation.
 * Foundation for future esmini integration.
 */

import { useState, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { SimulationFrame } from '@osce/shared';

export interface SimulationPlaybackControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setFrames: (frames: SimulationFrame[]) => void;
  currentFrame: SimulationFrame | null;
  status: 'idle' | 'playing' | 'paused';
  currentTime: number;
  duration: number;
}

interface PlaybackInternalState {
  status: 'idle' | 'playing' | 'paused';
  currentTime: number;
  duration: number;
  frames: SimulationFrame[];
}

/**
 * Find the frame at or just before the given time using binary search.
 */
function findFrameAtTime(
  frames: SimulationFrame[],
  time: number,
): SimulationFrame | null {
  if (frames.length === 0) return null;
  if (time <= frames[0].time) return frames[0];
  if (time >= frames[frames.length - 1].time) return frames[frames.length - 1];

  let low = 0;
  let high = frames.length - 1;
  while (low < high - 1) {
    const mid = (low + high) >>> 1;
    if (frames[mid].time <= time) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return frames[low];
}

export function useSimulationPlayback(): SimulationPlaybackControls {
  const [state, setState] = useState<PlaybackInternalState>({
    status: 'idle',
    currentTime: 0,
    duration: 0,
    frames: [],
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Animation loop: advance time when playing
  useFrame((_, delta) => {
    if (stateRef.current.status !== 'playing') return;
    const newTime = stateRef.current.currentTime + delta;
    if (newTime >= stateRef.current.duration) {
      setState((s) => ({ ...s, status: 'paused', currentTime: s.duration }));
    } else {
      setState((s) => ({ ...s, currentTime: newTime }));
    }
  });

  const play = useCallback(() => {
    setState((s) => {
      if (s.frames.length === 0) return s;
      const newTime = s.currentTime >= s.duration ? 0 : s.currentTime;
      return { ...s, status: 'playing', currentTime: newTime };
    });
  }, []);

  const pause = useCallback(() => {
    setState((s) => ({ ...s, status: 'paused' }));
  }, []);

  const stop = useCallback(() => {
    setState((s) => ({ ...s, status: 'idle', currentTime: 0 }));
  }, []);

  const seek = useCallback((time: number) => {
    setState((s) => ({
      ...s,
      currentTime: Math.max(0, Math.min(time, s.duration)),
    }));
  }, []);

  const setFrames = useCallback((frames: SimulationFrame[]) => {
    setState({
      status: 'idle',
      currentTime: 0,
      duration: frames.length > 0 ? frames[frames.length - 1].time : 0,
      frames,
    });
  }, []);

  const currentFrame = findFrameAtTime(state.frames, state.currentTime);

  return {
    play,
    pause,
    stop,
    seek,
    setFrames,
    currentFrame,
    status: state.status,
    currentTime: state.currentTime,
    duration: state.duration,
  };
}

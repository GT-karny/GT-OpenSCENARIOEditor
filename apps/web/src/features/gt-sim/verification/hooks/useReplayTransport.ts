/**
 * Playback state machine over a recorded/streamed telemetry frame array
 * (idx / play / speed / loop + timer). Ported unchanged from the fork's
 * `components/verification/replayHooks.ts` `useReplay`. Shared by the replay
 * and annotate views (`ReplayView`, `AnnotateView`) via `ReplayTransport`'s
 * `ReplayControls` / `Timeline` components.
 */
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { VdTelemetryFrame } from '@osce/esmini';

export interface ReplayState {
  idx: number;
  setIdx: (i: number) => void;
  playing: boolean;
  setPlaying: Dispatch<SetStateAction<boolean>>;
  speed: number;
  setSpeed: (s: number) => void;
  loop: boolean;
  setLoop: Dispatch<SetStateAction<boolean>>;
  lastIdx: number;
  atEnd: boolean;
  dt: number;
  frame: VdTelemetryFrame | null;
  reset: () => void;
  stepBy: (d: number) => void;
  togglePlay: () => void;
}

export function useReplayTransport(frames: VdTelemetryFrame[]): ReplayState {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);
  const timerRef = useRef<number | null>(null);

  const lastIdx = Math.max(0, frames.length - 1);
  const atEnd = frames.length > 0 && idx >= lastIdx;
  const dt = frames.length > 1 ? Math.max(0.01, frames[1].sim_time - frames[0].sim_time) : 0.05;

  const reset = () => setIdx(0);
  const stepBy = (d: number) => {
    setPlaying(false);
    setIdx((i) => Math.max(0, Math.min(lastIdx, i + d)));
  };
  const togglePlay = () => {
    if (!playing && atEnd && !loop) setIdx(0);
    setPlaying((p) => !p);
  };

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const period = Math.max(16, (dt * 1000) / speed);
    timerRef.current = window.setInterval(() => {
      setIdx((i) => {
        if (i >= frames.length - 1) {
          if (loop) return 0;
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, period);
    return () => {
      if (timerRef.current != null) window.clearInterval(timerRef.current);
    };
  }, [playing, speed, dt, frames.length, loop]);

  const frame: VdTelemetryFrame | null = frames[Math.min(idx, frames.length - 1)] ?? null;
  return {
    idx,
    setIdx,
    playing,
    setPlaying,
    speed,
    setSpeed,
    loop,
    setLoop,
    lastIdx,
    atEnd,
    dt,
    frame,
    reset,
    stepBy,
    togglePlay,
  };
}

import { create } from 'zustand';
import type { SimulationFrame, SimulationResult, SimulationStatus } from '@osce/shared';

export interface SimulationState {
  // State
  status: SimulationStatus;
  frames: SimulationFrame[];
  currentFrameIndex: number;
  error?: string;

  // Playback
  isPlaying: boolean;
  playbackSpeed: number;

  // Actions (called by WebSocket handler)
  addFrame: (frame: SimulationFrame) => void;
  setCompleted: (result: SimulationResult) => void;
  setError: (error: string) => void;
  setStatus: (status: SimulationStatus) => void;
  reset: () => void;

  // Playback actions (called by UI)
  play: () => void;
  pause: () => void;
  seekTo: (frameIndex: number) => void;
  setSpeed: (speed: number) => void;
}

// Module-level rAF management (not serializable, kept outside store)
let rafId: number | null = null;
let lastTimestamp: number | null = null;

function stopPlaybackLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastTimestamp = null;
}

function startPlaybackLoop() {
  stopPlaybackLoop();
  lastTimestamp = null;

  const tick = (timestamp: number) => {
    const state = useSimulationStore.getState();

    if (!state.isPlaying) {
      stopPlaybackLoop();
      return;
    }

    if (lastTimestamp === null) {
      lastTimestamp = timestamp;
      rafId = requestAnimationFrame(tick);
      return;
    }

    const deltaSeconds = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    const { frames, currentFrameIndex, playbackSpeed } = state;
    if (frames.length === 0) {
      state.pause();
      return;
    }

    const currentTime = frames[currentFrameIndex]?.time ?? 0;
    const targetTime = currentTime + deltaSeconds * playbackSpeed;

    // Find the frame closest to targetTime
    let newIndex = currentFrameIndex;
    for (let i = currentFrameIndex + 1; i < frames.length; i++) {
      if (frames[i].time <= targetTime) {
        newIndex = i;
      } else {
        break;
      }
    }

    if (newIndex >= frames.length - 1) {
      // Reached the end
      useSimulationStore.setState({ currentFrameIndex: frames.length - 1, isPlaying: false });
      stopPlaybackLoop();
      return;
    }

    if (newIndex !== currentFrameIndex) {
      useSimulationStore.setState({ currentFrameIndex: newIndex });
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
}

export const useSimulationStore = create<SimulationState>()((set) => ({
  status: 'idle',
  frames: [],
  currentFrameIndex: 0,
  error: undefined,
  isPlaying: false,
  playbackSpeed: 1,

  addFrame: (frame) =>
    set((state) => ({
      frames: [...state.frames, frame],
      status: state.status === 'idle' ? 'running' : state.status,
    })),

  setCompleted: (result) => {
    stopPlaybackLoop();
    set({
      status: 'completed',
      frames: result.frames,
      currentFrameIndex: 0,
      isPlaying: false,
      error: result.error,
    });
  },

  setError: (error) => {
    stopPlaybackLoop();
    set({ status: 'error', error, isPlaying: false });
  },

  setStatus: (status) => set({ status }),

  reset: () => {
    stopPlaybackLoop();
    set({
      status: 'idle',
      frames: [],
      currentFrameIndex: 0,
      error: undefined,
      isPlaying: false,
      playbackSpeed: 1,
    });
  },

  play: () => {
    const state = useSimulationStore.getState();
    if (state.frames.length === 0) return;
    // If at end, restart from beginning
    if (state.currentFrameIndex >= state.frames.length - 1) {
      set({ currentFrameIndex: 0 });
    }
    set({ isPlaying: true });
    startPlaybackLoop();
  },

  pause: () => {
    stopPlaybackLoop();
    set({ isPlaying: false });
  },

  seekTo: (frameIndex) => {
    const { frames } = useSimulationStore.getState();
    const clamped = Math.max(0, Math.min(frameIndex, frames.length - 1));
    set({ currentFrameIndex: clamped });
  },

  setSpeed: (speed) => set({ playbackSpeed: speed }),
}));

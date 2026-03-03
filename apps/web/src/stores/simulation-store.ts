import { create } from 'zustand';
import type {
  SimulationFrame,
  SimulationResult,
  SimulationStatus,
  StoryBoardEvent,
  ConditionEvent,
} from '@osce/shared';

export interface SimulationState {
  // State
  status: SimulationStatus;
  frames: SimulationFrame[];
  currentFrameIndex: number;
  error?: string;

  // StoryBoard introspection (WASM mode)
  storyBoardEvents: StoryBoardEvent[];
  conditionEvents: ConditionEvent[];
  activeElements: string[]; // fullPath values currently in "running" state

  // Playback
  isPlaying: boolean;
  playbackSpeed: number;

  // Actions (called by WebSocket handler or WASM service)
  addFrame: (frame: SimulationFrame) => void;
  setCompleted: (result: SimulationResult) => void;
  setError: (error: string) => void;
  setStatus: (status: SimulationStatus) => void;
  addStoryBoardEvent: (event: StoryBoardEvent) => void;
  addConditionEvent: (event: ConditionEvent) => void;
  setStoryBoardEvents: (events: StoryBoardEvent[]) => void;
  setConditionEvents: (events: ConditionEvent[]) => void;
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
let playbackTime = 0; // Accumulated playback time (seconds)

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

  // Initialize playback time from current frame
  const initState = useSimulationStore.getState();
  playbackTime = initState.frames[initState.currentFrameIndex]?.time ?? 0;

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

    // Accumulate playback time independently of frame times
    playbackTime += deltaSeconds * playbackSpeed;

    // Find the frame closest to playbackTime
    let newIndex = currentFrameIndex;
    for (let i = currentFrameIndex + 1; i < frames.length; i++) {
      if (frames[i].time <= playbackTime) {
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

function computeActiveElements(events: StoryBoardEvent[]): string[] {
  // Track the latest state for each fullPath
  const stateMap = new Map<string, StoryBoardEvent['state']>();
  for (const event of events) {
    stateMap.set(event.fullPath, event.state);
  }
  // Return fullPaths that are currently "running"
  const active: string[] = [];
  for (const [path, state] of stateMap) {
    if (state === 'running') {
      active.push(path);
    }
  }
  return active;
}

export const useSimulationStore = create<SimulationState>()((set) => ({
  status: 'idle',
  frames: [],
  currentFrameIndex: 0,
  error: undefined,
  storyBoardEvents: [],
  conditionEvents: [],
  activeElements: [],
  isPlaying: false,
  playbackSpeed: 1,

  addFrame: (frame) =>
    set((state) => ({
      frames: [...state.frames, frame],
      status: state.status === 'idle' ? 'running' : state.status,
    })),

  setCompleted: (result) => {
    stopPlaybackLoop();

    console.warn(
      `[SimulationStore] setCompleted: ${result.frames.length} frames, ` +
        `duration: ${result.duration.toFixed(2)}s`,
    );

    if (result.frames.length > 0 && result.frames.length < 10) {
      console.warn(
        `[SimulationStore] Warning: very few frames (${result.frames.length}). ` +
          `Playback may appear to not work.`,
      );
    }

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

  addStoryBoardEvent: (event) =>
    set((state) => {
      const events = [...state.storyBoardEvents, event];
      return {
        storyBoardEvents: events,
        activeElements: computeActiveElements(events),
      };
    }),

  addConditionEvent: (event) =>
    set((state) => ({
      conditionEvents: [...state.conditionEvents, event],
    })),

  setStoryBoardEvents: (events) =>
    set({
      storyBoardEvents: events,
      activeElements: computeActiveElements(events),
    }),

  setConditionEvents: (events) =>
    set({
      conditionEvents: events,
    }),

  reset: () => {
    stopPlaybackLoop();
    set({
      status: 'idle',
      frames: [],
      currentFrameIndex: 0,
      error: undefined,
      storyBoardEvents: [],
      conditionEvents: [],
      activeElements: [],
      isPlaying: false,
      playbackSpeed: 1,
    });
  },

  play: () => {
    const state = useSimulationStore.getState();
    if (state.frames.length === 0) return;
    // If at end, restart from beginning
    if (state.currentFrameIndex >= state.frames.length - 1) {
      playbackTime = state.frames[0]?.time ?? 0;
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
    // Sync accumulated playback time to the seeked frame
    playbackTime = frames[clamped]?.time ?? 0;
    set({ currentFrameIndex: clamped });
  },

  setSpeed: (speed) => set({ playbackSpeed: speed }),
}));

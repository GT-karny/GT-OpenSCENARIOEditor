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
      syncActiveElements();
      stopPlaybackLoop();
      return;
    }

    if (newIndex !== currentFrameIndex) {
      useSimulationStore.setState({ currentFrameIndex: newIndex });
      syncActiveElements();
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
}

/**
 * Compute active (running) elements at a given simulation time.
 * Only considers events with timestamp <= time, then returns fullPaths
 * whose latest state at that point is "running".
 *
 * Instantaneous actions (e.g. TrafficSignalStateAction) that transition
 * running → complete within the same simulation step get both events with
 * the same timestamp, so the "complete" would normally shadow "running".
 * We detect this case and keep them as "running" for the frame at that
 * timestamp so they flash for at least one frame in the UI.
 */
function computeActiveElementsAtTime(
  sortedEvents: StoryBoardEvent[],
  time: number,
): string[] {
  // Binary search for the upper bound: last event with timestamp <= time
  let lo = 0;
  let hi = sortedEvents.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sortedEvents[mid].timestamp <= time) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  // lo = number of events with timestamp <= time

  // Track the latest state for each fullPath up to this time,
  // plus timestamps of the last running/complete transitions.
  const stateMap = new Map<string, StoryBoardEvent['state']>();
  const lastRunningTs = new Map<string, number>();
  const lastCompleteTs = new Map<string, number>();
  for (let i = 0; i < lo; i++) {
    const ev = sortedEvents[i];
    stateMap.set(ev.fullPath, ev.state);
    if (ev.state === 'running') {
      lastRunningTs.set(ev.fullPath, ev.timestamp);
    } else if (ev.state === 'complete') {
      lastCompleteTs.set(ev.fullPath, ev.timestamp);
    }
  }

  const active: string[] = [];
  for (const [path, state] of stateMap) {
    if (state === 'running') {
      active.push(path);
    } else if (state === 'complete') {
      // Instantaneous action: completed at the same timestamp it started running.
      // Show as "running" for one frame (the frame at that timestamp).
      const rt = lastRunningTs.get(path);
      const ct = lastCompleteTs.get(path);
      if (rt !== undefined && ct !== undefined && rt === ct && time === ct) {
        active.push(path);
      }
    }
  }
  return active;
}

/** Update activeElements based on the current playback frame time. */
function syncActiveElements() {
  const state = useSimulationStore.getState();
  if (state.storyBoardEvents.length === 0) return;
  const frame = state.frames[state.currentFrameIndex];
  if (!frame) return;
  const active = computeActiveElementsAtTime(state.storyBoardEvents, frame.time);
  // Only update if changed (shallow array comparison)
  const prev = state.activeElements;
  if (
    active.length !== prev.length ||
    active.some((v, i) => v !== prev[i])
  ) {
    useSimulationStore.setState({ activeElements: active });
  }
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

  addStoryBoardEvent: (event) => {
    set((state) => {
      // Insert maintaining sorted order by timestamp
      const events = [...state.storyBoardEvents];
      let insertIdx = events.length;
      for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].timestamp <= event.timestamp) {
          insertIdx = i + 1;
          break;
        }
        if (i === 0) insertIdx = 0;
      }
      events.splice(insertIdx, 0, event);
      return { storyBoardEvents: events };
    });
    syncActiveElements();
  },

  addConditionEvent: (event) =>
    set((state) => ({
      conditionEvents: [...state.conditionEvents, event],
    })),

  setStoryBoardEvents: (events) => {
    // Sort by timestamp for efficient binary-search in time-based queries
    const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
    set({ storyBoardEvents: sorted });
    syncActiveElements();
  },

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
      syncActiveElements();
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
    syncActiveElements();
  },

  setSpeed: (speed) => set({ playbackSpeed: speed }),
}));

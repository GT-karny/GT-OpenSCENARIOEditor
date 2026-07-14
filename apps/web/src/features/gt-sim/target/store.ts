/**
 * Execution-target selection store (WP5).
 *
 * Holds which simulation backend `SimulationButtons` drives: `wasm` (in-browser
 * esmini, lightweight preview) or `gt-sim` (the GT_Sim backend, production
 * run). Session-scoped Zustand state — reset on reload, matching every other
 * execution-mode view-state store in this codebase (e.g.
 * `run-form/store.ts`, `live/stores/live-view-store.ts`); no localStorage
 * persistence.
 *
 * `nativeWindow` is only meaningful when `target === 'gt-sim'`: it maps to
 * `execution.headless: false` on the GT_Sim job request (opens the real OSG
 * window instead of streaming headless OSI frames to the editor's viewer).
 *
 * `runningTarget` records which backend the CURRENT/LAST run was actually
 * started on. `target` is only the user's selection for the NEXT run: while a
 * simulation is running the switcher is disabled (`TargetSwitcher`), and Stop
 * must address the backend that was really started — so `SimulationButtons`
 * stamps `runningTarget` at start and routes Stop through it (double defense:
 * even if the selection ever diverged mid-run, Stop still reaches the right
 * service). It intentionally persists after the run ends (harmless; the next
 * start overwrites it).
 */
import { create } from 'zustand';

export type ExecutionTarget = 'wasm' | 'gt-sim';

interface ExecutionTargetState {
  target: ExecutionTarget;
  nativeWindow: boolean;
  /** Backend the current/last run was actually started on (null before the first run). */
  runningTarget: ExecutionTarget | null;
  setTarget: (target: ExecutionTarget) => void;
  setNativeWindow: (value: boolean) => void;
  setRunningTarget: (target: ExecutionTarget | null) => void;
}

export const useExecutionTargetStore = create<ExecutionTargetState>((set) => ({
  target: 'wasm',
  nativeWindow: false,
  runningTarget: null,
  setTarget: (target) => set({ target }),
  setNativeWindow: (value) => set({ nativeWindow: value }),
  setRunningTarget: (target) => set({ runningTarget: target }),
}));

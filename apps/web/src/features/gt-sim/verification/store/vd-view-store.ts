/**
 * VD verification panel view state (D6 — react-router replacement).
 *
 * The fork routed the three VD verification screens as separate pages
 * (`/verification/replay`, `/verification/annotate`) plus a standalone
 * `/live/vd/:jobId?override=1&project=&scenario=` window opened via
 * `window.open`. The unified UI has no router (design judgment D6): this
 * store holds the equivalent view state — which internal tab is active, and
 * the Live tab's job selection (previously URL path/query params) — so
 * `VdVerificationPanel` can render all three as tabs of one panel.
 *
 * Not persisted: this is ephemeral UI state, reset whenever the execution
 * mode remounts (same lifetime as the fork's in-memory router state).
 */
import { create } from 'zustand';

export type VdVerificationTab = 'replay' | 'annotate' | 'live';

/** Sentinel for "watch whichever VirtualDriver job is currently running" (fork's `jobId === 'current'`). */
export const LIVE_JOB_CURRENT = 'current';

interface VdViewState {
  activeTab: VdVerificationTab;
  setActiveTab: (tab: VdVerificationTab) => void;

  /** Live tab target job id, or `LIVE_JOB_CURRENT` to auto-follow the active run. */
  liveJobId: string;
  setLiveJobId: (jobId: string) => void;

  /** Live tab: show `VdManualOverridePanel` (fork's `?override=1`). */
  liveShowOverride: boolean;
  setLiveShowOverride: (show: boolean) => void;

  /** Live tab: optional scenario context for the road-geometry overlay (fork's `?project=&scenario=`). */
  liveProjectId: string | undefined;
  liveScenarioFile: string | undefined;
  setLiveScenarioContext: (projectId: string | undefined, scenarioFile: string | undefined) => void;
}

export const useVdViewStore = create<VdViewState>((set) => ({
  activeTab: 'replay',
  setActiveTab: (tab) => set({ activeTab: tab }),

  liveJobId: LIVE_JOB_CURRENT,
  setLiveJobId: (jobId) => set({ liveJobId: jobId }),

  liveShowOverride: false,
  setLiveShowOverride: (show) => set({ liveShowOverride: show }),

  liveProjectId: undefined,
  liveScenarioFile: undefined,
  setLiveScenarioContext: (projectId, scenarioFile) =>
    set({ liveProjectId: projectId, liveScenarioFile: scenarioFile }),
}));

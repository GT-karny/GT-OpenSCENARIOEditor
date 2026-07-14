/**
 * Active-tab state for `ExecutionLayout`'s `main` slot (WP5).
 *
 * The `main` slot can carry more than one registered panel (currently
 * `gt-sim-live-monitor` order 10 + `gt-sim-vd-verification` order 20 — see
 * `panels.ts`); stacking them vertically collapses both, so `ExecutionLayout`
 * renders them as tabs instead once there is more than one. This store holds
 * which panel id is active, keyed by the same panel id used in
 * `panel-registry.ts` (`ExecutionPanelDefinition.id`).
 *
 * Trunk-owned (lives beside `gt-sim-connection-store.ts`) so cross-cluster
 * "switch to the live view" actions (job list -> live monitor, run-form
 * submit -> live monitor) have a shared place to set the active main tab
 * alongside `live/stores/live-view-store.ts`'s `watchedJobId`.
 */
import { create } from 'zustand';

interface MainPanelViewState {
  /** Panel id active in the `main` slot tab strip, or `null` = default to the first panel. */
  activePanelId: string | null;
  setActivePanelId: (id: string) => void;
}

export const useMainPanelStore = create<MainPanelViewState>((set) => ({
  activePanelId: null,
  setActivePanelId: (id) => set({ activePanelId: id }),
}));

/** Panel id of the live-monitor panel (`live/register.ts`) — the "watch live" target. */
export const LIVE_MONITOR_PANEL_ID = 'gt-sim-live-monitor';

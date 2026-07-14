/**
 * `live-view-store` — cluster E's own view-state store.
 *
 * The fork picked the live job via a route param (`/live/vd/:jobId` or a
 * project/scenario detail page). This lane has no router (D6 — view state is
 * Zustand, per the migration plan), and job-list -> live-view navigation is a
 * WP5 trunk wiring task (job selection UI currently lives in cluster D). Until
 * that wiring lands, this store holds the job the live panels watch, set from
 * the "Watch a running job" picker inside `LiveMonitorPanel`.
 *
 * Scoped to this cluster only — not part of the cross-feature
 * `gt-sim-connection-store` boundary.
 */
import { create } from 'zustand';

interface LiveViewStore {
  /** The job id the live panels (2D scene, OSI table, HVD gauges, SV table) watch. */
  watchedJobId: string | null;
  setWatchedJobId: (jobId: string | null) => void;
}

export const useLiveViewStore = create<LiveViewStore>((set) => ({
  watchedJobId: null,
  setWatchedJobId: (jobId) => set({ watchedJobId: jobId }),
}));

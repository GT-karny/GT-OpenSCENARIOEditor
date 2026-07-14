/**
 * View-state store for the jobs cluster (D).
 *
 * Replaces the fork's react-router state (`useParams<{jobId}>`,
 * `useNavigate`, `Link to="/simulations"`) with a plain Zustand store, per
 * the migration plan's D6 decision (no router in the execution mode).
 * Scoped to this cluster's own directory — no other lane reads or writes
 * this store.
 */
import { create } from 'zustand';

export type JobStatusFilter = '' | 'running' | 'completed' | 'failed';

interface JobsViewState {
  /** Currently selected job id — drives the detail side panel. `null` = none selected. */
  selectedJobId: string | null;
  statusFilter: JobStatusFilter;
  page: number;

  selectJob: (jobId: string) => void;
  clearSelection: () => void;
  setStatusFilter: (filter: JobStatusFilter) => void;
  setPage: (page: number) => void;
}

export const useJobsViewStore = create<JobsViewState>((set) => ({
  selectedJobId: null,
  statusFilter: '',
  page: 0,

  selectJob: (jobId) => set({ selectedJobId: jobId }),
  clearSelection: () => set({ selectedJobId: null }),
  // Changing the filter resets pagination, mirroring the fork's
  // `setStatusFilter(f); setPage(0);` pairing in SimulationsPage.
  setStatusFilter: (filter) => set({ statusFilter: filter, page: 0 }),
  setPage: (page) => set({ page }),
}));

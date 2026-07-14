/**
 * Cluster B (run form) view-state store.
 *
 * Replaces the fork's react-router state (`useParams`/`useSearchParams` for
 * `?project=`/`?scenario=`, `useNavigate` to the job detail page) with a
 * Zustand store scoped to this cluster, per migration decision D6. Only view
 * state lives here — job/preset/project data itself stays in react-query.
 */
import { create } from 'zustand';

interface RunFormViewState {
  /** Currently selected project (compact selector at the top of the panel). */
  selectedProjectId: string | null;
  /** Currently selected scenario file within the selected project. */
  selectedScenarioFile: string | null;
  /** Most recently submitted job id (kept after completion, for status display). */
  latestJobId: string | null;
  /** Job id considered "in flight" (queued/running) — drives Run/Stop button state. */
  activeJobId: string | null;

  setSelectedProject: (projectId: string | null) => void;
  setSelectedScenario: (scenarioFile: string | null) => void;
  setLatestJobId: (jobId: string | null) => void;
  setActiveJobId: (jobId: string | null) => void;
  reset: () => void;
}

const initialState = {
  selectedProjectId: null,
  selectedScenarioFile: null,
  latestJobId: null,
  activeJobId: null,
} satisfies Partial<RunFormViewState>;

export const useRunFormStore = create<RunFormViewState>((set) => ({
  ...initialState,

  setSelectedProject: (projectId) =>
    // Changing project always invalidates the current scenario selection.
    set({ selectedProjectId: projectId, selectedScenarioFile: null }),

  setSelectedScenario: (scenarioFile) => set({ selectedScenarioFile: scenarioFile }),

  setLatestJobId: (jobId) => set({ latestJobId: jobId }),

  setActiveJobId: (jobId) => set({ activeJobId: jobId }),

  reset: () => set({ ...initialState }),
}));

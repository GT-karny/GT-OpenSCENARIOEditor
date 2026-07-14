/**
 * react-query client for the GT_Sim execution mode.
 *
 * Design judgment D5: react-query is confined to `features/gt-sim`. This single
 * `QueryClient` is provided by `ExecutionLayout` and is the only one in the app;
 * the rest of the editor uses Zustand. State that must cross the feature
 * boundary goes through `gt-sim-connection-store`, never through react-query.
 *
 * queryKey convention (proposed for Phase 2 cluster lanes): keys are arrays
 * prefixed with the fork's resource name so caches never collide across
 * clusters, e.g. `['jobs']`, `['job', jobId]`, `['results', jobId]`,
 * `['presets', projectId]`, `['config', 'execution-defaults']`.
 */
import { QueryClient } from '@tanstack/react-query';

export const gtSimQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The backend is local; keep data reasonably fresh but avoid refetch
      // storms. Clusters can override per-query.
      staleTime: 5_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

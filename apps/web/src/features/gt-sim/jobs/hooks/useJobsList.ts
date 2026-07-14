/**
 * Job list query — ports the fork's `SimulationsPage` data fetching
 * (`getSimulations` + `getProjects` for name resolution) to react-query,
 * gated on the GT_Sim backend connection (`enabled: api !== null`, per
 * `features/gt-sim/lib/README.md`).
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGtSimApi } from '../../lib';
import { jobListRefetchInterval } from '../lib/polling';
import { useJobsViewStore } from '../stores/jobs-view-store';

export const JOBS_PAGE_SIZE = 20;

export function useJobsList() {
  const api = useGtSimApi();
  const statusFilter = useJobsViewStore((s) => s.statusFilter);
  const page = useJobsViewStore((s) => s.page);

  const jobsQuery = useQuery({
    queryKey: ['jobs', statusFilter, page],
    queryFn: () =>
      api!.getSimulations({
        status: statusFilter || undefined,
        limit: JOBS_PAGE_SIZE,
        offset: page * JOBS_PAGE_SIZE,
      }),
    enabled: api !== null,
    refetchInterval: (query) => jobListRefetchInterval(query.state.data?.jobs ?? []),
  });

  // Project names are read-only display data here (cluster A's project
  // management UI is out of scope per the migration plan's appendix §A).
  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => api!.getProjects(),
    enabled: api !== null,
    staleTime: 60_000,
  });

  const projectNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projectsQuery.data ?? []) map.set(project.project_id, project.name);
    return map;
  }, [projectsQuery.data]);

  const jobs = jobsQuery.data?.jobs ?? [];
  const total = jobsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / JOBS_PAGE_SIZE));

  return {
    jobs,
    total,
    totalPages,
    projectNames,
    isLoading: jobsQuery.isLoading,
    error: jobsQuery.error,
    refetch: jobsQuery.refetch,
  };
}

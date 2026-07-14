/**
 * Single-job detail query — ports the fork's `SimulationDetailPage` job fetch
 * (`getSimulation`) + cancel mutation (`cancelSimulation`) to react-query,
 * gated on the GT_Sim backend connection. Status/progress adaptation goes
 * through `@osce/esmini`'s `adaptJobStatus` (progress_pct -> progress,
 * status enum mapping) rather than a local reimplementation.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adaptJobStatus } from '@osce/esmini';
import type { AdaptedJobStatus } from '@osce/esmini';
import { useGtSimApi } from '../../lib';
import { jobDetailRefetchInterval } from '../lib/polling';

export function useJobDetail(jobId: string | null) {
  const api = useGtSimApi();
  const queryClient = useQueryClient();

  const jobQuery = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api!.getSimulation(jobId!),
    enabled: api !== null && jobId !== null,
    refetchInterval: (query) => jobDetailRefetchInterval(query.state.data?.status),
  });

  const adapted: AdaptedJobStatus | null = jobQuery.data ? adaptJobStatus(jobQuery.data) : null;

  const cancelMutation = useMutation({
    mutationFn: () => api!.cancelSimulation(jobId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  return {
    job: jobQuery.data ?? null,
    adapted,
    isLoading: jobQuery.isLoading,
    error: jobQuery.error,
    refetch: jobQuery.refetch,
    cancel: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
  };
}

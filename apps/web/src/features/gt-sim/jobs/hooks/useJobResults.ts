/**
 * Result metadata + metrics queries — ports the fork's `getResultMeta` /
 * `getMetrics` calls (`SimulationDetailPage`), gated on both the backend
 * connection and the job having reached a state where results exist.
 */
import { useQuery } from '@tanstack/react-query';
import { useGtSimApi } from '../../lib';

const RESULT_META_STATUSES = new Set(['completed', 'failed', 'timeout']);

export function useJobResults(jobId: string | null, status: string | undefined) {
  const api = useGtSimApi();

  const resultMetaQuery = useQuery({
    queryKey: ['results', jobId],
    queryFn: () => api!.getResultMeta(jobId!),
    enabled:
      api !== null && jobId !== null && status !== undefined && RESULT_META_STATUSES.has(status),
  });

  const metricsQuery = useQuery({
    queryKey: ['results', jobId, 'metrics'],
    queryFn: () => api!.getMetrics(jobId!),
    enabled: api !== null && jobId !== null && status === 'completed',
  });

  return {
    resultMeta: resultMetaQuery.data ?? null,
    metrics: metricsQuery.data ?? null,
  };
}

/**
 * Absolute URL builder for GT_Sim result-file direct links
 * (`GET /api/results/{jobId}/files/{name}`).
 *
 * `@osce/esmini`'s `GtSimApiClient` has a builder for the analogous
 * project-files endpoint (`downloadProjectFileUrl`) but none for results
 * files, and `features/gt-sim/lib/` is frozen for this lane (see its
 * README), so this local helper mirrors the client's own
 * `downloadProjectFileUrl` pattern: absolute base URL (from the connection
 * store) + `encodeURIComponent` per path segment.
 */
import { useGtSimConnectionStore } from '../../stores/gt-sim-connection-store';

/** Build the absolute result-file URL for a given REST base URL. */
export function buildResultFileUrl(restBaseUrl: string, jobId: string, fileName: string): string {
  const base = restBaseUrl.replace(/\/+$/, '');
  return `${base}/api/results/${encodeURIComponent(jobId)}/files/${encodeURIComponent(fileName)}`;
}

/**
 * React hook: the absolute result-file URL for the currently connected
 * backend, or `null` while disconnected (no endpoints resolved yet).
 */
export function useResultFileUrl(jobId: string, fileName: string): string | null {
  const restBaseUrl = useGtSimConnectionStore((s) => s.endpoints?.restBaseUrl ?? null);
  return restBaseUrl === null ? null : buildResultFileUrl(restBaseUrl, jobId, fileName);
}

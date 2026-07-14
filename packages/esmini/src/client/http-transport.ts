/**
 * Shared GT_Sim HTTP transport — the single fetch/timeout/error-mapping path
 * used by both `GtSimRestClient` (legacy 7-fn client) and `GtSimApiClient`
 * (WP1 full client).
 *
 * Behaviour: non-2xx responses (outside `allowStatuses`) throw `GtSimApiError`
 * with the status code and response body; transport failures and timeouts
 * throw `GtSimNetworkError`.
 */

import { GtSimApiError, GtSimNetworkError } from '../errors.js';

export interface GtSimFetchOptions {
  /** Request body (already serialized). */
  body?: string;
  /** Content-Type header to send (omitted when absent). */
  contentType?: string;
  /** Response statuses that must NOT throw despite being non-2xx (e.g. 404). */
  allowStatuses?: number[];
}

/**
 * Perform one GT_Sim API request. `baseUrl` must already be trimmed of
 * trailing slashes; `path` is backend-relative (starts with `/`).
 */
export async function gtSimFetch(
  fetchImpl: typeof fetch,
  baseUrl: string,
  method: string,
  path: string,
  timeout: number,
  options?: GtSimFetchOptions,
): Promise<Response> {
  const url = `${baseUrl}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: Record<string, string> = {};
    if (options?.contentType) {
      headers['Content-Type'] = options.contentType;
    }

    const response = await fetchImpl(url, {
      method,
      headers,
      body: options?.body,
      signal: controller.signal,
    });

    const allowed = options?.allowStatuses ?? [];
    if (!response.ok && !allowed.includes(response.status)) {
      const body = await response.text().catch(() => undefined);
      throw new GtSimApiError(
        `GT_Sim API error: ${method} ${path} returned ${response.status}`,
        response.status,
        body,
      );
    }

    return response;
  } catch (error) {
    if (error instanceof GtSimApiError) throw error;

    const message =
      error instanceof Error && error.name === 'AbortError'
        ? `GT_Sim API timeout: ${method} ${path} (${timeout}ms)`
        : `GT_Sim API network error: ${method} ${path}`;

    throw new GtSimNetworkError(message, error instanceof Error ? error : undefined);
  } finally {
    clearTimeout(timer);
  }
}

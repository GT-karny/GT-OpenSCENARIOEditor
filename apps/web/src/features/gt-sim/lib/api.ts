/**
 * GT_Sim API access layer — shared by every execution-mode cluster (B–G).
 *
 * Bridges the connection store (`stores/gt-sim-connection-store`, which owns
 * the resolved backend endpoints) and the `@osce/esmini` REST/WS clients
 * (which take an injected absolute base URL). Clusters never construct
 * `GtSimApiClient` or derive WS URLs themselves — they go through this module
 * so endpoint changes (backend restart on a new port, manual dev endpoint)
 * propagate uniformly.
 *
 * Layer rule: no UI strings live here (no i18n).
 */
import { useMemo } from 'react';
import { GtSimApiClient } from '@osce/esmini';
import type { GtSimEndpoints } from '@osce/shared';
import { useGtSimConnectionStore } from '../stores/gt-sim-connection-store';

// --- WS URL resolution -------------------------------------------------------

/**
 * Derive a `ws(s)://` base URL from an `http(s)://` REST base URL. Trailing
 * slashes are trimmed. This is the single place the REST→WS scheme swap is
 * defined for the feature; do not re-implement it in cluster code.
 */
export function wsBaseUrlFromRest(restBaseUrl: string): string {
  const trimmed = restBaseUrl.replace(/\/+$/, '');
  return /^https:/i.test(trimmed)
    ? trimmed.replace(/^https:/i, 'wss:')
    : trimmed.replace(/^http:/i, 'ws:');
}

/**
 * Resolve the WS base URL from a set of endpoints. Prefers the explicitly
 * resolved `wsBaseUrl` (Electron main process provides it); falls back to
 * deriving it from `restBaseUrl` if it is ever absent/empty.
 */
function resolveWsBaseUrl(endpoints: GtSimEndpoints | null): string | null {
  if (!endpoints) return null;
  return endpoints.wsBaseUrl || wsBaseUrlFromRest(endpoints.restBaseUrl);
}

// --- REST client -------------------------------------------------------------

/**
 * Single-slot client cache keyed by base URL. The hook and the imperative
 * getter share it, so all consumers see the same `GtSimApiClient` instance for
 * a given endpoint, and an endpoint change (new port after backend restart)
 * transparently yields a fresh client.
 */
let cachedClient: GtSimApiClient | null = null;
let cachedBaseUrl: string | null = null;

function clientFor(restBaseUrl: string): GtSimApiClient {
  if (cachedClient === null || cachedBaseUrl !== restBaseUrl) {
    cachedClient = new GtSimApiClient({ baseUrl: restBaseUrl });
    cachedBaseUrl = restBaseUrl;
  }
  return cachedClient;
}

/** Test-only: drop the cached client so cache behavior can be asserted. */
export function resetGtSimApiCacheForTest(): void {
  cachedClient = null;
  cachedBaseUrl = null;
}

/**
 * React hook: the `GtSimApiClient` for the currently connected backend, or
 * `null` while disconnected/starting/failed/crashed (the store nulls
 * `endpoints` outside `ready`). Re-renders when the endpoint changes and
 * returns a client bound to the new base URL.
 *
 * Typical cluster usage gates queries on it:
 * `useQuery({ queryKey: ['jobs'], queryFn: () => api.getSimulations(), enabled: api !== null })`.
 */
export function useGtSimApi(): GtSimApiClient | null {
  // Primitive selector (string | null) — reference-stable, no useShallow needed.
  const restBaseUrl = useGtSimConnectionStore((s) => s.endpoints?.restBaseUrl ?? null);
  return useMemo(() => (restBaseUrl === null ? null : clientFor(restBaseUrl)), [restBaseUrl]);
}

/**
 * Imperative getter for use outside React (mutation callbacks, event handlers
 * that outlive a render, service modules). Returns the same cached instance as
 * `useGtSimApi()`, or `null` when no backend is connected. Do not hold on to
 * the returned client across await points that may span a reconnect — re-get it.
 */
export function getGtSimApi(): GtSimApiClient | null {
  const { endpoints } = useGtSimConnectionStore.getState();
  return endpoints ? clientFor(endpoints.restBaseUrl) : null;
}

// --- WS base URL accessors ---------------------------------------------------

/**
 * React hook: the `ws(s)://` base URL for the currently connected backend, or
 * `null` while disconnected. Pass it to the `@osce/esmini` stream clients
 * (`GtSimOsiClient` etc. take `wsBaseUrl` in their options) or to the
 * `gtSim*WsUrl` builders re-exported from this module's barrel.
 */
export function useGtSimWsBaseUrl(): string | null {
  return useGtSimConnectionStore((s) => resolveWsBaseUrl(s.endpoints));
}

/** Imperative counterpart of `useGtSimWsBaseUrl()` for non-React call sites. */
export function getGtSimWsBaseUrl(): string | null {
  return resolveWsBaseUrl(useGtSimConnectionStore.getState().endpoints);
}

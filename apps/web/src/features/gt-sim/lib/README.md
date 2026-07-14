# `features/gt-sim/lib/` — API access layer

Shared plumbing between the connection store and the `@osce/esmini` REST/WS
clients, used by **every** execution-mode cluster (B/C/D/E/F/G). Owned by the
trunk lane (L3) and frozen once created — other lanes import only; change
requests go to L3. This layer holds no UI strings (no i18n).

```ts
import {
  useGtSimApi,
  getGtSimApi,
  useGtSimWsBaseUrl,
  getGtSimWsBaseUrl,
  gtSimOsiWsUrl, // + gtSimVdWsUrl / gtSimSvWsUrl / gtSimPresetsWsUrl / gtSimInputWsUrl
} from '@/features/gt-sim/lib';
```

## REST — `useGtSimApi()` / `getGtSimApi()`

`useGtSimApi(): GtSimApiClient | null` returns the client for the currently
connected backend, tracking endpoint changes (backend restart on a new port
yields a fresh client). It is `null` whenever the backend is not `ready`
(disconnected / starting / failed / crashed) — gate queries on it instead of
checking connection state yourself:

```ts
const api = useGtSimApi();
const jobs = useQuery({
  queryKey: ['jobs'],
  queryFn: () => api!.getSimulations(),
  enabled: api !== null,
});
```

`getGtSimApi()` is the imperative counterpart for non-hook call sites
(mutation callbacks, service modules). Both return the **same cached
instance** per base URL. Do not stash the client in long-lived state; re-get
it where practical so reconnects are picked up.

queryKey convention: see `../query-client.ts` — resource-name-prefixed arrays
(`['jobs']`, `['job', jobId]`, `['results', jobId]`, `['presets', projectId]`,
`['config', 'execution-defaults']`) so cluster caches never collide.

## WebSocket — base URL + per-stream builders

`useGtSimWsBaseUrl(): string | null` (hook) / `getGtSimWsBaseUrl()`
(imperative) resolve the `ws(s)://` base URL from the connection store.
Combine with either style of `@osce/esmini` streaming API:

```ts
// Stream client classes take the base URL directly:
const wsBaseUrl = useGtSimWsBaseUrl();
if (wsBaseUrl) {
  const osi = new GtSimOsiClient({ wsBaseUrl, jobId }); // from '@osce/esmini'
  osi.connect();
}

// Or build a raw URL with the re-exported builders:
const url = gtSimOsiWsUrl(wsBaseUrl, jobId); // ws://…/ws/osi/{jobId}
```

Streams: OSI `/ws/osi/{jobId}`, VD `/ws/vd/{jobId}`, SV `/ws/sv/{jobId}`,
presets `/ws/presets/{projectId}`, input (send-only) `/ws/input/{jobId}`.

`wsBaseUrlFromRest(restBaseUrl)` is the canonical `http(s)` → `ws(s)` scheme
swap. It is applied automatically as a fallback when endpoints lack a
`wsBaseUrl`; clusters normally never call it, and must not re-implement it.

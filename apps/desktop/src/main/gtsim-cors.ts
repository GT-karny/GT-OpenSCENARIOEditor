/**
 * CORS bypass for GT_Sim backend REST/WS calls made from the packaged renderer.
 *
 * Root cause (see the unified-UI migration incident report): the packaged
 * renderer is served by the embedded Fastify server on a randomly assigned
 * `http://127.0.0.1:<port>` origin (`server.ts` binds with `port: 0`), which
 * never matches the GT_Sim FastAPI backend's CORS allowlist — hardcoded to
 * `http://localhost:5173` / `http://127.0.0.1:5173` (the Vite dev port) plus
 * whatever `GT_SIM_CORS_ORIGINS` lists, see
 * `GT_esmini/web/backend/main.py`. In dev the renderer's origin *is* 5173, so
 * the bug never surfaces there; in the packaged app every cross-origin
 * `fetch()` to the GT_Sim backend (`GtSimApiClient`, see
 * `packages/esmini/src/client/http-transport.ts`) fails client-side with a
 * network error — Chromium blocks the response (or the CORS preflight)
 * before the caller ever sees a status code. This is why "connect" from the
 * settings panel succeeds (`waitForHealth` in `python-server.ts` uses Node's
 * `http.get` directly, which is never subject to CORS) while every REST call
 * from a cluster panel afterwards fails.
 *
 * Fix: rewrite the CORS response headers on loopback `/api/*` and `/ws*`
 * traffic so any origin is accepted. This is safe because everything behind
 * the filter is a local backend bound to 127.0.0.1/localhost (the embedded
 * server's own API or the GT_Sim backend, spawned or externally connected, on
 * any port) and no request from `GtSimApiClient` ever carries credentials
 * (see `gtSimFetch` — no `credentials` option is set), so a wildcard
 * `Access-Control-Allow-Origin: *` is valid per the Fetch spec.
 *
 * A disallowed-origin CORS *preflight* needs one more thing: Starlette's
 * `CORSMiddleware` answers an `OPTIONS` preflight from an origin it does not
 * recognise with `400 Disallowed CORS origin` and no CORS headers at all
 * (`starlette/middleware/cors.py::preflight_response`). Chromium requires a
 * 2xx status *in addition to* matching headers to accept a preflight, so the
 * header rewrite alone is not enough — the status line is coerced to
 * `200 OK` for a failed `OPTIONS` response in the same pass.
 *
 * WebSocket connections (`ws://.../ws/osi/...` etc.) do not need this and are
 * deliberately out of scope: Starlette's `CORSMiddleware` only wraps the ASGI
 * `http` scope (`if scope["type"] != "http": ... return`), and none of the
 * GT_Sim WS route handlers validate the `Origin` header themselves, so WS
 * upgrades are already unaffected by the backend's CORS allowlist — and they
 * use the `ws://` scheme, which the `http://` URL filter below would not
 * match anyway.
 */
import type { Session } from 'electron';

/** Minimal shape of `OnHeadersReceivedListenerDetails` this module reads. */
export interface CorsRewriteInput {
  method: string;
  statusCode: number;
  responseHeaders?: Record<string, string[]>;
}

export interface CorsRewriteResult {
  responseHeaders: Record<string, string[]>;
  /** Present only when a failed preflight's status line must be coerced to 2xx. */
  statusLine?: string;
}

/** CORS response headers we own — any pre-existing value is dropped first so
 * we never end up sending two `Access-Control-Allow-Origin` headers (which
 * itself makes Chromium reject the response, per the Fetch spec's "exactly
 * one" requirement) when the backend's own CORS middleware already added one
 * (e.g. dev mode, origin `http://localhost:5173`, already allowed). */
const CORS_HEADER_NAMES = new Set([
  'access-control-allow-origin',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'access-control-allow-credentials',
  'access-control-max-age',
]);

/**
 * Pure header-rewrite logic, factored out so it is unit-testable without an
 * Electron runtime. See the module doc comment for the two things it fixes:
 * (1) a missing `Access-Control-Allow-Origin` on the actual response, and
 * (2) a `400` preflight response for an origin the backend does not
 * recognise.
 */
export function computeCorsRewrite(input: CorsRewriteInput): CorsRewriteResult {
  const headers: Record<string, string[]> = { ...(input.responseHeaders ?? {}) };
  for (const key of Object.keys(headers)) {
    if (CORS_HEADER_NAMES.has(key.toLowerCase())) {
      delete headers[key];
    }
  }

  headers['Access-Control-Allow-Origin'] = ['*'];
  headers['Access-Control-Allow-Methods'] = ['GET, POST, PUT, PATCH, DELETE, OPTIONS'];
  headers['Access-Control-Allow-Headers'] = ['*'];

  const isFailedPreflight = input.method === 'OPTIONS' && input.statusCode >= 400;
  return isFailedPreflight
    ? { responseHeaders: headers, statusLine: 'HTTP/1.1 200 OK' }
    : { responseHeaders: headers };
}

/**
 * Register the rewrite on `ses`, scoped to loopback `/api/*` REST traffic
 * (both the embedded server's own routes and the GT_Sim backend's, on any
 * port — WS is out of scope, see above). Call once per session at app
 * startup, before the window loads its first URL.
 */
export function installGtSimCorsBypass(ses: Session): void {
  ses.webRequest.onHeadersReceived(
    {
      urls: ['http://127.0.0.1:*/api/*', 'http://localhost:*/api/*'],
    },
    (details, callback) => {
      const { responseHeaders, statusLine } = computeCorsRewrite(details);
      callback(statusLine ? { cancel: false, responseHeaders, statusLine } : { cancel: false, responseHeaders });
    },
  );
}

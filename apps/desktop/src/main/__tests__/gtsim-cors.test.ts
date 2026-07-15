import { describe, it, expect } from 'vitest';
import { computeCorsRewrite } from '../gtsim-cors.js';

describe('computeCorsRewrite', () => {
  it('adds a wildcard Access-Control-Allow-Origin to a plain GET response with no CORS headers', () => {
    // Packaged app: the GT_Sim backend's CORSMiddleware never saw this
    // origin in its allowlist, so it sent no CORS headers at all.
    const result = computeCorsRewrite({
      method: 'GET',
      statusCode: 200,
      responseHeaders: { 'content-type': ['application/json'] },
    });

    expect(result.responseHeaders['Access-Control-Allow-Origin']).toEqual(['*']);
    expect(result.responseHeaders['content-type']).toEqual(['application/json']);
    expect(result.statusLine).toBeUndefined();
  });

  it('coerces a disallowed-origin OPTIONS preflight (400) to 200 OK', () => {
    // Starlette's CORSMiddleware answers a preflight from an unrecognised
    // origin with 400 and no Access-Control-Allow-Origin header.
    const result = computeCorsRewrite({
      method: 'OPTIONS',
      statusCode: 400,
      responseHeaders: { 'content-type': ['text/plain; charset=utf-8'] },
    });

    expect(result.statusLine).toBe('HTTP/1.1 200 OK');
    expect(result.responseHeaders['Access-Control-Allow-Origin']).toEqual(['*']);
    expect(result.responseHeaders['Access-Control-Allow-Methods']).toEqual([
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    ]);
    expect(result.responseHeaders['Access-Control-Allow-Headers']).toEqual(['*']);
  });

  it('does not touch the status line of a successful (allowed-origin) OPTIONS preflight', () => {
    // Dev mode: origin http://localhost:5173 is already in the backend's
    // allowlist, so the preflight already succeeds — only the headers get
    // normalized, the 200 status line is left alone.
    const result = computeCorsRewrite({
      method: 'OPTIONS',
      statusCode: 200,
      responseHeaders: {
        'Access-Control-Allow-Origin': ['http://localhost:5173'],
        Vary: ['Origin'],
      },
    });

    expect(result.statusLine).toBeUndefined();
    expect(result.responseHeaders['Access-Control-Allow-Origin']).toEqual(['*']);
  });

  it('replaces an existing Access-Control-Allow-Origin instead of duplicating it', () => {
    // Two ACAO headers on one response is itself a CORS failure (the Fetch
    // spec requires exactly one) — the dev-mode allowed-origin value must be
    // fully removed before the wildcard is added, not appended alongside it.
    const result = computeCorsRewrite({
      method: 'GET',
      statusCode: 200,
      responseHeaders: { 'Access-Control-Allow-Origin': ['http://localhost:5173'] },
    });

    const keys = Object.keys(result.responseHeaders).filter(
      (k) => k.toLowerCase() === 'access-control-allow-origin',
    );
    expect(keys).toHaveLength(1);
    expect(result.responseHeaders[keys[0]]).toEqual(['*']);
  });

  it('strips CORS header names case-insensitively so no duplicate survives under a different casing', () => {
    const result = computeCorsRewrite({
      method: 'GET',
      statusCode: 200,
      responseHeaders: { 'access-control-allow-origin': ['http://127.0.0.1:5173'] },
    });

    const keys = Object.keys(result.responseHeaders).filter(
      (k) => k.toLowerCase() === 'access-control-allow-origin',
    );
    expect(keys).toHaveLength(1);
    expect(result.responseHeaders[keys[0]]).toEqual(['*']);
  });

  it('handles a response with no responseHeaders at all', () => {
    const result = computeCorsRewrite({ method: 'GET', statusCode: 204 });

    expect(result.responseHeaders['Access-Control-Allow-Origin']).toEqual(['*']);
  });

  it('does not coerce the status line for a non-OPTIONS 4xx/5xx response', () => {
    // A genuine 404/500 from the backend (e.g. unknown job id) must stay a
    // real error — only a failed CORS *preflight* gets its status coerced.
    const result = computeCorsRewrite({ method: 'GET', statusCode: 404 });

    expect(result.statusLine).toBeUndefined();
  });
});

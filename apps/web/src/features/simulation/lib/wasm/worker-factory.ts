/**
 * Single source of truth for spawning the esmini Web Worker.
 *
 * Both the singleton simulation service and the batch-run worker pool must
 * create the SAME worker script with the SAME URL/bundler mechanics (Vite
 * rewrites `new URL('./esmini-worker.ts', import.meta.url)` at build time).
 * Centralising it here avoids two divergent spawn sites.
 */

/** Create a fresh esmini worker instance (classic worker, per esmini-worker.ts). */
export function createEsminiWorker(): Worker {
  return new Worker(new URL('./esmini-worker.ts', import.meta.url));
}

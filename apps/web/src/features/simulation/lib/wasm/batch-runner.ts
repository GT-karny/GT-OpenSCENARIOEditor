/**
 * In-browser batch execution of parameter variants through the esmini WASM
 * engine, using a pool of Web Workers.
 *
 * Each variant is materialized to an OpenSCENARIO XML string (see
 * {@link BatchRunOptions.buildXoscForVariant}), loaded into a pooled worker,
 * run to completion, judged, and then its frames are DROPPED. We deliberately
 * do NOT retain any variant's frames: a full matrix of dozens of runs would be
 * hundreds of MB. Drill-down replay instead re-runs the single selected variant
 * through the normal single-run service path (see the BatchRunDialog), which is
 * cheap relative to keeping every run resident.
 *
 * The pool reuses the SAME worker script as the interactive simulation service
 * (via {@link createEsminiWorker}); a worker loads → plays → disposes per
 * variant so state never leaks between runs.
 */

import type { ParameterVariant } from '@osce/scenario-engine';
import type { WorkerRequest, WorkerResponse, WasmScenarioObjectState } from './types.js';
import { createEsminiWorker } from './worker-factory.js';
import {
  computeBatchMetrics,
  type MetricFrame,
  DEFAULT_COLLISION_THRESHOLD_M,
} from './batch-metrics.js';

/** Terminal judgement for a single variant run. */
export type BatchRunStatus = 'passed' | 'collision' | 'error' | 'incomplete';

export interface BatchRunResult {
  /** Index of the variant within the input list (stable, matches row order). */
  index: number;
  /** The parameter assignments that produced this run. */
  params: ParameterVariant;
  /** Terminal judgement. */
  status: BatchRunStatus;
  /** Smallest center-to-center distance (m). `Infinity` when <2 entities. */
  minDistance: number;
  /** Smallest time-to-collision (s). `Infinity` when no pair ever approached. */
  minTtc: number;
  /** Simulation duration (s) the engine reported. */
  duration: number;
  /** Number of frames produced (used for diagnostics; frames are not retained). */
  frameCount: number;
  /** Collision threshold (m) used for judging this run. */
  collisionThreshold: number;
  /** Error message when `status === 'error'`. */
  error?: string;
}

export interface BatchRunOptions {
  /** Variants to run, in order. Result indices map 1:1 onto this list. */
  variants: ParameterVariant[];
  /** Materialize a variant into runnable OpenSCENARIO XML. */
  buildXoscForVariant: (variant: ParameterVariant, index: number) => string;
  /** Shared road-network XML (identical across variants). */
  xodrData?: string;
  /** Shared catalog XMLs keyed by catalog name (identical across variants). */
  catalogs?: Record<string, string>;
  /** Called after each variant finishes (any status), with counts + the result. */
  onProgress?: (progress: BatchProgress) => void;
  /** Abort remaining runs. In-flight workers are terminated. */
  signal?: AbortSignal;
  /** Override the pool size (defaults to the hardware-derived clamp). */
  poolSize?: number;
}

export interface BatchProgress {
  /** Number of variants that have finished (any status). */
  completed: number;
  /** Total number of variants. */
  total: number;
  /** The result that just completed. */
  result: BatchRunResult;
}

/** Max time (ms) to wait for a worker to confirm a scenario loaded. */
const LOAD_TIMEOUT_MS = 30_000;
/** Max time (ms) to wait for a variant's batch run to complete. */
const RUN_TIMEOUT_MS = 60_000;

/** Pool size derived from the machine, clamped to a sane range. */
export function defaultPoolSize(): number {
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined;
  const derived = (cores ?? 4) - 2;
  return Math.min(Math.max(derived, 1), 4);
}

class AbortError extends Error {
  constructor() {
    super('Batch run aborted');
    this.name = 'AbortError';
  }
}

/**
 * Project raw engine frames onto the minimal shape the metrics need. Raw WASM
 * object states carry bounding dimensions (`width`/`length`), so collision
 * judging uses real footprints when present.
 */
function toMetricFrames(
  frames: Array<{ simulationTime: number; objects: WasmScenarioObjectState[] }>,
): MetricFrame[] {
  return frames.map((f) => ({
    time: f.simulationTime,
    objects: f.objects.map((o) => ({
      id: o.id,
      x: o.x,
      y: o.y,
      length: o.length,
      width: o.width,
    })),
  }));
}

interface RawRunOutcome {
  frames: Array<{ simulationTime: number; objects: WasmScenarioObjectState[] }>;
  duration: number;
}

/**
 * Run a single variant on an already-created worker: load → play → collect the
 * one `batch-completed` message. Rejects on `error` / timeout / abort. Always
 * leaves the worker disposed and ready for the next variant.
 */
function runVariantOnWorker(
  worker: Worker,
  xoscXml: string,
  xodrData: string | undefined,
  catalogs: Record<string, string> | undefined,
  signal: AbortSignal | undefined,
): Promise<RawRunOutcome> {
  return new Promise<RawRunOutcome>((resolve, reject) => {
    let settled = false;
    let loadTimer: ReturnType<typeof setTimeout> | undefined = undefined;
    let runTimer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      if (loadTimer) clearTimeout(loadTimer);
      if (runTimer) clearTimeout(runTimer);
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      signal?.removeEventListener('abort', onAbort);
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const succeed = (outcome: RawRunOutcome) => {
      if (settled) return;
      settled = true;
      cleanup();
      // Reset the worker's scenario so the next variant loads cleanly.
      post({ type: 'dispose' });
      resolve(outcome);
    };

    const post = (msg: WorkerRequest) => worker.postMessage(msg);

    const onAbort = () => fail(new AbortError());
    const onError = (e: ErrorEvent) =>
      fail(new Error(e.message || 'Worker encountered an unrecoverable error'));

    const onMessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      switch (msg.type) {
        case 'loaded':
          if (loadTimer) clearTimeout(loadTimer);
          runTimer = setTimeout(
            () => fail(new Error(`Variant run timed out after ${RUN_TIMEOUT_MS / 1000}s`)),
            RUN_TIMEOUT_MS,
          );
          post({ type: 'play', speed: 1, fps: 30 });
          break;
        case 'batch-completed':
          succeed({ frames: msg.frames, duration: msg.duration });
          break;
        case 'error':
          fail(new Error(msg.message));
          break;
        default:
          // Ignore RoadManager / route responses — not used in batch mode.
          break;
      }
    };

    if (signal?.aborted) {
      reject(new AbortError());
      return;
    }

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    signal?.addEventListener('abort', onAbort);

    loadTimer = setTimeout(
      () => fail(new Error(`Scenario load timed out after ${LOAD_TIMEOUT_MS / 1000}s`)),
      LOAD_TIMEOUT_MS,
    );

    post({ type: 'load', xoscXml, xodrData, catalogs });
  });
}

/**
 * Judge a single variant. A run that produced zero frames is `incomplete`
 * (engine initialized but the scenario produced nothing); otherwise a detected
 * collision wins over `passed`.
 */
function judge(
  index: number,
  params: ParameterVariant,
  outcome: RawRunOutcome,
): BatchRunResult {
  const metricFrames = toMetricFrames(outcome.frames);
  const metrics = computeBatchMetrics(metricFrames);
  const frameCount = outcome.frames.length;

  const status: BatchRunStatus =
    frameCount === 0 ? 'incomplete' : metrics.collision ? 'collision' : 'passed';

  return {
    index,
    params,
    status,
    minDistance: metrics.minDistance,
    minTtc: metrics.minTtc,
    duration: outcome.duration,
    frameCount,
    collisionThreshold: metrics.collisionThreshold,
  };
}

/**
 * Run all `variants` across a worker pool, judging each and reporting progress.
 * Resolves with one {@link BatchRunResult} per variant, in input order. Frames
 * are computed then discarded — nothing is retained beyond the metrics.
 */
export async function runBatch(options: BatchRunOptions): Promise<BatchRunResult[]> {
  const { variants, buildXoscForVariant, xodrData, catalogs, onProgress, signal } = options;
  const total = variants.length;
  const results: BatchRunResult[] = new Array(total);

  if (total === 0) return results;

  const poolSize = Math.max(1, Math.min(options.poolSize ?? defaultPoolSize(), total));
  const workers: Worker[] = [];
  let nextIndex = 0;
  let completed = 0;

  const takeNext = (): number | undefined => {
    if (signal?.aborted) return undefined;
    if (nextIndex >= total) return undefined;
    return nextIndex++;
  };

  /** One worker drains variants until the queue empties or the run aborts. */
  const drain = async (worker: Worker): Promise<void> => {
    for (let index = takeNext(); index !== undefined; index = takeNext()) {
      const params = variants[index];
      let result: BatchRunResult;
      try {
        const xml = buildXoscForVariant(params, index);
        const outcome = await runVariantOnWorker(worker, xml, xodrData, catalogs, signal);
        result = judge(index, params, outcome);
      } catch (err) {
        if (err instanceof AbortError) return; // stop draining; leave slot unfilled
        result = {
          index,
          params,
          status: 'error',
          minDistance: Infinity,
          minTtc: Infinity,
          duration: 0,
          frameCount: 0,
          collisionThreshold: DEFAULT_COLLISION_THRESHOLD_M,
          error: err instanceof Error ? err.message : String(err),
        };
      }

      results[index] = result;
      completed++;
      onProgress?.({ completed, total, result });
    }
  };

  try {
    for (let i = 0; i < poolSize; i++) {
      workers.push(createEsminiWorker());
    }
    await Promise.all(workers.map((w) => drain(w)));
  } finally {
    for (const w of workers) w.terminate();
  }

  // On abort, unfilled slots stay `undefined`; compact to only finished results
  // so the caller renders exactly the runs that completed.
  return results.filter((r): r is BatchRunResult => r !== undefined);
}

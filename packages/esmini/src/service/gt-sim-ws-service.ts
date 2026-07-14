/**
 * `GtSimWsService` — WS-backed implementation of `IGtSimWsService`
 * (= `IEsminiService` + `onError`). WP1, design decision D1.
 *
 * Unlike the Node-only `GtSimService` (gRPC), this service is renderer-safe:
 * it drives the job lifecycle over the injected `GtSimApi` REST client and
 * consumes OSI frames over `/ws/osi/{jobId}` (JSON), converting each
 * `ground_truth` message to the editor's `SimulationFrame` — including
 * traffic-light and vehicle-light states (which the gRPC converter drops).
 *
 * Scenario resolution: `IEsminiService.startSimulation` receives the editor's
 * `SimulationRequest` (scenario XML), but GT_Sim executes project scenarios by
 * id. The mapping is injected: either a static `projectId`/`scenarioId` pair,
 * or a `buildRequest` callback for full control (both set on the options).
 * `execution.headless` is always sent explicitly (default `true`; opt into the
 * native window with `headless: false`). `osi.enabled` is forced on — without
 * it there is no frame stream.
 *
 * Completion detection is two-channel: the OSI stream's `end` sentinel and a
 * REST status poll (covers jobs that fail before streaming starts). Whichever
 * fires first resolves the final status via `GET /api/simulations/{jobId}` and
 * dispatches `onComplete` exactly once.
 */

import type {
  IEsminiService,
  SimulationFrame,
  SimulationRequest,
  SimulationResult,
  SimulationStatus,
  TrafficLightFrameState,
} from '@osce/shared';
import type { GtSimApi } from '../client/gt-sim-api.js';
import type { GtSimSimulationRequest } from '../client/gt-sim-api-types.js';
import {
  buildGtSimSimulationRequest,
  narrowGtSimStatus,
  type GtSimExecutionOverrides,
} from '../client/gt-sim-adapters.js';
import { isGtSimTerminal, mapGtSimStatus } from '../client/gt-sim-status.js';
import { convertOsiGroundTruthMessage } from '../converter/osi-ws-converter.js';
import { GtSimOsiClient } from '../streaming/osi-client.js';
import type { WsFactory } from '../streaming/ws-connection.js';
import { SimulationStateError } from '../errors.js';

/** `IEsminiService` + `onError` (frozen contract, gt-sim-ws-service-types.ts). */
import type { IGtSimWsService } from './gt-sim-ws-service-types.js';

export interface GtSimWsServiceOptions {
  /** REST client for the job lifecycle (base URL already injected into it). */
  api: GtSimApi;
  /** Absolute WS base URL, e.g. `ws://127.0.0.1:8000`. */
  wsBaseUrl: string;
  /**
   * GT_Sim project id + scenario id (project scenario file) to execute. Used by
   * the default request builder; ignored when `buildRequest` is provided.
   */
  projectId?: string;
  scenarioId?: string;
  /** Execution overrides merged over the unified-UI defaults (headless etc.). */
  execution?: GtSimExecutionOverrides;
  /** Parameter overrides forwarded to the job (default builder only). */
  paramOverrides?: Record<string, string>;
  /**
   * Full control over the POST /api/simulations body. Receives the editor
   * `SimulationRequest`; `osi.enabled` is forced to `true` on the result.
   */
  buildRequest?: (request: SimulationRequest) => GtSimSimulationRequest;
  /** REST status-poll interval in ms (default 1000). */
  pollIntervalMs?: number;
  /** WebSocket factory (injectable for tests / non-browser hosts). */
  webSocketFactory?: WsFactory;
}

export class GtSimWsService implements IGtSimWsService, IEsminiService {
  private status: SimulationStatus = 'idle';
  private frames: SimulationFrame[] = [];
  private error: string | undefined = undefined;
  private currentJobId: string | null = null;
  private lastTrafficLights: TrafficLightFrameState[] | undefined = undefined;
  private finished = false;

  private osiClient: GtSimOsiClient | null = null;
  private osiUnsubscribers: Array<() => void> = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  private readonly frameCallbacks = new Set<(frame: SimulationFrame) => void>();
  private readonly completeCallbacks = new Set<(result: SimulationResult) => void>();
  private readonly errorCallbacks = new Set<(error: Error) => void>();

  private readonly options: GtSimWsServiceOptions;

  constructor(options: GtSimWsServiceOptions) {
    this.options = options;
  }

  /** The GT_Sim job id of the current/last run (null before the first run). */
  get jobId(): string | null {
    return this.currentJobId;
  }

  async startSimulation(request: SimulationRequest): Promise<void> {
    // Restart semantics match EsminiWasmService: a start while running stops
    // the current run first (IEsminiService consumers do not guard restarts).
    if (this.status === 'running') {
      await this.stopSimulation();
    }

    // Reset state
    this.frames = [];
    this.error = undefined;
    this.lastTrafficLights = undefined;
    this.finished = false;

    const body = this.buildJobRequest(request);
    // OSI streaming is the frame supply — force it on.
    body.execution.osi = { ...body.execution.osi, enabled: true };

    let jobId: string;
    try {
      const job = await this.options.api.createSimulation(body);
      jobId = job.job_id;
    } catch (err) {
      this.status = 'idle';
      this.currentJobId = null;
      throw err;
    }

    this.currentJobId = jobId;
    this.status = 'running';
    this.openOsiStream(jobId);
    this.startStatusPolling(jobId);
  }

  async stopSimulation(): Promise<void> {
    // No-op when nothing is running (matches EsminiWasmService; callers do not
    // guard stop calls).
    if (this.status !== 'running') {
      return;
    }

    this.teardownStream();
    this.stopStatusPolling();

    if (this.currentJobId) {
      try {
        await this.options.api.cancelSimulation(this.currentJobId);
      } catch {
        // Best effort — the job may have already finished.
      }
    }

    this.status = 'completed';
    this.dispatchComplete();
  }

  getStatus(): SimulationStatus {
    return this.status;
  }

  getResult(): SimulationResult | null {
    if (this.status === 'idle') return null;
    return this.buildResult();
  }

  onFrame(callback: (frame: SimulationFrame) => void): () => void {
    this.frameCallbacks.add(callback);
    return () => {
      this.frameCallbacks.delete(callback);
    };
  }

  onComplete(callback: (result: SimulationResult) => void): () => void {
    this.completeCallbacks.add(callback);
    return () => {
      this.completeCallbacks.delete(callback);
    };
  }

  onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  /** Tear down everything: WS, poller, callbacks. */
  dispose(): void {
    this.teardownStream();
    this.stopStatusPolling();
    this.frameCallbacks.clear();
    this.completeCallbacks.clear();
    this.errorCallbacks.clear();
  }

  // --- Internals ---

  private buildJobRequest(request: SimulationRequest): GtSimSimulationRequest {
    if (this.options.buildRequest) {
      return this.options.buildRequest(request);
    }
    if (!this.options.scenarioId) {
      throw new SimulationStateError(
        'GtSimWsService requires either options.scenarioId or options.buildRequest ' +
          '(GT_Sim executes project scenarios by id, not inline XML)',
      );
    }
    return buildGtSimSimulationRequest({
      scenarioId: this.options.scenarioId,
      projectId: this.options.projectId,
      execution: this.options.execution,
      paramOverrides: this.options.paramOverrides,
    });
  }

  private openOsiStream(jobId: string): void {
    const client = new GtSimOsiClient({
      wsBaseUrl: this.options.wsBaseUrl,
      jobId,
      webSocketFactory: this.options.webSocketFactory,
      // A transient WS drop must not permanently stop live frames while the
      // job is still running: reconnect until the job reaches a terminal
      // state. A backend-signalled `end`/stream error never reconnects (the
      // connection latches), and finish() disposes the client entirely.
      autoReconnect: true,
    });
    this.osiClient = client;

    this.osiUnsubscribers.push(
      client.onGroundTruth((msg) => {
        const frame = convertOsiGroundTruthMessage(msg);
        // Hold the last known traffic-light phases across frames that omit
        // them, so consumers see a stable overlay (fork parity).
        if (frame.trafficLightStates !== undefined) {
          this.lastTrafficLights = frame.trafficLightStates;
        } else if (this.lastTrafficLights !== undefined) {
          frame.trafficLightStates = this.lastTrafficLights;
        }
        this.frames.push(frame);
        for (const cb of this.frameCallbacks) cb(frame);
      }),
      client.onError((err) => {
        for (const cb of this.errorCallbacks) cb(err);
      }),
      client.onStateChange((state) => {
        // With autoReconnect, 'disconnected' only means a backend-signalled
        // `end` (transient drops surface as 'connecting') -> resolve the
        // final job status via REST.
        if (state === 'disconnected' && this.status === 'running') {
          void this.checkJobStatus(jobId, true);
        }
      }),
    );

    client.connect();
  }

  private startStatusPolling(jobId: string): void {
    const interval = this.options.pollIntervalMs ?? 1000;
    this.pollTimer = setInterval(() => {
      void this.checkJobStatus(jobId, false);
    }, interval);
  }

  private stopStatusPolling(): void {
    if (this.pollTimer != null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Check the job status via REST and finish() when it is terminal.
   *
   * `failOnFetchError` selects the two call sites' error policies:
   *  - polling tick (`false`): a transient fetch failure is ignored — the WS
   *    channel and the next tick still cover us;
   *  - stream-close resolution (`true`): the WS is gone, so an unreachable
   *    backend means the run can only be reported as an error.
   * When the job is still live (non-terminal), nothing happens — the OSI
   * client keeps reconnecting and the poller keeps watching.
   */
  private async checkJobStatus(jobId: string, failOnFetchError: boolean): Promise<void> {
    if (this.finished) return;
    try {
      const job = await this.options.api.getSimulation(jobId);
      const raw = narrowGtSimStatus(job.status);
      if (isGtSimTerminal(raw)) {
        this.finish(mapGtSimStatus(raw), job.error_message ?? undefined);
      }
    } catch (err) {
      if (failOnFetchError) {
        this.finish('error', err instanceof Error ? err.message : String(err));
      }
    }
  }

  private finish(status: SimulationStatus, errorMessage?: string): void {
    if (this.finished) return;
    this.finished = true;
    this.status = status;
    if (status === 'error' && errorMessage) this.error = errorMessage;
    this.teardownStream();
    this.stopStatusPolling();
    this.dispatchComplete();
  }

  private dispatchComplete(): void {
    this.finished = true;
    const result = this.buildResult();
    for (const cb of this.completeCallbacks) cb(result);
  }

  private teardownStream(): void {
    for (const unsub of this.osiUnsubscribers) unsub();
    this.osiUnsubscribers = [];
    if (this.osiClient) {
      this.osiClient.dispose();
      this.osiClient = null;
    }
  }

  private buildResult(): SimulationResult {
    const duration =
      this.frames.length > 0 ? this.frames[this.frames.length - 1].time - this.frames[0].time : 0;
    return {
      status: this.status,
      frames: this.frames,
      duration,
      error: this.error,
    };
  }
}

import type {
  IEsminiService,
} from '@osce/shared';
import type {
  SimulationRequest,
  SimulationResult,
  SimulationFrame,
  SimulationStatus,
} from '@osce/shared';
import type { GtSimConfig } from '../client/types.js';
import { GtSimRestClient } from '../client/gt-sim-rest-client.js';
import { GtSimGrpcClient } from '../client/gt-sim-grpc-client.js';
import { SimulationStateError } from '../errors.js';

/**
 * IEsminiService implementation backed by GT_Sim REST API + gRPC streaming.
 *
 * Orchestrates scenario upload, simulation lifecycle, real-time gRPC frame
 * streaming, frame buffering, and callback dispatch.
 */
export class GtSimService implements IEsminiService {
  private status: SimulationStatus = 'idle';
  private currentJobId: string | null = null;
  private frames: SimulationFrame[] = [];
  private error: string | undefined = undefined;

  private frameCallbacks = new Set<(frame: SimulationFrame) => void>();
  private completeCallbacks = new Set<(result: SimulationResult) => void>();
  private cancelStream: (() => void) | null = null;

  private readonly restClient: GtSimRestClient;
  private readonly grpcClient: GtSimGrpcClient;

  constructor(config: GtSimConfig) {
    this.restClient = new GtSimRestClient(config);
    this.grpcClient = new GtSimGrpcClient(config);
  }

  /**
   * Start a simulation:
   * 1. Upload scenarioXml → scenario_id
   * 2. Create simulation with OSI enabled → job_id
   * 3. Open gRPC stream → buffer frames + dispatch callbacks
   */
  async startSimulation(request: SimulationRequest): Promise<void> {
    if (this.status === 'running') {
      throw new SimulationStateError('Simulation is already running');
    }

    // Reset state
    this.frames = [];
    this.error = undefined;

    try {
      // Step 1: Upload scenario
      const uploadResult = await this.restClient.uploadScenario(request.scenarioXml);
      const scenarioId = uploadResult.scenario_id;

      // Step 2: Create simulation
      const simResult = await this.restClient.createSimulation(scenarioId);
      this.currentJobId = simResult.job_id;
    } catch (err) {
      // REST calls failed — remain idle
      this.status = 'idle';
      this.currentJobId = null;
      throw err;
    }

    // Both REST calls succeeded — transition to running
    this.status = 'running';

    // Step 3: Start gRPC stream
    this.cancelStream = this.grpcClient.startStream(
      (frame) => {
        this.frames.push(frame);
        for (const cb of this.frameCallbacks) {
          cb(frame);
        }
      },
      (err) => {
        this.status = 'error';
        this.error = err.message;
        this.cancelStream = null;
        const result = this.buildResult();
        for (const cb of this.completeCallbacks) {
          cb(result);
        }
      },
      () => {
        if (this.status === 'running') {
          this.status = 'completed';
        }
        this.cancelStream = null;
        const result = this.buildResult();
        for (const cb of this.completeCallbacks) {
          cb(result);
        }
      },
    );
  }

  /** Stop the running simulation. */
  async stopSimulation(): Promise<void> {
    if (this.status !== 'running') {
      throw new SimulationStateError('No simulation is running');
    }

    // Cancel gRPC stream
    if (this.cancelStream) {
      this.cancelStream();
      this.cancelStream = null;
    }

    // Delete simulation job (best effort)
    if (this.currentJobId) {
      try {
        await this.restClient.deleteSimulation(this.currentJobId);
      } catch {
        // Best effort — server may have already finished
      }
    }

    this.status = 'completed';
  }

  /** Get current simulation status. */
  getStatus(): SimulationStatus {
    return this.status;
  }

  /** Get simulation result with all buffered frames. */
  getResult(): SimulationResult | null {
    if (this.status === 'idle') return null;
    return this.buildResult();
  }

  /**
   * Register a callback for each received frame.
   * Returns an unsubscribe function.
   */
  onFrame(callback: (frame: SimulationFrame) => void): () => void {
    this.frameCallbacks.add(callback);
    return () => {
      this.frameCallbacks.delete(callback);
    };
  }

  /**
   * Register a callback for simulation completion.
   * Returns an unsubscribe function.
   */
  onComplete(callback: (result: SimulationResult) => void): () => void {
    this.completeCallbacks.add(callback);
    return () => {
      this.completeCallbacks.delete(callback);
    };
  }

  /** Dispose all resources: close gRPC channel, clear callbacks. */
  dispose(): void {
    if (this.cancelStream) {
      this.cancelStream();
      this.cancelStream = null;
    }
    this.grpcClient.close();
    this.frameCallbacks.clear();
    this.completeCallbacks.clear();
  }

  private buildResult(): SimulationResult {
    const duration =
      this.frames.length > 0
        ? this.frames[this.frames.length - 1].time - this.frames[0].time
        : 0;

    return {
      status: this.status,
      frames: this.frames,
      duration,
      error: this.error,
    };
  }
}

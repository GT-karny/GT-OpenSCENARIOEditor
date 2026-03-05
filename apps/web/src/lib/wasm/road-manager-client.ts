/**
 * Main-thread client for the esmini RoadManager WASM module.
 *
 * Provides a Promise-based API for road/lane/world coordinate conversion.
 * Communicates with the esmini Web Worker via the WorkerRequest/WorkerResponse protocol.
 *
 * Usage:
 *   const client = new RoadManagerClient(worker);
 *   await client.loadOpenDrive(xodrXml);
 *   const pos = await client.laneToWorld(0, -1, 50, 0);
 *   console.log(pos.x, pos.y, pos.z);
 *   client.dispose();
 */

import type { WorkerRequest, WorkerResponse, WasmRMPositionResult } from './types.js';

type PendingResolve<T> = {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

let requestCounter = 0;
function nextRequestId(): string {
  return `rm-${++requestCounter}`;
}

export class RoadManagerClient {
  private worker: Worker;
  private pendingPosition = new Map<string, PendingResolve<WasmRMPositionResult>>();
  private pendingScalar = new Map<string, PendingResolve<number>>();
  private loadResolve: PendingResolve<void> | null = null;
  private disposed = false;
  private boundHandler: (event: MessageEvent<WorkerResponse>) => void;

  constructor(worker: Worker) {
    this.worker = worker;
    this.boundHandler = this.handleMessage.bind(this);
    this.worker.addEventListener('message', this.boundHandler);
  }

  private handleMessage(event: MessageEvent<WorkerResponse>) {
    const msg = event.data;
    switch (msg.type) {
      case 'rm-loaded':
        if (this.loadResolve) {
          this.loadResolve.resolve();
          this.loadResolve = null;
        }
        break;
      case 'rm-position': {
        const pending = this.pendingPosition.get(msg.requestId);
        if (pending) {
          this.pendingPosition.delete(msg.requestId);
          pending.resolve(msg.result);
        }
        break;
      }
      case 'rm-scalar': {
        const pending = this.pendingScalar.get(msg.requestId);
        if (pending) {
          this.pendingScalar.delete(msg.requestId);
          pending.resolve(msg.value);
        }
        break;
      }
      case 'rm-error': {
        const error = new Error(msg.message);
        if (msg.requestId) {
          const posPending = this.pendingPosition.get(msg.requestId);
          if (posPending) {
            this.pendingPosition.delete(msg.requestId);
            posPending.reject(error);
            break;
          }
          const scalarPending = this.pendingScalar.get(msg.requestId);
          if (scalarPending) {
            this.pendingScalar.delete(msg.requestId);
            scalarPending.reject(error);
            break;
          }
        }
        // Load error
        if (this.loadResolve) {
          this.loadResolve.reject(error);
          this.loadResolve = null;
        }
        break;
      }
    }
  }

  private post(msg: WorkerRequest) {
    if (this.disposed) throw new Error('RoadManagerClient is disposed');
    this.worker.postMessage(msg);
  }

  /**
   * Load an OpenDRIVE road network from XML string.
   * Must be called before any coordinate conversion.
   */
  async loadOpenDrive(xodrXml: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.loadResolve = { resolve, reject };
      this.post({ type: 'rm-load-odr', xodrXml });
    });
  }

  /** Convert lane position to world coordinates. */
  async laneToWorld(
    roadId: number,
    laneId: number,
    s: number,
    offset = 0,
  ): Promise<WasmRMPositionResult> {
    const requestId = nextRequestId();
    return new Promise<WasmRMPositionResult>((resolve, reject) => {
      this.pendingPosition.set(requestId, { resolve, reject });
      this.post({ type: 'rm-lane-to-world', roadId, laneId, s, offset, requestId });
    });
  }

  /** Convert world (x, y) to nearest road/lane coordinates. */
  async worldToLane(x: number, y: number): Promise<WasmRMPositionResult> {
    const requestId = nextRequestId();
    return new Promise<WasmRMPositionResult>((resolve, reject) => {
      this.pendingPosition.set(requestId, { resolve, reject });
      this.post({ type: 'rm-world-to-lane', x, y, requestId });
    });
  }

  /** Convert track position (road s, t) to world coordinates. */
  async trackToWorld(roadId: number, s: number, t: number): Promise<WasmRMPositionResult> {
    const requestId = nextRequestId();
    return new Promise<WasmRMPositionResult>((resolve, reject) => {
      this.pendingPosition.set(requestId, { resolve, reject });
      this.post({ type: 'rm-track-to-world', roadId, s, t, requestId });
    });
  }

  /** Get the length of a road. Returns -1 if not found. */
  async getRoadLength(roadId: number): Promise<number> {
    const requestId = nextRequestId();
    return new Promise<number>((resolve, reject) => {
      this.pendingScalar.set(requestId, { resolve, reject });
      this.post({ type: 'rm-road-length', roadId, requestId });
    });
  }

  /** Get the width of a lane at a given s coordinate. */
  async getLaneWidth(roadId: number, laneId: number, s: number): Promise<number> {
    const requestId = nextRequestId();
    return new Promise<number>((resolve, reject) => {
      this.pendingScalar.set(requestId, { resolve, reject });
      this.post({ type: 'rm-lane-width', roadId, laneId, s, requestId });
    });
  }

  /** Get the total number of roads in the loaded network. */
  async getNumberOfRoads(): Promise<number> {
    const requestId = nextRequestId();
    return new Promise<number>((resolve, reject) => {
      this.pendingScalar.set(requestId, { resolve, reject });
      this.post({ type: 'rm-road-count', requestId });
    });
  }

  /** Get the number of lanes at a given s on a road. */
  async getNumberOfLanes(roadId: number, s: number): Promise<number> {
    const requestId = nextRequestId();
    return new Promise<number>((resolve, reject) => {
      this.pendingScalar.set(requestId, { resolve, reject });
      this.post({ type: 'rm-lane-count', roadId, s, requestId });
    });
  }

  /** Clean up event listener. Call when no longer needed. */
  dispose() {
    this.disposed = true;
    this.worker.removeEventListener('message', this.boundHandler);

    // Reject all pending promises
    const error = new Error('RoadManagerClient disposed');
    for (const pending of this.pendingPosition.values()) pending.reject(error);
    for (const pending of this.pendingScalar.values()) pending.reject(error);
    if (this.loadResolve) this.loadResolve.reject(error);

    this.pendingPosition.clear();
    this.pendingScalar.clear();
    this.loadResolve = null;
  }
}

/**
 * Browser-side esmini WASM service.
 *
 * Implements IEsminiService by communicating with an esmini Web Worker.
 * Converts WASM-native types to the shared SimulationFrame/StoryBoardEvent types.
 */

import type {
  IEsminiService,
  SimulationRequest,
  SimulationFrame,
  SimulationResult,
  SimulationStatus,
  SimulationObjectState,
  StoryBoardEvent,
  StoryBoardElementType,
  StoryBoardElementState,
  ConditionEvent,
} from '@osce/shared';
import type {
  WorkerRequest,
  WorkerResponse,
  WasmScenarioObjectState,
  WasmStoryBoardEvent,
} from './types.js';

/** Maximum time (ms) to wait for worker to confirm scenario loaded */
const LOAD_TIMEOUT_MS = 30_000;

// Map C++ enum values to TypeScript string unions
const ELEMENT_TYPE_MAP: Record<number, StoryBoardElementType> = {
  1: 'storyboard',
  2: 'story',
  3: 'act',
  4: 'maneuverGroup',
  5: 'maneuver',
  6: 'event',
  7: 'action',
};

const ELEMENT_STATE_MAP: Record<number, StoryBoardElementState> = {
  0: 'init',
  1: 'standby',
  2: 'running',
  3: 'complete',
};

function convertObjectState(wasm: WasmScenarioObjectState): SimulationObjectState {
  return {
    id: wasm.id,
    name: wasm.name.replace(/\0+$/, ''), // Trim null chars from fixed-length C string
    x: wasm.x,
    y: wasm.y,
    z: wasm.z,
    h: wasm.h,
    p: wasm.p,
    r: wasm.r,
    speed: wasm.speed,
    wheel_angle: wasm.wheel_angle,
    wheel_rot: wasm.wheel_rot,
    model_id: wasm.model_id,
    roadId: wasm.road_id,
    laneId: wasm.lane_id,
    s: wasm.s,
    t: wasm.t,
  };
}

function convertStoryBoardEvent(wasm: WasmStoryBoardEvent): StoryBoardEvent {
  return {
    name: wasm.name,
    elementType: ELEMENT_TYPE_MAP[wasm.type] ?? 'action',
    state: ELEMENT_STATE_MAP[wasm.state] ?? 'init',
    fullPath: wasm.fullPath,
    timestamp: wasm.timestamp,
  };
}

function convertConditionEvent(wasm: { name: string; timestamp: number }): ConditionEvent {
  return {
    name: wasm.name,
    timestamp: wasm.timestamp,
  };
}

export class EsminiWasmService implements IEsminiService {
  private worker: Worker | null = null;
  private status: SimulationStatus = 'idle';
  private frames: SimulationFrame[] = [];
  private result: SimulationResult | null = null;
  private frameCallbacks: Array<(frame: SimulationFrame) => void> = [];
  private completeCallbacks: Array<(result: SimulationResult) => void> = [];
  private storyBoardCallbacks: Array<(event: StoryBoardEvent) => void> = [];
  private conditionCallbacks: Array<(event: ConditionEvent) => void> = [];
  private batchStoryBoardCallbacks: Array<(events: StoryBoardEvent[]) => void> = [];
  private batchConditionCallbacks: Array<(events: ConditionEvent[]) => void> = [];
  private errorCallbacks: Array<(error: string) => void> = [];

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('./esmini-worker.ts', import.meta.url),
      );
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(e.data);
      };
      this.worker.onerror = (e) => {
        this.status = 'error';
        const message = e.message ?? 'Worker encountered an unrecoverable error';
        console.error('[EsminiWasmService] Worker error:', e);
        for (const cb of this.errorCallbacks) {
          cb(message);
        }
      };
    }
    return this.worker;
  }

  private send(msg: WorkerRequest) {
    this.ensureWorker().postMessage(msg);
  }

  private handleWorkerMessage(msg: WorkerResponse) {
    switch (msg.type) {
      case 'loaded':
        this.status = 'running';
        break;

      case 'frame': {
        const frame: SimulationFrame = {
          time: msg.simulationTime,
          objects: msg.objects.map(convertObjectState),
          trafficLightStates: msg.trafficLightStates.map((tl) => ({
            signalId: tl.id,
            state: tl.state,
          })),
          vehicleLightStates: msg.vehicleLightStates?.map((vl) => ({
            name: vl.name,
            indicator: vl.indicator as 'off' | 'left' | 'right' | 'warning',
            headLight: vl.head_light !== 'off',
            highBeam: vl.high_beam !== 'off',
            brakeLight: vl.brake_light !== 'off',
          })),
        };
        this.frames.push(frame);

        for (const cb of this.frameCallbacks) {
          cb(frame);
        }

        // Emit storyboard events
        for (const wasmEvent of msg.storyBoardEvents) {
          const event = convertStoryBoardEvent(wasmEvent);
          for (const cb of this.storyBoardCallbacks) {
            cb(event);
          }
        }

        // Emit condition events
        for (const wasmEvent of msg.conditionEvents) {
          const event = convertConditionEvent(wasmEvent);
          for (const cb of this.conditionCallbacks) {
            cb(event);
          }
        }

        if (msg.isComplete) {
          this.completeSimulation(msg.simulationTime);
        }
        break;
      }

      case 'completed':
        this.completeSimulation(msg.simulationTime);
        break;

      case 'batch-completed': {
        // Convert all frames at once
        const convertedFrames: SimulationFrame[] = msg.frames.map((f) => ({
          time: f.simulationTime,
          objects: f.objects.map(convertObjectState),
          trafficLightStates: f.trafficLightStates.map((tl) => ({
            signalId: tl.id,
            state: tl.state,
          })),
          vehicleLightStates: f.vehicleLightStates?.map((vl) => ({
            name: vl.name,
            indicator: vl.indicator as 'off' | 'left' | 'right' | 'warning',
            headLight: vl.head_light !== 'off',
            highBeam: vl.high_beam !== 'off',
            brakeLight: vl.brake_light !== 'off',
          })),
        }));
        this.frames = convertedFrames;

        console.warn(
          `[EsminiWasmService] Batch completed: ${convertedFrames.length} frames, ` +
            `time range: 0 – ${msg.duration.toFixed(2)}s, ` +
            `${msg.storyBoardEvents.length} storyboard events, ` +
            `${msg.conditionEvents.length} condition events`,
        );

        if (convertedFrames.length > 0) {
          const firstFrame = convertedFrames[0];
          console.warn(
            `[EsminiWasmService] Entity names in first frame: [${firstFrame.objects.map((o) => JSON.stringify(o.name)).join(', ')}]`,
          );
        }

        // Emit batch storyboard events
        const sbEvents = msg.storyBoardEvents.map(convertStoryBoardEvent);
        for (const cb of this.batchStoryBoardCallbacks) {
          cb(sbEvents);
        }

        // Emit batch condition events
        const condEvents = msg.conditionEvents.map(convertConditionEvent);
        for (const cb of this.batchConditionCallbacks) {
          cb(condEvents);
        }

        // Complete
        this.completeSimulation(msg.duration);
        break;
      }

      case 'error':
        this.status = 'error';
        console.error('[EsminiWasmService]', msg.message);
        for (const cb of this.errorCallbacks) {
          cb(msg.message);
        }
        break;
    }
  }

  private completeSimulation(duration: number) {
    if (this.status === 'completed') return; // Prevent double-fire
    this.status = 'completed';
    this.result = {
      status: 'completed',
      frames: this.frames,
      duration,
    };
    for (const cb of this.completeCallbacks) {
      cb(this.result);
    }
  }

  // --- IEsminiService implementation ---

  async startSimulation(request: SimulationRequest): Promise<void> {
    if (this.status === 'running') {
      await this.stopSimulation();
    }

    this.status = 'idle';
    this.result = null;
    this.frames = [];

    this.send({
      type: 'load',
      xoscXml: request.scenarioXml,
      xodrData: request.xodrXml,
      catalogs: request.catalogXmls,
    });

    // Wait for 'loaded' response with timeout
    await new Promise<void>((resolve, reject) => {
      let settled = false;

      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.worker?.removeEventListener('message', handler);
        this.status = 'error';
        reject(new Error(`Scenario load timed out after ${LOAD_TIMEOUT_MS / 1000}s`));
      }, LOAD_TIMEOUT_MS);

      const handler = (e: MessageEvent<WorkerResponse>) => {
        if (settled) return;
        if (e.data.type === 'loaded') {
          settled = true;
          clearTimeout(timeoutId);
          this.worker?.removeEventListener('message', handler);
          resolve();
        } else if (e.data.type === 'error') {
          settled = true;
          clearTimeout(timeoutId);
          this.worker?.removeEventListener('message', handler);
          reject(new Error(e.data.message));
        }
      };
      this.ensureWorker().addEventListener('message', handler);
    });

    // Start continuous playback
    const fps = 30;
    const speed = 1;
    this.send({ type: 'play', speed, fps });
  }

  async stopSimulation(): Promise<void> {
    this.send({ type: 'pause' });
    this.send({ type: 'dispose' });

    if (this.status === 'running' || this.status === 'error') {
      const duration = this.frames.length > 0 ? this.frames[this.frames.length - 1].time : 0;
      this.completeSimulation(duration);
    }
  }

  getStatus(): SimulationStatus {
    return this.status;
  }

  getResult(): SimulationResult | null {
    return this.result;
  }

  onFrame(callback: (frame: SimulationFrame) => void): () => void {
    this.frameCallbacks.push(callback);
    return () => {
      const idx = this.frameCallbacks.indexOf(callback);
      if (idx !== -1) this.frameCallbacks.splice(idx, 1);
    };
  }

  onComplete(callback: (result: SimulationResult) => void): () => void {
    this.completeCallbacks.push(callback);
    return () => {
      const idx = this.completeCallbacks.indexOf(callback);
      if (idx !== -1) this.completeCallbacks.splice(idx, 1);
    };
  }

  // --- Extended API (storyboard introspection & error, not in IEsminiService) ---

  onError(callback: (error: string) => void): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      const idx = this.errorCallbacks.indexOf(callback);
      if (idx !== -1) this.errorCallbacks.splice(idx, 1);
    };
  }

  onStoryBoardEvent(callback: (event: StoryBoardEvent) => void): () => void {
    this.storyBoardCallbacks.push(callback);
    return () => {
      const idx = this.storyBoardCallbacks.indexOf(callback);
      if (idx !== -1) this.storyBoardCallbacks.splice(idx, 1);
    };
  }

  onConditionEvent(callback: (event: ConditionEvent) => void): () => void {
    this.conditionCallbacks.push(callback);
    return () => {
      const idx = this.conditionCallbacks.indexOf(callback);
      if (idx !== -1) this.conditionCallbacks.splice(idx, 1);
    };
  }

  onBatchStoryBoardEvents(callback: (events: StoryBoardEvent[]) => void): () => void {
    this.batchStoryBoardCallbacks.push(callback);
    return () => {
      const idx = this.batchStoryBoardCallbacks.indexOf(callback);
      if (idx !== -1) this.batchStoryBoardCallbacks.splice(idx, 1);
    };
  }

  onBatchConditionEvents(callback: (events: ConditionEvent[]) => void): () => void {
    this.batchConditionCallbacks.push(callback);
    return () => {
      const idx = this.batchConditionCallbacks.indexOf(callback);
      if (idx !== -1) this.batchConditionCallbacks.splice(idx, 1);
    };
  }

  dispose() {
    this.send({ type: 'dispose' });
    this.worker?.terminate();
    this.worker = null;
    this.frameCallbacks = [];
    this.completeCallbacks = [];
    this.storyBoardCallbacks = [];
    this.conditionCallbacks = [];
    this.batchStoryBoardCallbacks = [];
    this.batchConditionCallbacks = [];
    this.errorCallbacks = [];
  }
}

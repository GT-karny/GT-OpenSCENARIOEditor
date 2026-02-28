import { randomUUID } from 'node:crypto';
import type { IEsminiService } from '@osce/shared';
import type { SimulationRequest, SimulationFrame, SimulationResult, SimulationStatus } from '@osce/shared';
import { ValidationError } from '../utils/errors.js';

export class SimulationService {
  private sessionId: string | null = null;
  private frameCount = 0;
  private unsubFrame: (() => void) | null = null;
  private unsubComplete: (() => void) | null = null;
  private frameListeners: Array<(frame: SimulationFrame) => void> = [];
  private completeListeners: Array<(result: SimulationResult) => void> = [];

  constructor(private readonly esmini: IEsminiService) {}

  async startSimulation(request: SimulationRequest): Promise<string> {
    // Stop any existing simulation
    if (this.sessionId) {
      await this.stopSimulation(this.sessionId);
    }

    const sessionId = randomUUID();
    this.sessionId = sessionId;
    this.frameCount = 0;

    this.unsubFrame = this.esmini.onFrame((frame: SimulationFrame) => {
      this.frameCount++;
      for (const listener of this.frameListeners) {
        listener(frame);
      }
    });

    this.unsubComplete = this.esmini.onComplete((result: SimulationResult) => {
      for (const listener of this.completeListeners) {
        listener(result);
      }
    });

    await this.esmini.startSimulation(request);
    return sessionId;
  }

  async stopSimulation(sessionId: string): Promise<void> {
    if (this.sessionId !== sessionId) {
      throw new ValidationError(`Invalid session ID: ${sessionId}`);
    }

    this.unsubFrame?.();
    this.unsubComplete?.();
    this.unsubFrame = null;
    this.unsubComplete = null;

    await this.esmini.stopSimulation();
    this.sessionId = null;
  }

  async stopCurrentSimulation(): Promise<void> {
    if (this.sessionId) {
      await this.stopSimulation(this.sessionId);
    }
  }

  getStatus(): { status: SimulationStatus; frameCount: number } {
    return {
      status: this.esmini.getStatus(),
      frameCount: this.frameCount,
    };
  }

  onFrame(callback: (frame: SimulationFrame) => void): () => void {
    this.frameListeners.push(callback);
    return () => {
      const idx = this.frameListeners.indexOf(callback);
      if (idx !== -1) this.frameListeners.splice(idx, 1);
    };
  }

  onComplete(callback: (result: SimulationResult) => void): () => void {
    this.completeListeners.push(callback);
    return () => {
      const idx = this.completeListeners.indexOf(callback);
      if (idx !== -1) this.completeListeners.splice(idx, 1);
    };
  }
}

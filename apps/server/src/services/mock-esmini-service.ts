import type { IEsminiService } from '@osce/shared';
import type { SimulationRequest, SimulationFrame, SimulationResult, SimulationStatus } from '@osce/shared';

export class MockEsminiService implements IEsminiService {
  private status: SimulationStatus = 'idle';
  private result: SimulationResult | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frameCallbacks: Array<(frame: SimulationFrame) => void> = [];
  private completeCallbacks: Array<(result: SimulationResult) => void> = [];
  private frameCount = 0;
  private frames: SimulationFrame[] = [];

  async startSimulation(request: SimulationRequest): Promise<void> {
    if (this.status === 'running') {
      await this.stopSimulation();
    }

    this.status = 'running';
    this.result = null;
    this.frameCount = 0;
    this.frames = [];

    const duration = request.duration ?? 10;
    const timestep = request.config?.fixedTimestep ?? 0.1;
    const totalFrames = Math.ceil(duration / timestep);

    this.timer = setInterval(() => {
      if (this.frameCount >= totalFrames) {
        this.completeSimulation(duration);
        return;
      }

      const time = this.frameCount * timestep;
      const frame: SimulationFrame = {
        time,
        objects: [
          {
            id: 0,
            name: 'Ego',
            x: time * 10,
            y: 0,
            z: 0,
            h: 0,
            p: 0,
            r: 0,
            speed: 10,
          },
          {
            id: 1,
            name: 'Target',
            x: 100 + time * 5,
            y: 0,
            z: 0,
            h: 0,
            p: 0,
            r: 0,
            speed: 5,
          },
        ],
      };

      this.frames.push(frame);
      this.frameCount++;
      for (const cb of this.frameCallbacks) {
        cb(frame);
      }
    }, 100);
  }

  private completeSimulation(duration: number): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

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

  async stopSimulation(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.status === 'running') {
      this.status = 'completed';
      this.result = {
        status: 'completed',
        frames: this.frames,
        duration: this.frames.length > 0 ? this.frames[this.frames.length - 1].time : 0,
      };

      for (const cb of this.completeCallbacks) {
        cb(this.result);
      }
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
}

/**
 * esmini service interface.
 */

import type { SimulationRequest, SimulationResult, SimulationFrame, SimulationStatus } from '../types/esmini.js';

export interface IEsminiService {
  startSimulation(request: SimulationRequest): Promise<void>;
  stopSimulation(): Promise<void>;
  getStatus(): SimulationStatus;
  getResult(): SimulationResult | null;
  onFrame(callback: (frame: SimulationFrame) => void): () => void;
  onComplete(callback: (result: SimulationResult) => void): () => void;
}

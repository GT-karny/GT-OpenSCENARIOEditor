/**
 * Types for esmini integration.
 */

export interface EsminiConfig {
  executablePath: string;
  headless: boolean;
  fixedTimestep: number;
  recordFilePath?: string;
}

export interface SimulationRequest {
  scenarioXml: string;
  roadNetworkPath?: string;
  duration?: number;
  config?: Partial<EsminiConfig>;
}

export interface SimulationFrame {
  time: number;
  objects: SimulationObjectState[];
}

export interface SimulationObjectState {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  h: number;
  p: number;
  r: number;
  speed: number;
  wheel_angle?: number;
  wheel_rot?: number;
  model_id?: number;
  roadId?: number;
  laneId?: number;
  s?: number;
  t?: number;
}

export type SimulationStatus = 'idle' | 'running' | 'completed' | 'error';

export interface SimulationResult {
  status: SimulationStatus;
  frames: SimulationFrame[];
  duration: number;
  error?: string;
}

import type {
  SimulationRequest,
  SimulationFrame,
  SimulationResult,
  SimulationStatus,
  ScenarioDocument,
  OpenDriveDocument,
} from '@osce/shared';

// Client → Server
export type WsClientMessage =
  | { type: 'ping' }
  | { type: 'simulation:start'; payload: SimulationRequest }
  | { type: 'simulation:stop' }
  | { type: 'simulation:status' }
  | { type: 'file:open'; payload: { filePath: string; fileType: 'xosc' | 'xodr' } }
  | { type: 'file:save'; payload: { filePath: string; document: ScenarioDocument } };

// Server → Client
export type WsServerMessage =
  | { type: 'pong' }
  | { type: 'simulation:frame'; payload: SimulationFrame }
  | { type: 'simulation:complete'; payload: SimulationResult }
  | { type: 'simulation:error'; payload: { error: string } }
  | { type: 'simulation:status'; payload: { status: SimulationStatus } }
  | { type: 'file:opened'; payload: ScenarioDocument | OpenDriveDocument }
  | { type: 'file:saved'; payload: { success: boolean } }
  | { type: 'file:error'; payload: { error: string } };

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

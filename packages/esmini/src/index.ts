// Service
export { GtSimService } from './service/gt-sim-service.js';

// --- GT_Sim REST/WS contract (types-first freeze; implementation in WP1) ---

// REST client contract
export type { GtSimApi } from './client/gt-sim-api.js';
export type * from './client/gt-sim-api-types.js';

// Job-status contract + editor adapters
export type { GtSimJobStatus, EditorSimulationStatus } from './client/gt-sim-status.js';
export {
  GT_SIM_STATUS_TO_EDITOR,
  GT_SIM_WAITING_STATUSES,
  GT_SIM_TERMINAL_STATUSES,
  mapGtSimStatus,
  isGtSimWaiting,
  isGtSimTerminal,
  mapGtSimProgress,
} from './client/gt-sim-status.js';

// WS streaming contract
export type * from './streaming/types.js';
export {
  GT_SIM_INPUT_BUTTONS,
  GT_SIM_INPUT_SEND_HZ,
  gtSimOsiWsUrl,
  gtSimVdWsUrl,
  gtSimSvWsUrl,
  gtSimPresetsWsUrl,
  gtSimInputWsUrl,
} from './streaming/types.js';

// WS service contract (IEsminiService + onError)
export type { IGtSimWsService } from './service/gt-sim-ws-service-types.js';

// Types
export type { GtSimConfig } from './client/types.js';

// Errors
export {
  GtSimError,
  GtSimApiError,
  GtSimNetworkError,
  GtSimGrpcError,
  ConversionError,
  SimulationStateError,
} from './errors.js';

// Re-export shared types
export type {
  IEsminiService,
  SimulationRequest,
  SimulationResult,
  SimulationFrame,
  SimulationObjectState,
  SimulationStatus,
} from '@osce/shared';

// Service
export { GtSimService } from './service/gt-sim-service.js';

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

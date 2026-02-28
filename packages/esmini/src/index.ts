// Service
export { GtSimService } from './service/gt-sim-service.js';

// Clients
export { GtSimRestClient } from './client/gt-sim-rest-client.js';
export { GtSimGrpcClient } from './client/gt-sim-grpc-client.js';

// Converter
export { convertGroundTruth, getEntityName, computeSpeed } from './converter/ground-truth-converter.js';

// Types
export type { GtSimConfig } from './client/types.js';
export { DEFAULT_GT_SIM_CONFIG } from './client/types.js';

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

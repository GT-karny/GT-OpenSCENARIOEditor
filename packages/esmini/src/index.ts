// Node-only service: `GtSimService` (gRPC streaming via `@grpc/grpc-js` +
// Node `path`/`url`) is NOT exported from this browser-safe barrel — it
// would break the Rollup web build. Import it from '@osce/esmini/node' in
// Node-hosted consumers only. See src/node.ts for the rationale.

// --- GT_Sim REST/WS contract (types-first freeze; implementation in WP1) ---

// REST client contract
export type { GtSimApi } from './client/gt-sim-api.js';
export type * from './client/gt-sim-api-types.js';

// REST client implementation (WP1)
export { GtSimApiClient } from './client/gt-sim-api-client.js';
export type { GtSimApiClientOptions } from './client/gt-sim-api-client.js';

// Wire <-> editor adapters (WP1)
export {
  narrowGtSimStatus,
  adaptJobStatus,
  buildGtSimExecutionParams,
  buildGtSimSimulationRequest,
  DEFAULT_GT_SIM_EXECUTION,
} from './client/gt-sim-adapters.js';
export type {
  AdaptedJobStatus,
  GtSimExecutionOverrides,
  BuildGtSimSimulationRequestOptions,
} from './client/gt-sim-adapters.js';

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

// WS streaming implementation (WP1) — pure TS, React-free (hooks are Phase 2)
export { GtSimWsConnection } from './streaming/ws-connection.js';
export type {
  GtSimWsConnectionOptions,
  WsFactory,
  WsLike,
} from './streaming/ws-connection.js';
export { BaseStreamClient } from './streaming/base-stream-client.js';
export type { StreamClientOptions } from './streaming/base-stream-client.js';
export { GtSimOsiClient } from './streaming/osi-client.js';
export type { GtSimOsiClientOptions } from './streaming/osi-client.js';
export { GtSimVdClient } from './streaming/vd-client.js';
export type { GtSimVdClientOptions } from './streaming/vd-client.js';
export { GtSimSvClient } from './streaming/sv-client.js';
export type { GtSimSvClientOptions } from './streaming/sv-client.js';
export { GtSimPresetsClient } from './streaming/presets-client.js';
export type { GtSimPresetsClientOptions } from './streaming/presets-client.js';
export { GtSimInputClient } from './streaming/input-client.js';
export type { GtSimInputClientOptions } from './streaming/input-client.js';

// OSI WS frame -> SimulationFrame converter (WP1; includes light conversion)
export {
  convertOsiGroundTruthMessage,
  convertOsiObject,
  convertVehicleLights,
  convertTrafficLight,
} from './converter/osi-ws-converter.js';

// WS service contract (IEsminiService + onError)
export type { IGtSimWsService } from './service/gt-sim-ws-service-types.js';

// WS service implementation (WP1)
export { GtSimWsService } from './service/gt-sim-ws-service.js';
export type { GtSimWsServiceOptions } from './service/gt-sim-ws-service.js';

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

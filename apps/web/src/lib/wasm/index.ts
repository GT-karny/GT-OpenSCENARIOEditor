export { EsminiWasmService } from './esmini-wasm-service.js';
export { createEsminiWorker } from './worker-factory.js';
export { RoadManagerClient } from './road-manager-client.js';
export { runBatch, defaultPoolSize } from './batch-runner.js';
export type {
  BatchRunOptions,
  BatchRunResult,
  BatchRunStatus,
  BatchProgress,
} from './batch-runner.js';
export {
  computeBatchMetrics,
  DEFAULT_COLLISION_THRESHOLD_M,
  MIN_CLOSING_SPEED_MS,
} from './batch-metrics.js';
export type { BatchMetrics, MetricFrame, MetricObject } from './batch-metrics.js';
export { materializeVariant } from './variant-materialization.js';
export type { MaterializedVariant } from './variant-materialization.js';
export { classifySimError, toErrorMessage } from './sim-error.js';
export type { ClassifiedSimError, SimErrorKind } from './sim-error.js';
export {
  VFS,
  catalogNameFromXml,
  catalogVfsPath,
  rewriteLogicFilePath,
  rewriteCatalogDirectories,
  prepareScenarioForVfs,
} from './vfs-paths.js';
export type { PreparedScenario } from './vfs-paths.js';
export type {
  WorkerRequest,
  WorkerResponse,
  WasmScenarioObjectState,
  WasmStoryBoardEvent,
  WasmConditionEvent,
  WasmOpenScenarioConfig,
  WasmRMPositionResult,
} from './types.js';

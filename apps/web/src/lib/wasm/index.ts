export { EsminiWasmService } from './esmini-wasm-service.js';
export { RoadManagerClient } from './road-manager-client.js';
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

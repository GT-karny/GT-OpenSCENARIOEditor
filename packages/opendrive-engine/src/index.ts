// Store
export { createOpenDriveStore } from './store/opendrive-store.js';
export type { OpenDriveStore } from './store/opendrive-store.js';
export type { OpenDriveState } from './store/store-types.js';

// Editor Metadata Store
export { createEditorMetadataStore } from './store/editor-metadata-store.js';
export type { EditorMetadataStore, EditorMetadataState } from './store/editor-metadata-store.js';
export type {
  EditorMetadata,
  VirtualRoad,
  JunctionMetadata,
  JunctionSettings,
  LaneRoutingConfig,
} from './store/editor-metadata-types.js';
export {
  EDITOR_METADATA_VERSION,
  createDefaultEditorMetadata,
  createDefaultJunctionSettings,
  createDefaultLaneRoutingConfig,
} from './store/editor-metadata-types.js';

// Defaults
export {
  createDefaultDocument,
  createDefaultHeader,
  createDefaultLane,
  createDefaultCenterLane,
  createDefaultLaneSection,
  createRoadFromDefaults,
  createSignalFromDefaults,
  createControllerFromDefaults,
  createJunctionFromDefaults,
  createJunctionConnectionFromDefaults,
} from './store/defaults.js';

// Commands
export { BaseCommand } from './commands/base-command.js';
export { CommandHistory } from './commands/command-history.js';
export { AddRoadCommand, RemoveRoadCommand, UpdateRoadCommand } from './commands/road-commands.js';
export type { GetDoc, SetDoc, MarkDirtyRoad } from './commands/road-commands.js';
export { UpdateHeaderCommand } from './commands/header-commands.js';
export {
  AddGeometryCommand,
  RemoveGeometryCommand,
  UpdateGeometryCommand,
} from './commands/geometry-commands.js';
export {
  SetRoadLinkCommand,
  SplitRoadCommand,
  JoinRoadsCommand,
} from './commands/road-link-commands.js';
export {
  AddLaneCommand,
  RemoveLaneCommand,
  UpdateLaneCommand,
  SplitLaneSectionCommand,
} from './commands/lane-commands.js';
export {
  AddJunctionCommand,
  RemoveJunctionCommand,
  UpdateJunctionCommand,
  AddJunctionConnectionCommand,
  RemoveJunctionConnectionCommand,
} from './commands/junction-commands.js';
export type { MarkDirtyJunction } from './commands/junction-commands.js';
export {
  AddSignalCommand,
  RemoveSignalCommand,
  UpdateSignalCommand,
} from './commands/signal-commands.js';
export {
  AddControllerCommand,
  RemoveControllerCommand,
  UpdateControllerCommand,
} from './commands/controller-commands.js';
export { CompoundCommand } from './commands/compound-command.js';

// Serializers / Parsers (editor format)
export { serializeOsceJson, isOsceJsonFormat } from './serializer/osce-json-serializer.js';
export type { OsceEditorFile } from './serializer/osce-json-serializer.js';
export { parseOsceJson } from './parser/osce-json-parser.js';
export type { OsceParseResult } from './parser/osce-json-parser.js';

// Operations
export { generateRoadId, findRoadById, findRoadIndex } from './operations/road-operations.js';
export {
  createVirtualRoad,
  getVirtualRoadGeometry,
  getVirtualRoadLength,
  resolveVirtualS,
  toVirtualS,
  insertSplitSegment,
  removeMergedSegment,
  getSegmentRoads,
} from './operations/virtual-road-operations.js';

// Utils
export { nextNumericId } from './utils/id-generator.js';

// Builders
export { createRoadFromPartial } from './builders/road-builder.js';
export { DEFAULT_PRESETS } from './builders/lane-presets.js';
export type { LanePreset } from './builders/lane-presets.js';
export {
  generateConnectingRoads,
  computeRoadEndpoint,
} from './builders/connecting-road-builder.js';
export type {
  TurnType,
  ConnectingRoadSpec,
  RoadEndpoint,
} from './builders/connecting-road-builder.js';

// Junction operations
export {
  planJunctionCreation,
  getConnectingRoadIds,
  findRoadsToJoin,
} from './operations/junction-operations.js';
export type {
  CreateJunctionParams,
  JunctionCreationPlan,
  RoadSplitInfo,
} from './operations/junction-operations.js';

// Junction execution
export {
  executeJunctionCreationPlan,
  executeJunctionRemoval,
} from './operations/junction-execution.js';
export type { ExecuteJunctionResult } from './operations/junction-execution.js';

// Junction topology
export { classifyTopology } from './operations/junction-topology.js';
export type {
  JunctionTopology,
  TopologyInfo,
  ArmSide,
  JunctionArm,
} from './operations/junction-topology.js';

// Junction validation
export { validateJunctionPlan } from './validation/junction-validator.js';
export type {
  JunctionValidationResult,
  ValidationEntry,
} from './validation/junction-validator.js';

// Virtual junction operations
export {
  createVirtualJunction,
  validateVirtualJunctionRefs,
} from './operations/virtual-junction-operations.js';
export type {
  VirtualJunctionRoadRef,
  CreateVirtualJunctionParams,
  VirtualJunctionResult,
} from './operations/virtual-junction-operations.js';

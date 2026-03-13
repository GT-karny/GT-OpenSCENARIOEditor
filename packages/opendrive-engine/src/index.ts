// Store
export { createOpenDriveStore } from './store/opendrive-store.js';
export type { OpenDriveStore } from './store/opendrive-store.js';
export type { OpenDriveState } from './store/store-types.js';

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

// Operations
export { generateRoadId, findRoadById, findRoadIndex } from './operations/road-operations.js';

// Builders
export { createRoadFromPartial } from './builders/road-builder.js';
export { DEFAULT_PRESETS } from './builders/lane-presets.js';
export type { LanePreset } from './builders/lane-presets.js';

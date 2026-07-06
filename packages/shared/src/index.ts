// Types
export type * from './types/scenario.js';
export type * from './types/parameters.js';
export type * from './types/entities.js';
export type * from './types/storyboard.js';
export type * from './types/actions.js';
export type * from './types/triggers.js';
export type * from './types/positions.js';
export type * from './types/opendrive.js';
export type * from './types/catalog.js';
export type * from './types/parameter-distribution.js';
export type * from './types/component-library.js';
export type * from './types/editor.js';
export type * from './types/esmini.js';
export type * from './types/mcp.js';
export type * from './types/project.js';
export type * from './types/type-utils.js';
// Runtime constant colocated with the project types (project.json schema version).
export { PROJECT_META_SCHEMA_VERSION } from './types/project.js';
// Canonical discriminator arrays colocated with the action/condition/position
// unions (welded to those unions). `export type *` above strips these runtime
// values, so re-export them explicitly (mirrors PROJECT_META_SCHEMA_VERSION).
export { PRIVATE_ACTION_TYPES, GLOBAL_ACTION_TYPES, SCENARIO_ACTION_TYPES } from './types/actions.js';
export { ENTITY_CONDITION_TYPES, VALUE_CONDITION_TYPES } from './types/triggers.js';
export { POSITION_TYPES } from './types/positions.js';
// OpenDRIVE 1.9 enum arrays (welded to their unions; stripped by `export type *`).
export {
  ODR_LANE_DIRECTIONS,
  ODR_LANE_ADVISORIES,
  ODR_LAYER_TYPES,
  ODR_ACCESS_RESTRICTION_TYPES,
} from './types/odr-lane.js';
export { ODR_SPEED_MAX_SPECIALS } from './types/odr-common.js';

// Enums (value export: includes runtime const value arrays such as
// COORDINATE_SYSTEMS / DYNAMICS_SHAPES / RULES used to derive UI option lists)
export * from './enums/osc-enums.js';

// Constants (value export: default dev network ports)
export * from './constants/network.js';

// Utils
export * from './utils/entity-color.js';
export { generateId } from './utils/generate-id.js';

// Interfaces
export type * from './interfaces/scenario-service.js';
export type * from './interfaces/parser-service.js';
export type * from './interfaces/command.js';
export type * from './interfaces/esmini-service.js';

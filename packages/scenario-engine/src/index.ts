// Store
export { createScenarioStore } from './store/scenario-store.js';

// Action / Condition defaults (type switching)
export { defaultActionByType } from './defaults/action-defaults.js';
export { defaultEntityConditionByType, defaultValueConditionByType } from './defaults/condition-defaults.js';
export type { ScenarioStore } from './store/scenario-store.js';
export type { ScenarioState } from './store/store-types.js';

// Defaults
export {
  createDefaultDocument,
  createDefaultStoryboard,
  createDefaultTrigger,
  createDefaultConditionGroup,
  createParameterFromPartial,
  createVariableFromPartial,
  createEntityFromPartial,
  createStoryFromPartial,
  createActFromPartial,
  createManeuverGroupFromPartial,
  createManeuverFromPartial,
  createEventFromPartial,
  createActionFromPartial,
  createConditionFromPartial,
  createEntityInitActions,
  createInitPrivateAction,
} from './store/defaults.js';

// Canonical default entity definitions (single source of truth)
export {
  VEHICLE_DEFAULTS,
  DEFAULT_AXLES,
  DEFAULT_PEDESTRIAN_MODEL,
  createDefaultVehicleDefinition,
  createDefaultPedestrianDefinition,
  createDefaultMiscObjectDefinition,
} from './store/entity-defaults.js';

// Command infrastructure (single source for undo/redo; opendrive-engine re-exports)
export { BaseCommand } from './commands/base-command.js';
export { PatchCommand } from './commands/patch-command.js';
export type { PatchRecipe } from './commands/patch-command.js';
export { CommandHistory } from './commands/command-history.js';
export { CompoundCommand } from './commands/compound-command.js';
export { DuplicateEntityCommand } from './commands/entity-commands.js';

// Operations
export { getElementById, getParentOf } from './operations/tree-traversal.js';
export { findEntityRefUsages } from './operations/entity-ref-utils.js';
export type { EntityRefUsage } from './operations/entity-ref-utils.js';
export { deepCloneWithNewIds } from './operations/deep-clone.js';
export type { CloneableElementType } from './operations/deep-clone.js';
export type { EntityCleanupOption } from './commands/entity-commands.js';
export { findManeuverGroupForAction } from './operations/storyboard-operations.js';
export { generateParameterVariants, mulberry32 } from './operations/distribution-variants.js';
export type {
  ParameterVariant,
  GenerateVariantsOptions,
  GenerateVariantsResult,
} from './operations/distribution-variants.js';

// Component Engine
export { applyUseCaseComponent } from './components/component-engine.js';

// Compatibility / Feature Gating
export {
  checkFeatureGate,
  ACTION_FEATURE_REGISTRY,
  CONDITION_FEATURE_REGISTRY,
} from './compatibility/feature-registry.js';
export type { FeatureEntry } from './compatibility/feature-registry.js';

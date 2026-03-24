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

// Command History
export { CommandHistory } from './commands/command-history.js';
export { BaseCommand } from './commands/base-command.js';

// Update Commands
export {
  UpdateStoryCommand,
  UpdateActCommand,
  UpdateManeuverGroupCommand,
  UpdateManeuverCommand,
  UpdateEventCommand,
  UpdateActionCommand,
  UpdateConditionCommand,
} from './commands/update-commands.js';

// Scenario-level Commands
export {
  UpdateFileHeaderCommand,
  UpdateRoadNetworkCommand,
  UpdateCatalogLocationsCommand,
} from './commands/scenario-commands.js';

// Operations
export { getElementById, getParentOf } from './operations/tree-traversal.js';
export { deepReplaceParamRef, replaceInBindings, escapeRegex } from './operations/parameter-rename-utils.js';

// Component Engine
export { applyUseCaseComponent, reconcileComponent } from './components/component-engine.js';

// Compatibility / Feature Gating
export {
  checkFeatureGate,
  ACTION_FEATURE_REGISTRY,
  CONDITION_FEATURE_REGISTRY,
} from './compatibility/feature-registry.js';
export type { FeatureEntry } from './compatibility/feature-registry.js';

import type { UseCaseComponent, ActionComponent } from '@osce/shared';

// Import all use-case components
import { cutInUseCase } from './use-cases/cut-in.js';
import { overtakingUseCase } from './use-cases/overtaking.js';
import { pedestrianCrossingUseCase } from './use-cases/pedestrian-crossing.js';
import { emergencyBrakeUseCase } from './use-cases/emergency-brake.js';
import { followLeadVehicleUseCase } from './use-cases/follow-lead-vehicle.js';
import { laneChangeUseCase } from './use-cases/lane-change.js';
import { highwayMergeUseCase } from './use-cases/highway-merge.js';
import { decelerationToStopUseCase } from './use-cases/deceleration-to-stop.js';

// Import all action components
import { speedActionComponent } from './action-components/speed-action.js';
import { laneChangeActionComponent } from './action-components/lane-change-action.js';
import { teleportActionComponent } from './action-components/teleport-action.js';
import { longitudinalDistanceActionComponent } from './action-components/longitudinal-distance-action.js';
import { lateralDistanceActionComponent } from './action-components/lateral-distance-action.js';
import { followTrajectoryActionComponent } from './action-components/follow-trajectory-action.js';

// --- Registry arrays ---

export const useCaseComponents: UseCaseComponent[] = [
  cutInUseCase,
  overtakingUseCase,
  pedestrianCrossingUseCase,
  emergencyBrakeUseCase,
  followLeadVehicleUseCase,
  laneChangeUseCase,
  highwayMergeUseCase,
  decelerationToStopUseCase,
];

export const actionComponents: ActionComponent[] = [
  speedActionComponent,
  laneChangeActionComponent,
  teleportActionComponent,
  longitudinalDistanceActionComponent,
  lateralDistanceActionComponent,
  followTrajectoryActionComponent,
];

// --- Lookup functions ---

export function getUseCaseById(id: string): UseCaseComponent | undefined {
  return useCaseComponents.find((uc) => uc.id === id);
}

export function getUseCasesByCategory(category: string): UseCaseComponent[] {
  return useCaseComponents.filter((uc) => uc.category === category);
}

export function getActionComponentById(id: string): ActionComponent | undefined {
  return actionComponents.find((ac) => ac.id === id);
}

export function getActionComponentByType(actionType: string): ActionComponent | undefined {
  return actionComponents.find((ac) => ac.actionType === actionType);
}

// --- Re-export individual components ---

export { cutInUseCase } from './use-cases/cut-in.js';
export { overtakingUseCase } from './use-cases/overtaking.js';
export { pedestrianCrossingUseCase } from './use-cases/pedestrian-crossing.js';
export { emergencyBrakeUseCase } from './use-cases/emergency-brake.js';
export { followLeadVehicleUseCase } from './use-cases/follow-lead-vehicle.js';
export { laneChangeUseCase } from './use-cases/lane-change.js';
export { highwayMergeUseCase } from './use-cases/highway-merge.js';
export { decelerationToStopUseCase } from './use-cases/deceleration-to-stop.js';

export { speedActionComponent } from './action-components/speed-action.js';
export { laneChangeActionComponent } from './action-components/lane-change-action.js';
export { teleportActionComponent } from './action-components/teleport-action.js';
export { longitudinalDistanceActionComponent } from './action-components/longitudinal-distance-action.js';
export { lateralDistanceActionComponent } from './action-components/lateral-distance-action.js';
export { followTrajectoryActionComponent } from './action-components/follow-trajectory-action.js';

// --- Re-export helper utilities ---

export * from './helpers/id.js';
export * from './helpers/entities.js';
export * from './helpers/triggers.js';
export * from './helpers/storyboard.js';
export * from './helpers/actions.js';

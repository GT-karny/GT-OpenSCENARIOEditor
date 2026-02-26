/**
 * Component library types for the hierarchical scenario composition system.
 * Use-case level (beginner) → Action level (expert) → OpenSCENARIO elements.
 */

import type { ScenarioEntity } from './entities.js';
import type { PrivateAction } from './actions.js';
import type { Story } from './storyboard.js';
import type { OpenDriveDocument } from './opendrive.js';

// --- Use-case Component ---

export type UseCaseCategory = 'highway' | 'intersection' | 'pedestrian' | 'parking' | 'general';

export interface UseCaseComponent {
  id: string;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  category: UseCaseCategory;
  icon: string;
  parameters: ComponentParameter[];
  decompose: (params: Record<string, unknown>, context: DecompositionContext) => DecompositionResult;
  reconcile: (params: Record<string, unknown>, context: ReconciliationContext) => Record<string, unknown>;
}

// --- Action Component ---

export interface ActionComponent {
  id: string;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  actionType: string;
  parameters: ComponentParameter[];
  createAction: (params: Record<string, unknown>) => PrivateAction;
  createDefaultTrigger: (params: Record<string, unknown>) => import('./triggers.js').Trigger;
}

// --- Parameter definition ---

export type ParameterVisualHint =
  | 'slider'
  | 'speedGauge'
  | 'distanceLine'
  | 'angleArc'
  | 'timeDuration'
  | 'laneSelector'
  | 'entitySelector'
  | 'positionPicker';

export interface ComponentParameter {
  name: string;
  nameKey: string;
  type: 'number' | 'string' | 'boolean' | 'enum' | 'position' | 'entityRef';
  default: unknown;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  enumValues?: string[];
  description: string;
  descriptionKey: string;
  visualHint?: ParameterVisualHint;
}

// --- Decomposition ---

export interface DecompositionContext {
  existingEntities: ScenarioEntity[];
  roadNetwork?: OpenDriveDocument;
}

export interface DecompositionResult {
  entities: Partial<ScenarioEntity>[];
  initActions: { entityName: string; actions: PrivateAction[] }[];
  stories: Partial<Story>[];
  paramMapping: Record<string, string>;
}

export interface ReconciliationContext {
  existingEntities: ScenarioEntity[];
  roadNetwork?: OpenDriveDocument;
  relatedComponents: { id: string; params: Record<string, unknown> }[];
}

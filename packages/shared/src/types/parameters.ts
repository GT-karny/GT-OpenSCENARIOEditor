/**
 * Parameter and variable declarations for OpenSCENARIO.
 */

import type { ParameterType, Rule } from '../enums/osc-enums.js';

export interface ParameterDeclaration {
  id: string;
  name: string;
  parameterType: ParameterType;
  value: string;
  constraintGroups?: ConstraintGroup[];
}

export interface ConstraintGroup {
  constraints: ValueConstraint[];
}

export interface ValueConstraint {
  rule: ConstraintRule;
  value: string;
}

/** Alias for Rule — kept for backward compatibility with existing dependents. */
export type ConstraintRule = Rule;

export interface VariableDeclaration {
  id: string;
  name: string;
  variableType: ParameterType;
  value: string;
}

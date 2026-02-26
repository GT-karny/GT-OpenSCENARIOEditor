/**
 * Parameter and variable declarations for OpenSCENARIO.
 */

import type { ParameterType } from '../enums/osc-enums.js';

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

export type ConstraintRule = 'greaterThan' | 'lessThan' | 'equalTo' | 'notEqualTo' | 'greaterOrEqual' | 'lessOrEqual';

export interface VariableDeclaration {
  id: string;
  name: string;
  variableType: ParameterType;
  value: string;
}

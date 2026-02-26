import type {
  ParameterDeclaration,
  VariableDeclaration,
  ConstraintGroup,
  ValueConstraint,
  ParameterType,
} from '@osce/shared';
import { ensureArray } from '../utils/ensure-array.js';
import { generateId } from '../utils/uuid.js';
import { strAttr } from '../utils/xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseParameterDeclarations(raw: any): ParameterDeclaration[] {
  if (!raw) return [];
  return ensureArray(raw.ParameterDeclaration).map(parseParameterDeclaration);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseParameterDeclaration(raw: any): ParameterDeclaration {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    parameterType: strAttr(raw, 'parameterType', 'string') as ParameterType,
    value: strAttr(raw, 'value'),
    constraintGroups: raw?.ConstraintGroup
      ? ensureArray(raw.ConstraintGroup).map(parseConstraintGroup)
      : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseConstraintGroup(raw: any): ConstraintGroup {
  return {
    constraints: ensureArray(raw?.ValueConstraint).map(parseValueConstraint),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseValueConstraint(raw: any): ValueConstraint {
  return {
    rule: strAttr(raw, 'rule', 'equalTo') as ValueConstraint['rule'],
    value: strAttr(raw, 'value'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseVariableDeclarations(raw: any): VariableDeclaration[] {
  if (!raw) return [];
  return ensureArray(raw.VariableDeclaration).map(parseVariableDeclaration);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseVariableDeclaration(raw: any): VariableDeclaration {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    variableType: strAttr(raw, 'variableType', 'string') as ParameterType,
    value: strAttr(raw, 'value'),
  };
}

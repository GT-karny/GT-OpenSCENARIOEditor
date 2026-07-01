import type {
  ParameterDeclaration,
  VariableDeclaration,
  ConstraintGroup,
  ValueConstraint,
  ParameterType,
} from '@osce/shared';
import type { RawXml } from '../utils/xml-helpers.js';
import { generateId } from '@osce/shared';
import { strAttr, children, has } from '../utils/xml-helpers.js';

export function parseParameterDeclarations(raw: RawXml | undefined): ParameterDeclaration[] {
  if (!raw) return [];
  return children(raw, 'ParameterDeclaration').map(parseParameterDeclaration);
}

function parseParameterDeclaration(raw: RawXml): ParameterDeclaration {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    parameterType: strAttr(raw, 'parameterType', 'string') as ParameterType,
    value: strAttr(raw, 'value'),
    constraintGroups: has(raw, 'ConstraintGroup')
      ? children(raw, 'ConstraintGroup').map(parseConstraintGroup)
      : undefined,
  };
}

function parseConstraintGroup(raw: RawXml): ConstraintGroup {
  return {
    constraints: children(raw, 'ValueConstraint').map(parseValueConstraint),
  };
}

function parseValueConstraint(raw: RawXml): ValueConstraint {
  return {
    rule: strAttr(raw, 'rule', 'equalTo') as ValueConstraint['rule'],
    value: strAttr(raw, 'value'),
  };
}

export function parseVariableDeclarations(raw: RawXml | undefined): VariableDeclaration[] {
  if (!raw) return [];
  return children(raw, 'VariableDeclaration').map(parseVariableDeclaration);
}

function parseVariableDeclaration(raw: RawXml): VariableDeclaration {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    variableType: strAttr(raw, 'variableType', 'string') as ParameterType,
    value: strAttr(raw, 'value'),
  };
}

import type { ParameterDeclaration, VariableDeclaration } from '@osce/shared';
import { buildAttrs } from '../utils/xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildParameterDeclarations(params: ParameterDeclaration[]): any {
  if (params.length === 0) return '';
  return {
    ParameterDeclaration: params.map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = buildAttrs({
        name: p.name,
        parameterType: p.parameterType,
        value: p.value,
      });
      if (p.constraintGroups && p.constraintGroups.length > 0) {
        result.ConstraintGroup = p.constraintGroups.map((cg) => ({
          ValueConstraint: cg.constraints.map((vc) =>
            buildAttrs({ rule: vc.rule, value: vc.value }),
          ),
        }));
      }
      return result;
    }),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildVariableDeclarations(vars: VariableDeclaration[]): any {
  if (vars.length === 0) return undefined;
  return {
    VariableDeclaration: vars.map((v) =>
      buildAttrs({
        name: v.name,
        variableType: v.variableType,
        value: v.value,
      }),
    ),
  };
}

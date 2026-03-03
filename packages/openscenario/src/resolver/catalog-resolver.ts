import type {
  VehicleDefinition,
  PedestrianDefinition,
  MiscObjectDefinition,
  ParameterAssignment,
  ParameterDeclaration,
} from '@osce/shared';

type EntityDefinition = VehicleDefinition | PedestrianDefinition | MiscObjectDefinition;

/**
 * Resolve parameter assignments against a catalog entry's parameter declarations.
 * Returns a map of parameterName → effectiveValue (assignment value or default).
 */
export function resolveParameters(
  declarations: ParameterDeclaration[],
  assignments: ParameterAssignment[],
): Map<string, string> {
  const resolved = new Map<string, string>();
  const assignmentMap = new Map(assignments.map((a) => [a.parameterRef, a.value]));

  for (const decl of declarations) {
    const override = assignmentMap.get(decl.name) ?? assignmentMap.get(`$${decl.name}`);
    resolved.set(decl.name, override ?? decl.value);
  }

  return resolved;
}

/**
 * Apply parameter assignments to an entity definition, substituting $ParamName
 * references in string-valued attributes with the resolved parameter values.
 * Returns a deep copy with substitutions applied.
 */
export function applyParameterAssignments<T extends EntityDefinition>(
  definition: T,
  assignments: ParameterAssignment[],
): T {
  const resolved = resolveParameters(definition.parameterDeclarations, assignments);
  if (resolved.size === 0) return definition;

  // Deep-clone and substitute $Param references in string values
  return substituteParams(definition, resolved) as T;
}

function substituteParams(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  params: Map<string, string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Replace $ParamName references
    if (obj.startsWith('$')) {
      const paramName = obj.substring(1);
      return params.get(paramName) ?? obj;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => substituteParams(item, params));
  }

  if (typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteParams(value, params);
    }
    return result;
  }

  return obj;
}

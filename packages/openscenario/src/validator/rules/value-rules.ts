import type { ScenarioDocument, ValidationIssue } from '@osce/shared';

export function validateValueRules(
  doc: ScenarioDocument,
  errors: ValidationIssue[],
  _warnings: ValidationIssue[],
): void {
  // VAL_001: Entity numeric values
  for (const entity of doc.entities) {
    const def = entity.definition;
    if (def.kind === 'vehicle') {
      if (def.performance.maxSpeed < 0) {
        errors.push({
          code: 'VAL_001',
          message: `Vehicle "${entity.name}" has negative maxSpeed`,
          messageKey: 'validation.val001',
          severity: 'error',
          path: `entities.${entity.name}.performance.maxSpeed`,
          elementId: entity.id,
        });
      }
      // VAL_003: BoundingBox dimensions must be positive
      if (
        def.boundingBox.dimensions.width <= 0 ||
        def.boundingBox.dimensions.length <= 0 ||
        def.boundingBox.dimensions.height <= 0
      ) {
        errors.push({
          code: 'VAL_003',
          message: `Vehicle "${entity.name}" has non-positive bounding box dimensions`,
          messageKey: 'validation.val003',
          severity: 'error',
          path: `entities.${entity.name}.boundingBox`,
          elementId: entity.id,
        });
      }
    }
    if (def.kind === 'pedestrian' || def.kind === 'miscObject') {
      if (
        def.boundingBox.dimensions.width <= 0 ||
        def.boundingBox.dimensions.length <= 0 ||
        def.boundingBox.dimensions.height <= 0
      ) {
        errors.push({
          code: 'VAL_003',
          message: `Entity "${entity.name}" has non-positive bounding box dimensions`,
          messageKey: 'validation.val003',
          severity: 'error',
          path: `entities.${entity.name}.boundingBox`,
          elementId: entity.id,
        });
      }
    }
  }
}

import type { IValidator, ScenarioDocument, ValidationResult, ValidationIssue } from '@osce/shared';
import { validateStructuralRules } from './rules/structural-rules.js';
import { validateReferenceRules } from './rules/reference-rules.js';
import { validateValueRules } from './rules/value-rules.js';

export class XoscValidator implements IValidator {
  validate(doc: ScenarioDocument): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    validateStructuralRules(doc, errors, warnings);
    validateReferenceRules(doc, errors, warnings);
    validateValueRules(doc, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

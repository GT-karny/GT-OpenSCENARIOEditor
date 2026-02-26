/**
 * Parser and serializer interfaces.
 */

import type { ScenarioDocument } from '../types/scenario.js';
import type { OpenDriveDocument } from '../types/opendrive.js';

export interface IXoscParser {
  parse(xml: string): ScenarioDocument;
}

export interface IXoscSerializer {
  serialize(doc: ScenarioDocument): string;
  serializeFormatted(doc: ScenarioDocument): string;
}

export interface IXodrParser {
  parse(xml: string): OpenDriveDocument;
}

export interface IValidator {
  validate(doc: ScenarioDocument): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  messageKey: string;
  severity: 'error' | 'warning';
  path: string;
  elementId?: string;
}

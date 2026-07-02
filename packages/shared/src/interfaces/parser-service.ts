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

export interface IXodrSerializer {
  serialize(doc: OpenDriveDocument): string;
  serializeFormatted(doc: OpenDriveDocument): string;
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
  /**
   * Interpolation values for {@link messageKey}. Keys match the `{{...}}`
   * placeholders declared in the i18n `errors.validation` namespace so the UI
   * can render a localized message via `t(messageKey, params)`.
   */
  params?: Record<string, string | number>;
  severity: 'error' | 'warning';
  path: string;
  elementId?: string;
}

/**
 * Parser and serializer interfaces.
 */

import type { ScenarioDocument } from '../types/scenario.js';
import type { OpenDriveDocument } from '../types/opendrive.js';
import type { ParameterValueDistributionDocument } from '../types/parameter-distribution.js';

export interface IXoscParser {
  parse(xml: string): ScenarioDocument;
}

export interface IXoscSerializer {
  serialize(doc: ScenarioDocument): string;
  serializeFormatted(doc: ScenarioDocument): string;
}

/** Parser for standalone `<ParameterValueDistribution>` `.xosc` documents. */
export interface IParameterDistributionParser {
  parse(xml: string): ParameterValueDistributionDocument;
}

/** Serializer for standalone `<ParameterValueDistribution>` `.xosc` documents. */
export interface IParameterDistributionSerializer {
  serialize(doc: ParameterValueDistributionDocument): string;
  serializeFormatted(doc: ParameterValueDistributionDocument): string;
}

export interface IXodrParser {
  parse(xml: string): OpenDriveDocument;
}

/** Options controlling `.xodr` serialization output. */
export interface OdrSerializeOptions {
  /**
   * When true, and the document uses OpenDRIVE 1.9 constructs while its header
   * declares an earlier 1.x minor, emit `revMinor="9"` in the output (the store
   * document is not mutated). Default false keeps the declared version verbatim.
   */
  resolveVersion?: boolean;
}

export interface IXodrSerializer {
  serialize(doc: OpenDriveDocument): string;
  serializeFormatted(doc: OpenDriveDocument, options?: OdrSerializeOptions): string;
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

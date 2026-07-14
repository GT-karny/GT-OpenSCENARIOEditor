/**
 * Pure validation for the execution-defaults form (cluster H').
 *
 * Ported from the GT_Sim fork's inline `SettingsForm.validate()`
 * (`components/SettingsPanel.tsx`): hz/timeout must be positive, and the OSI
 * IP is only checked while OSI output is enabled. Extracted as a standalone
 * function (rather than inline component state) so it is unit-testable
 * without rendering, and returns booleans instead of message strings so the
 * caller can map failures to static i18n keys (typed i18n rejects dynamic
 * template-literal keys — see this cluster's final report).
 */
export interface ExecutionDefaultsValidationInput {
  hz: number;
  timeout: number;
  osiEnabled: boolean;
  osiIp: string;
}

export interface ExecutionDefaultsValidationResult {
  hzValid: boolean;
  timeoutValid: boolean;
  osiIpValid: boolean;
}

/** Matches the fork's IPv4-shape check (not a full validity check — same as upstream). */
const IPV4_SHAPE_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/;

export function validateExecutionDefaultsForm(
  values: ExecutionDefaultsValidationInput,
): ExecutionDefaultsValidationResult {
  return {
    hzValid: values.hz > 0,
    timeoutValid: values.timeout > 0,
    osiIpValid: !values.osiEnabled || IPV4_SHAPE_PATTERN.test(values.osiIp),
  };
}

export function isExecutionDefaultsFormValid(result: ExecutionDefaultsValidationResult): boolean {
  return result.hzValid && result.timeoutValid && result.osiIpValid;
}

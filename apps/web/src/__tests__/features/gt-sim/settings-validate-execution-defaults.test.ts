import { describe, it, expect } from 'vitest';
import {
  validateExecutionDefaultsForm,
  isExecutionDefaultsFormValid,
} from '../../../features/gt-sim/settings/lib/validate-execution-defaults';

describe('validateExecutionDefaultsForm (settings cluster)', () => {
  const base = { hz: 120, timeout: 60, osiEnabled: true, osiIp: '127.0.0.1' };

  it('accepts the fork-equivalent hardcoded defaults', () => {
    const result = validateExecutionDefaultsForm(base);
    expect(result).toEqual({ hzValid: true, timeoutValid: true, osiIpValid: true });
    expect(isExecutionDefaultsFormValid(result)).toBe(true);
  });

  it('rejects hz <= 0', () => {
    const result = validateExecutionDefaultsForm({ ...base, hz: 0 });
    expect(result.hzValid).toBe(false);
    expect(isExecutionDefaultsFormValid(result)).toBe(false);
  });

  it('rejects a negative timeout', () => {
    const result = validateExecutionDefaultsForm({ ...base, timeout: -1 });
    expect(result.timeoutValid).toBe(false);
    expect(isExecutionDefaultsFormValid(result)).toBe(false);
  });

  it('rejects a malformed OSI IP only while OSI is enabled', () => {
    const enabled = validateExecutionDefaultsForm({ ...base, osiIp: 'not-an-ip' });
    expect(enabled.osiIpValid).toBe(false);

    // Fork behavior: the IP field is not validated while OSI output is off.
    const disabled = validateExecutionDefaultsForm({
      ...base,
      osiEnabled: false,
      osiIp: 'not-an-ip',
    });
    expect(disabled.osiIpValid).toBe(true);
    expect(isExecutionDefaultsFormValid(disabled)).toBe(true);
  });

  it('accepts a well-formed IPv4-shaped address', () => {
    const result = validateExecutionDefaultsForm({ ...base, osiIp: '10.0.0.255' });
    expect(result.osiIpValid).toBe(true);
  });
});

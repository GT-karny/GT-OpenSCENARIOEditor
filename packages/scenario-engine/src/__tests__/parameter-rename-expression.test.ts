import { describe, it, expect } from 'vitest';
import { deepReplaceParamRef, replaceInBindings } from '../operations/parameter-rename-utils.js';

describe('expression support in parameter rename', () => {
  describe('replaceInBindings with expressions', () => {
    it('replaces $param inside ${expr} bindings', () => {
      const bindings: Record<string, Record<string, string>> = {
        elem1: { 'target.value': '${$Speed * 0.5}' },
      };
      replaceInBindings(bindings, 'Speed', 'MaxSpeed');
      expect(bindings.elem1['target.value']).toBe('${$MaxSpeed * 0.5}');
    });

    it('replaces multiple $param refs inside one expression', () => {
      const bindings: Record<string, Record<string, string>> = {
        elem1: { value: '${$Speed + $Speed * 2}' },
      };
      replaceInBindings(bindings, 'Speed', 'V');
      expect(bindings.elem1.value).toBe('${$V + $V * 2}');
    });

    it('does not replace partial name matches', () => {
      const bindings: Record<string, Record<string, string>> = {
        elem1: { value: '${$SpeedLimit / 3.6}' },
      };
      replaceInBindings(bindings, 'Speed', 'MaxSpeed');
      expect(bindings.elem1.value).toBe('${$SpeedLimit / 3.6}');
    });

    it('handles mixed $param and ${expr} bindings', () => {
      const bindings: Record<string, Record<string, string>> = {
        elem1: { 'dynamics.value': '$Speed' },
        elem2: { 'target.value': '${$Speed / 3.6}' },
      };
      replaceInBindings(bindings, 'Speed', 'MaxSpeed');
      expect(bindings.elem1['dynamics.value']).toBe('$MaxSpeed');
      expect(bindings.elem2['target.value']).toBe('${$MaxSpeed / 3.6}');
    });
  });

  describe('deepReplaceParamRef with expressions in string values', () => {
    it('replaces $param in string values containing expression syntax', () => {
      const obj = { description: 'Speed is ${$Speed / 3.6} m/s' };
      deepReplaceParamRef(obj, 'Speed', 'MaxSpeed');
      expect(obj.description).toBe('Speed is ${$MaxSpeed / 3.6} m/s');
    });
  });
});

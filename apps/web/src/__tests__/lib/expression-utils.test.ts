import { describe, it, expect } from 'vitest';
import { isExpression, isValidExpression, isParamOrExpr, looksLikeExpression, evaluateExpression } from '../../lib/expression-utils';

describe('isExpression', () => {
  it('returns true for valid expression syntax', () => {
    expect(isExpression('${250/3.6}')).toBe(true);
    expect(isExpression('${$speed * 0.5}')).toBe(true);
    expect(isExpression('${-$Speed}')).toBe(true);
    expect(isExpression('${$X0 - $TrajRadius}')).toBe(true);
    expect(isExpression('${}')).toBe(true);
  });

  it('returns false for parameter references', () => {
    expect(isExpression('$Speed')).toBe(false);
    expect(isExpression('$EgoS')).toBe(false);
  });

  it('returns false for plain values', () => {
    expect(isExpression('10.5')).toBe(false);
    expect(isExpression('')).toBe(false);
  });

  it('returns false for incomplete expressions', () => {
    expect(isExpression('${abc')).toBe(false);
    expect(isExpression('${')).toBe(false);
  });
});

describe('isValidExpression', () => {
  it('validates XSD v1.3.1 compliant expressions', () => {
    expect(isValidExpression('${250/3.6}')).toBe(true);
    expect(isValidExpression('${$speed * 0.5}')).toBe(true);
    expect(isValidExpression('${-$Speed}')).toBe(true);
    expect(isValidExpression('${$X0 - $TrajRadius}')).toBe(true);
    expect(isValidExpression('${-1.0/$TrajRadius}')).toBe(true);
    expect(isValidExpression('${0.25 * 2.0 * 3.141592 * $TrajRadius}')).toBe(true);
  });

  it('rejects expressions with invalid characters', () => {
    expect(isValidExpression('${invalid; chars}')).toBe(false);
    expect(isValidExpression('${foo = bar}')).toBe(false);
    expect(isValidExpression('${alert("xss")}')).toBe(false);
  });

  it('rejects non-expression strings', () => {
    expect(isValidExpression('$Speed')).toBe(false);
    expect(isValidExpression('10.5')).toBe(false);
    expect(isValidExpression('')).toBe(false);
  });
});

describe('isParamOrExpr', () => {
  it('returns true for parameter references', () => {
    expect(isParamOrExpr('$Speed')).toBe(true);
  });

  it('returns true for expressions', () => {
    expect(isParamOrExpr('${250/3.6}')).toBe(true);
  });

  it('returns false for plain values', () => {
    expect(isParamOrExpr('10.5')).toBe(false);
    expect(isParamOrExpr('')).toBe(false);
  });
});

describe('looksLikeExpression', () => {
  it('detects arithmetic operators', () => {
    expect(looksLikeExpression('250/3.6')).toBe(true);
    expect(looksLikeExpression('$Speed * 0.5')).toBe(true);
    expect(looksLikeExpression('1+2')).toBe(true);
    expect(looksLikeExpression('10 - 3')).toBe(true);
    expect(looksLikeExpression('50%10')).toBe(true);
    expect(looksLikeExpression('(10+5)*2')).toBe(true);
  });

  it('returns false for plain numbers', () => {
    expect(looksLikeExpression('10.5')).toBe(false);
    expect(looksLikeExpression('0')).toBe(false);
    expect(looksLikeExpression('')).toBe(false);
  });

  it('returns false for negative numbers (leading sign)', () => {
    expect(looksLikeExpression('-5')).toBe(false);
    expect(looksLikeExpression('+3')).toBe(false);
  });

  it('returns false for $ParamName without operators', () => {
    expect(looksLikeExpression('$Speed')).toBe(false);
  });

  it('returns false for already-wrapped expressions', () => {
    expect(looksLikeExpression('${250/3.6}')).toBe(false);
  });
});

describe('evaluateExpression', () => {
  const params = [
    { name: 'Speed', value: '30' },
    { name: 'Radius', value: '10' },
  ];
  const vars = [{ name: 'Factor', value: '0.5' }];

  it('evaluates simple arithmetic', () => {
    expect(evaluateExpression('${250/3.6}', [], [])).toBeCloseTo(69.444, 2);
    expect(evaluateExpression('${1+2}', [], [])).toBe(3);
    expect(evaluateExpression('${10 * 2 + 5}', [], [])).toBe(25);
  });

  it('resolves $param references and evaluates', () => {
    expect(evaluateExpression('${$Speed / 3.6}', params, vars)).toBeCloseTo(8.333, 2);
    expect(evaluateExpression('${$Speed * $Factor}', params, vars)).toBe(15);
    expect(evaluateExpression('${-$Speed}', params, vars)).toBe(-30);
  });

  it('resolves $variable references', () => {
    expect(evaluateExpression('${$Factor * 100}', params, vars)).toBe(50);
  });

  it('returns undefined for non-expressions', () => {
    expect(evaluateExpression('$Speed', params, vars)).toBeUndefined();
    expect(evaluateExpression('10.5', params, vars)).toBeUndefined();
  });

  it('returns undefined for unresolvable references', () => {
    expect(evaluateExpression('${$Unknown * 2}', params, vars)).toBeUndefined();
  });

  it('returns undefined for invalid math', () => {
    expect(evaluateExpression('${}', params, vars)).toBeUndefined();
  });

  it('rejects non-arithmetic content', () => {
    expect(evaluateExpression('${alert(1)}', [], [])).toBeUndefined();
    expect(evaluateExpression('${console.log(1)}', [], [])).toBeUndefined();
  });
});

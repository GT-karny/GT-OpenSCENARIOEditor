/**
 * Utilities for OpenSCENARIO v1.3.1 expression handling.
 *
 * XSD expression type: ${[ A-Za-z0-9_+\-*\/%$().,]*}
 * Examples: ${250/3.6}, ${$speed * 0.5}, ${-$Speed}
 */

/** XSD v1.3.1 expression character set */
const EXPR_PATTERN = /^\$\{[ A-Za-z0-9_+\-*/%$().,]*\}$/;

/** Check if a string is a complete expression (starts with ${ and ends with }) */
export function isExpression(v: string): boolean {
  return v.startsWith('${') && v.endsWith('}');
}

/** Validate expression against XSD v1.3.1 character set */
export function isValidExpression(v: string): boolean {
  return EXPR_PATTERN.test(v);
}

/** Check if a string is a parameter reference or expression (starts with $) */
export function isParamOrExpr(v: string): boolean {
  return v.startsWith('$');
}

/**
 * Detect if a raw input string looks like an arithmetic expression
 * (contains operators) and should be auto-wrapped in ${...}.
 *
 * Does NOT match plain numbers, negative numbers, or $ParamName.
 */
export function looksLikeExpression(v: string): boolean {
  const t = v.trim();
  if (!t || isExpression(t)) return false;
  // *, /, %, (, ) → definitely arithmetic
  if (/[*/%()]/.test(t)) return true;
  // + or - NOT at position 0 (excludes leading sign like -5 or +3)
  if (/(?!^)[+-]/.test(t)) return true;
  return false;
}

/**
 * Evaluate an OpenSCENARIO expression by resolving $param references
 * and computing the arithmetic result.
 *
 * Returns the numeric result, or undefined if evaluation fails.
 * Only supports basic arithmetic (+, -, *, /, %, parentheses) and numeric literals.
 */
export function evaluateExpression(
  expr: string,
  params: ReadonlyArray<{ name: string; value: string }>,
  vars: ReadonlyArray<{ name: string; value: string }>,
): number | undefined {
  if (!isExpression(expr)) return undefined;

  // Extract inner content: ${...} → ...
  let inner = expr.slice(2, -1).trim();
  if (!inner) return undefined;

  // Resolve $ParamName / $VarName references to their numeric values
  inner = inner.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_match, name: string) => {
    const p = params.find((d) => d.name === name);
    if (p) return p.value;
    const v = vars.find((d) => d.name === name);
    if (v) return v.value;
    return 'NaN';
  });

  // Validate: only allow digits, operators, parentheses, whitespace, decimal points
  if (!/^[\d+\-*/%().\s]+$/.test(inner)) return undefined;

  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${inner});`)() as unknown;
    if (typeof result === 'number' && Number.isFinite(result)) return result;
    return undefined;
  } catch {
    return undefined;
  }
}

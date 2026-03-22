/**
 * Shared formatting utilities for XodrSerializer.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

/**
 * Format a number for XML output.
 * Uses up to 16 significant digits with trailing zero trimming.
 */
export function fmtNum(value: number): string {
  // For integers, just return the integer string
  if (Number.isInteger(value)) return String(value);
  // Use toPrecision(16) for floating point, trim trailing zeros
  const s = value.toPrecision(16);
  // Remove trailing zeros after decimal point, but keep at least one digit after dot
  if (s.includes('.')) {
    const trimmed = s.replace(/0+$/, '');
    // If we trimmed everything after the dot, remove the dot too
    return trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
  }
  return s;
}

/**
 * Set an optional attribute on a node. Omits if value is undefined/null.
 * If a formatter is provided, applies it to the value.
 */
export function optAttr<T>(
  node: XmlNode,
  key: string,
  value: T | undefined | null,
  formatter?: (v: T) => string | number,
): void {
  if (value == null) return;
  node[key] = formatter ? formatter(value) : value;
}

/**
 * Set a required attribute on a node, formatting numbers.
 */
export function numAttr(node: XmlNode, key: string, value: number): void {
  node[key] = fmtNum(value);
}

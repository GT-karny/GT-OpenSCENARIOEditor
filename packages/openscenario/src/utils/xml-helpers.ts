import { ensureArray } from './ensure-array.js';

/**
 * A parsed XML node as produced by fast-xml-parser: a record whose keys are
 * child element names (object/array values) or prefixed attribute names
 * (`@_name`, primitive values). Values are `unknown` and must be narrowed
 * through the accessor helpers below before use.
 */
export type RawXml = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Parser binding collector — captures $param references during parsing
// ---------------------------------------------------------------------------
let _bindingCollector: Record<string, Record<string, string>> | null = null;
let _bindingElementId: string | null = null;
let _bindingFieldPrefix = '';
let _bindingPrefixStack: string[] = [];

export function startBindingCollection(): void {
  _bindingCollector = {};
  _bindingElementId = null;
  _bindingFieldPrefix = '';
  _bindingPrefixStack = [];
}

export function setBindingElementId(id: string): void {
  _bindingElementId = id;
  _bindingFieldPrefix = '';
  _bindingPrefixStack = [];
}

export function pushBindingFieldPrefix(prefix: string): void {
  _bindingPrefixStack.push(_bindingFieldPrefix);
  _bindingFieldPrefix = _bindingFieldPrefix ? `${_bindingFieldPrefix}.${prefix}` : prefix;
}

export function popBindingFieldPrefix(): void {
  _bindingFieldPrefix = _bindingPrefixStack.pop() ?? '';
}

export function finishBindingCollection(): Record<string, Record<string, string>> {
  const result = _bindingCollector ?? {};
  _bindingCollector = null;
  _bindingElementId = null;
  _bindingFieldPrefix = '';
  _bindingPrefixStack = [];
  return result;
}

function recordBinding(attrName: string, paramRef: string): void {
  if (!_bindingCollector || !_bindingElementId) return;
  const fieldPath = _bindingFieldPrefix ? `${_bindingFieldPrefix}.${attrName}` : attrName;
  if (!_bindingCollector[_bindingElementId]) {
    _bindingCollector[_bindingElementId] = {};
  }
  _bindingCollector[_bindingElementId][fieldPath] = paramRef;
}

// ---------------------------------------------------------------------------
// Attribute readers
// ---------------------------------------------------------------------------

export function attr(raw: RawXml | undefined, name: string): string | undefined {
  const v = raw?.[`@_${name}`];
  // With `parseAttributeValue: false` fast-xml-parser yields attribute values as
  // strings; the cast narrows the parser's `unknown` value to that contract.
  return v === undefined ? undefined : (v as string);
}

export function numAttr(raw: RawXml | undefined, name: string, defaultValue = 0): number {
  const v = attr(raw, name);
  if (v === undefined || v === '') return defaultValue;
  if (v.startsWith('$')) {
    recordBinding(name, v);
    return defaultValue;
  }
  const n = Number(v);
  return isNaN(n) ? defaultValue : n;
}

export function strAttr(raw: RawXml | undefined, name: string, defaultValue = ''): string {
  return attr(raw, name) ?? defaultValue;
}

export function boolAttr(raw: RawXml | undefined, name: string, defaultValue = false): boolean {
  const v = attr(raw, name);
  if (v === undefined) return defaultValue;
  return v === 'true' || v === '1';
}

export function optNumAttr(raw: RawXml | undefined, name: string): number | undefined {
  const v = attr(raw, name);
  if (v === undefined || v === '') return undefined;
  if (v.startsWith('$')) {
    recordBinding(name, v);
    return undefined;
  }
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export function optStrAttr(raw: RawXml | undefined, name: string): string | undefined {
  return attr(raw, name);
}

export function optBoolAttr(raw: RawXml | undefined, name: string): boolean | undefined {
  const v = attr(raw, name);
  if (v === undefined) return undefined;
  return v === 'true' || v === '1';
}

// ---------------------------------------------------------------------------
// Child-element readers
// ---------------------------------------------------------------------------

function isRawXml(value: unknown): value is RawXml {
  return typeof value === 'object' && value !== null;
}

/**
 * Read a child element as a `RawXml` node, or `undefined` when it is absent or
 * not an object (e.g. an empty self-closing element parsed as `''`). When the
 * child is parsed as an array, the first entry is returned. This mirrors the
 * truthiness guards (`if (raw.Child)`) used throughout the parsers.
 */
export function child(raw: RawXml | undefined, name: string): RawXml | undefined {
  const value = raw?.[name];
  if (Array.isArray(value)) {
    return isRawXml(value[0]) ? value[0] : undefined;
  }
  return isRawXml(value) ? value : undefined;
}

/**
 * Read a repeated child element as a `RawXml[]`. Non-object entries (e.g. empty
 * elements) are dropped so callers can map parsers over the result directly.
 */
export function children(raw: RawXml | undefined, name: string): RawXml[] {
  return ensureArray(raw?.[name]).filter(isRawXml);
}

/**
 * Test whether a child element / attribute key is present, regardless of its
 * value. Mirrors `'Name' in raw` and `raw.Name !== undefined` guards used for
 * empty elements (e.g. `<RandomRouteAction/>`).
 */
export function has(raw: RawXml | undefined, name: string): boolean {
  return raw !== undefined && name in raw;
}

/** Element/attribute keys of a node, for diagnostics in error messages. */
export function rawKeys(raw: RawXml | undefined): string[] {
  return raw ? Object.keys(raw) : [];
}

// ---------------------------------------------------------------------------
// Serializer helpers
// ---------------------------------------------------------------------------

export function getSubBindings(
  elementBindings: Record<string, string>,
  prefix: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  const prefixDot = prefix + '.';
  for (const [key, value] of Object.entries(elementBindings)) {
    if (key.startsWith(prefixDot)) {
      result[key.substring(prefixDot.length)] = value;
    }
  }
  return result;
}

export function buildAttrs(
  attrs: Record<string, string | number | boolean | undefined>,
  bindings?: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    const binding = bindings?.[key];
    if (binding !== undefined) {
      result[`@_${key}`] = binding;
    } else if (value !== undefined) {
      result[`@_${key}`] = String(value);
    }
  }
  return result;
}

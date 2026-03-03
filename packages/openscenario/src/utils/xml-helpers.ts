// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawXml = Record<string, any>;

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
  return raw?.[`@_${name}`] as string | undefined;
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

export function numStr(value: number | undefined): string | undefined {
  return value !== undefined ? String(value) : undefined;
}

export function boolStr(value: boolean | undefined): string | undefined {
  return value !== undefined ? String(value) : undefined;
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

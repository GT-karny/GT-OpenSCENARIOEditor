// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawXml = Record<string, any>;

export function attr(raw: RawXml | undefined, name: string): string | undefined {
  return raw?.[`@_${name}`] as string | undefined;
}

export function numAttr(raw: RawXml | undefined, name: string, defaultValue = 0): number {
  const v = attr(raw, name);
  if (v === undefined || v === '') return defaultValue;
  if (v.startsWith('$')) return defaultValue;
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
  if (v.startsWith('$')) return undefined;
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

export function buildAttrs(
  attrs: Record<string, string | number | boolean | undefined>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined) {
      result[`@_${key}`] = String(value);
    }
  }
  return result;
}

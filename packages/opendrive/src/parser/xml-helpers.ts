/**
 * fast-xml-parser configuration for OpenDRIVE (.xodr) files.
 */
import { XMLParser } from 'fast-xml-parser';
import { ensureArray } from '../utils/math.js';

// Re-exported to keep this module's public surface stable for existing callers.
export { ensureArray };

const ALWAYS_ARRAY_TAGS = new Set([
  // Road & geometry
  'road',
  'geometry',
  'elevation',
  'superelevation',
  'shape',
  'laneOffset',
  'laneSection',
  // Lanes
  'lane',
  'width',
  'border',
  'roadMark',
  'height',
  'speed',
  'access',
  'rule',
  'material',
  // Objects
  'object',
  'repeat',
  'outline',
  'outlines',
  'cornerRoad',
  'cornerLocal',
  'marking',
  'cornerReference',
  'objectReference',
  'tunnel',
  'bridge',
  'validity',
  // Signals
  'signal',
  'dependency',
  'reference',
  'signalReference',
  // Controllers
  'controller',
  'control',
  // Junctions
  'junction',
  'connection',
  'laneLink',
  'priority',
  'junctionGroup',
  'junctionReference',
  // Railroad
  'switch',
  'station',
  'platform',
  'segment',
  // Road mark sub-elements
  'line',
  'sway',
  // Road types & common
  'type',
  'include',
  'userData',
  // Surface
  'CRG',
]);

/**
 * Prefix applied to XML attributes by fast-xml-parser. It MUST match the
 * XMLBuilder's `attributeNamePrefix` in the serializer so that attributes and
 * same-named child elements never collide in the parsed object tree.
 *
 * Example: `<roadMark type="solid"><type name="..."><line/></type></roadMark>`
 * — with an empty prefix the `type` attribute and the `<type>` child element
 * share one key and the child (line definitions) is silently dropped. With the
 * `@_` prefix the attribute becomes `@_type` and the child stays `type`.
 */
export const ATTR_PREFIX = '@_';

export function createXodrXmlParser(): XMLParser {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: ATTR_PREFIX,
    parseAttributeValue: true,
    cdataPropName: '__cdata',
    isArray: (_name: string, jpath: string) => {
      const tag = jpath.split('.').pop() ?? '';
      return ALWAYS_ARRAY_TAGS.has(tag);
    },
    trimValues: true,
  });
}

/** Safe number conversion with fallback */
export function toNum(val: unknown, fallback = 0): number {
  if (val == null) return fallback;
  const n = Number(val);
  return Number.isNaN(n) ? fallback : n;
}

/** Safe string conversion */
export function toStr(val: unknown, fallback = ''): string {
  if (val == null) return fallback;
  return String(val);
}

/** Safe optional number */
export function toOptNum(val: unknown): number | undefined {
  if (val == null) return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
}

/** Safe optional string */
export function toOptStr(val: unknown): string | undefined {
  if (val == null) return undefined;
  return String(val);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/** Read a raw XML attribute value by its bare (unprefixed) name. */
export function attr(raw: Raw | undefined, name: string): unknown {
  return raw?.[ATTR_PREFIX + name];
}

/** Read an attribute as a number with fallback. */
export function attrNum(raw: Raw | undefined, name: string, fallback = 0): number {
  return toNum(attr(raw, name), fallback);
}

/** Read an attribute as a string with fallback. */
export function attrStr(raw: Raw | undefined, name: string, fallback = ''): string {
  return toStr(attr(raw, name), fallback);
}

/** Read an optional attribute as a number. */
export function attrOptNum(raw: Raw | undefined, name: string): number | undefined {
  return toOptNum(attr(raw, name));
}

/** Read an optional attribute as a string. */
export function attrOptStr(raw: Raw | undefined, name: string): string | undefined {
  return toOptStr(attr(raw, name));
}

/** Read an attribute as a boolean. Returns undefined when the attribute is absent. */
export function attrBool(raw: Raw | undefined, name: string): boolean | undefined {
  const v = attr(raw, name);
  if (v === true || v === 'true') return true;
  if (v === false || v === 'false') return false;
  return undefined;
}

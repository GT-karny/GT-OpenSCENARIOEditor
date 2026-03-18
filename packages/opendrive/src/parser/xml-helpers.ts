/**
 * fast-xml-parser configuration for OpenDRIVE (.xodr) files.
 */
import { XMLParser } from 'fast-xml-parser';

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

export function createXodrXmlParser(): XMLParser {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseAttributeValue: true,
    cdataPropName: '__cdata',
    isArray: (_name: string, jpath: string) => {
      const tag = jpath.split('.').pop() ?? '';
      return ALWAYS_ARRAY_TAGS.has(tag);
    },
    trimValues: true,
  });
}

/** Ensure a value is an array. Handles null/undefined and single-value cases. */
export function ensureArray<T>(val: T | T[] | undefined | null): T[] {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
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

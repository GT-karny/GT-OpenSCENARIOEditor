/**
 * Parse a signal's `<semantics>` element (t_signals_semantics, OpenDRIVE 1.9).
 *
 * The XSD models the block as an xs:sequence of per-kind repeatable elements. We
 * iterate the kinds in schema order and flatten every occurrence into one
 * ordered {@link OdrSemanticsEntry} array — for a schema-valid (kind-grouped)
 * document this preserves document order, and the serializer re-groups by kind.
 */
import type {
  OdrSignalSemantics,
  OdrSemanticsEntry,
  OdrSemanticsParticipant,
  OdrSemanticsSpeedType,
  OdrSemanticsLaneType,
  OdrSemanticsPriorityType,
  OdrSemanticsSupplementaryTimeType,
  OdrSemanticsSupplementaryDistanceType,
  OdrSemanticsSupplementaryEnvironmentType,
} from '@osce/shared';
import {
  ODR_SEMANTICS_SPEED_TYPES,
  ODR_SEMANTICS_LANE_TYPES,
  ODR_SEMANTICS_PRIORITY_TYPES,
  ODR_SEMANTICS_SUPPLEMENTARY_TIME_TYPES,
  ODR_SEMANTICS_SUPPLEMENTARY_DISTANCE_TYPES,
  ODR_SEMANTICS_SUPPLEMENTARY_ENVIRONMENT_TYPES,
} from '@osce/shared';
import { toStr, attrOptStr, asEnum } from './xml-helpers.js';
import { trackNode } from './node-tracker.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/**
 * Consume an optional enum-typed `@type` attribute. A valid literal is set on
 * the entry; an unknown value is left unconsumed so it round-trips via `extra`
 * (matching the junction @type convention).
 */
function takeEnumType<T extends string>(
  t: ReturnType<typeof trackNode>,
  raw: Raw,
  allowed: readonly T[],
): T | undefined {
  const val = asEnum(attrOptStr(raw, 'type'), allowed);
  if (val !== undefined) t.takeAttr('type');
  return val;
}

/** Extract the text value of a `<type>` child (fast-xml-parser may array-wrap it). */
function childText(v: unknown): string {
  const first = Array.isArray(v) ? v[0] : v;
  if (first != null && typeof first === 'object') return toStr((first as Raw)['#text']);
  return toStr(first);
}

function parseParticipants(raw: Raw): OdrSemanticsParticipant[] {
  const t = trackNode(raw);
  const participants: OdrSemanticsParticipant[] = [];

  for (const a of t.takeChildren('animal') as unknown[]) {
    const at = trackNode(typeof a === 'object' && a ? (a as Raw) : undefined);
    const p: OdrSemanticsParticipant = { kind: 'animal' };
    const ex = at.rest();
    if (ex) p.extra = ex;
    participants.push(p);
  }
  for (const person of t.takeChildren('person') as Raw[]) {
    const pt = trackNode(person);
    const category = childText(pt.takeChild('type'));
    const p: OdrSemanticsParticipant = { kind: 'person', category };
    const ex = pt.rest();
    if (ex) p.extra = ex;
    participants.push(p);
  }
  for (const vehicle of t.takeChildren('vehicle') as Raw[]) {
    const vt = trackNode(vehicle);
    const category = childText(vt.takeChild('type'));
    const p: OdrSemanticsParticipant = { kind: 'vehicle', category };
    const ex = vt.rest();
    if (ex) p.extra = ex;
    participants.push(p);
  }
  return participants;
}

/** Parse one occurrence of a given kind into an entry, capturing leftover as extra. */
function parseEntry(kind: OdrSemanticsEntry['kind'], raw: Raw): OdrSemanticsEntry {
  const t = trackNode(raw);
  let entry: OdrSemanticsEntry;

  switch (kind) {
    case 'speed': {
      const e: OdrSemanticsEntry = { kind: 'speed' };
      const type = takeEnumType<OdrSemanticsSpeedType>(t, raw, ODR_SEMANTICS_SPEED_TYPES);
      if (type !== undefined) e.type = type;
      const value = t.optNum('value');
      if (value !== undefined) e.value = value;
      const unit = t.optStr('unit');
      if (unit !== undefined) e.unit = unit;
      entry = e;
      break;
    }
    case 'lane': {
      const e: OdrSemanticsEntry = { kind: 'lane' };
      const type = takeEnumType<OdrSemanticsLaneType>(t, raw, ODR_SEMANTICS_LANE_TYPES);
      if (type !== undefined) e.type = type;
      entry = e;
      break;
    }
    case 'priority': {
      const e: OdrSemanticsEntry = { kind: 'priority' };
      const type = takeEnumType<OdrSemanticsPriorityType>(t, raw, ODR_SEMANTICS_PRIORITY_TYPES);
      if (type !== undefined) e.type = type;
      entry = e;
      break;
    }
    case 'supplementaryTime': {
      const e: OdrSemanticsEntry = { kind: 'supplementaryTime' };
      const type = takeEnumType<OdrSemanticsSupplementaryTimeType>(
        t,
        raw,
        ODR_SEMANTICS_SUPPLEMENTARY_TIME_TYPES,
      );
      if (type !== undefined) e.type = type;
      const value = t.optNum('value');
      if (value !== undefined) e.value = value;
      entry = e;
      break;
    }
    case 'supplementaryDistance': {
      const e: OdrSemanticsEntry = { kind: 'supplementaryDistance' };
      const type = takeEnumType<OdrSemanticsSupplementaryDistanceType>(
        t,
        raw,
        ODR_SEMANTICS_SUPPLEMENTARY_DISTANCE_TYPES,
      );
      if (type !== undefined) e.type = type;
      const value = t.optNum('value');
      if (value !== undefined) e.value = value;
      const unit = t.optStr('unit');
      if (unit !== undefined) e.unit = unit;
      entry = e;
      break;
    }
    case 'supplementaryEnvironment': {
      const e: OdrSemanticsEntry = { kind: 'supplementaryEnvironment' };
      const type = takeEnumType<OdrSemanticsSupplementaryEnvironmentType>(
        t,
        raw,
        ODR_SEMANTICS_SUPPLEMENTARY_ENVIRONMENT_TYPES,
      );
      if (type !== undefined) e.type = type;
      entry = e;
      break;
    }
    case 'prohibited':
    case 'supplementaryAllows':
    case 'supplementaryProhibits': {
      // Participants are parsed with their own tracker (below); mark them
      // consumed on this node so only true leftovers land in extra.
      t.takeChild('animal');
      t.takeChild('person');
      t.takeChild('vehicle');
      entry = { kind, participants: parseParticipants(raw) };
      break;
    }
    default: {
      // warning / routing / streetname / parking / tourist / supplementaryExplanatory
      entry = { kind } as OdrSemanticsEntry;
      break;
    }
  }

  const extra = t.rest();
  if (extra) entry.extra = extra;
  return entry;
}

const KIND_ELEMENTS: readonly OdrSemanticsEntry['kind'][] = [
  'speed',
  'lane',
  'priority',
  'prohibited',
  'warning',
  'routing',
  'streetname',
  'parking',
  'tourist',
  'supplementaryTime',
  'supplementaryAllows',
  'supplementaryProhibits',
  'supplementaryDistance',
  'supplementaryEnvironment',
  'supplementaryExplanatory',
];

export function parseSemantics(raw: unknown): OdrSignalSemantics | undefined {
  // Absent element → undefined. A self-closing `<semantics/>` parses as an empty
  // string (present but empty) and must survive as an entry-less block.
  if (raw == null) return undefined;
  const t = trackNode(typeof raw === 'object' ? (raw as Raw) : undefined);
  const entries: OdrSemanticsEntry[] = [];

  for (const kind of KIND_ELEMENTS) {
    for (const child of t.takeChildren(kind) as unknown[]) {
      entries.push(parseEntry(kind, (typeof child === 'object' && child ? child : {}) as Raw));
    }
  }

  const semantics: OdrSignalSemantics = { entries };
  const extra = t.rest();
  if (extra) semantics.extra = extra;
  return semantics;
}

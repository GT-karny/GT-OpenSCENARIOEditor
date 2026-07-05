/**
 * Consumption-tracking accessor for a parsed OpenDRIVE node.
 *
 * A strict-whitelist parser reads only the keys it knows and silently discards
 * the rest, so any unmodeled attribute or child element is lost on load→save.
 * `trackNode` wraps a raw fast-xml-parser node and records which keys a parse
 * function consumes; `rest()` then returns everything left over as an
 * {@link OdrExtra}, which the serializer re-emits verbatim. Migrating a parse
 * module to these accessors makes it round-trip its unknown content for free.
 */
import type { OdrExtra, OdrExtraChild } from '@osce/shared';
import {
  ATTR_PREFIX,
  ensureArray,
  toStr,
  toNum,
  toOptStr,
  toOptNum,
} from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/** fast-xml-parser text/CDATA keys that are not child elements. */
const TEXT_KEYS = new Set(['#text', '__cdata']);

export interface NodeTracker {
  /** Mark an attribute as consumed and return its raw value. */
  takeAttr(name: string): unknown;
  /** Mark a child tag as consumed and return its raw value (single or array). */
  takeChild(name: string): unknown;
  /** Mark a child tag as consumed and return its occurrences as an array. */
  takeChildren(name: string): unknown[];

  // Typed attribute helpers (each marks the attribute consumed).
  str(name: string, fallback?: string): string;
  optStr(name: string): string | undefined;
  num(name: string, fallback?: number): number;
  optNum(name: string): number | undefined;
  bool(name: string): boolean | undefined;

  /**
   * Everything not yet consumed, as an OdrExtra, or `undefined` when the node is
   * fully modeled. Attributes are stringified; child elements keep their raw
   * fast-xml-parser value and their original key order (as a sibling-order hint).
   */
  rest(): OdrExtra | undefined;
}

export function trackNode(raw: Raw | undefined): NodeTracker {
  const consumed = new Set<string>();

  const takeAttr = (name: string): unknown => {
    const key = ATTR_PREFIX + name;
    consumed.add(key);
    return raw?.[key];
  };

  const takeChild = (name: string): unknown => {
    consumed.add(name);
    return raw?.[name];
  };

  const takeChildren = (name: string): unknown[] => {
    consumed.add(name);
    return ensureArray(raw?.[name]);
  };

  const rest = (): OdrExtra | undefined => {
    if (!raw) return undefined;
    let attrs: Record<string, string> | undefined;
    let children: OdrExtraChild[] | undefined;
    let childIndex = 0;

    for (const key of Object.keys(raw)) {
      if (key.startsWith(ATTR_PREFIX)) {
        if (consumed.has(key)) continue;
        const value = raw[key];
        if (value == null) continue;
        (attrs ??= {})[key.slice(ATTR_PREFIX.length)] = String(value);
        continue;
      }
      if (TEXT_KEYS.has(key)) continue;
      // A child element key: count its position for sibling ordering whether or
      // not it was consumed, so the index reflects the original document order.
      const index = childIndex++;
      if (consumed.has(key)) continue;
      const value = raw[key];
      if (value === undefined) continue;
      (children ??= []).push({ name: key, raw: value, index });
    }

    if (!attrs && !children) return undefined;
    const extra: OdrExtra = {};
    if (attrs) extra.attrs = attrs;
    if (children) extra.children = children;
    return extra;
  };

  return {
    takeAttr,
    takeChild,
    takeChildren,
    str: (name, fallback = '') => toStr(takeAttr(name), fallback),
    optStr: (name) => toOptStr(takeAttr(name)),
    num: (name, fallback = 0) => toNum(takeAttr(name), fallback),
    optNum: (name) => toOptNum(takeAttr(name)),
    bool: (name) => {
      const v = takeAttr(name);
      if (v === true || v === 'true') return true;
      if (v === false || v === 'false') return false;
      return undefined;
    },
    rest,
  };
}

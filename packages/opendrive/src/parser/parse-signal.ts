/**
 * Parse OpenDRIVE signal elements.
 */
import type { OdrSignal, OdrSignalRef } from '@osce/shared';
import { ensureArray, attrNum, attrStr, attrOptNum, attrOptStr } from './xml-helpers.js';
import { trackNode } from './node-tracker.js';
import { parseLaneValidity } from './parse-common.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseSignals(raw: Raw | undefined): OdrSignal[] {
  if (!raw) return [];
  return ensureArray(raw.signal).map((s: Raw) => {
    const t = trackNode(s);
    const sig: OdrSignal = {
      id: t.str('id'),
      name: t.optStr('name'),
      s: t.num('s'),
      t: t.num('t'),
      zOffset: t.optNum('zOffset'),
      orientation: t.str('orientation', '+'),
      dynamic: t.optStr('dynamic'),
      country: t.optStr('country'),
      countryRevision: t.optStr('countryRevision'),
      type: t.optStr('type'),
      subtype: t.optStr('subtype'),
      value: t.optNum('value'),
      unit: t.optStr('unit'),
      text: t.optStr('text'),
      hOffset: t.optNum('hOffset'),
      pitch: t.optNum('pitch'),
      roll: t.optNum('roll'),
      width: t.optNum('width'),
      height: t.optNum('height'),
    };

    // validity
    const validity = parseLaneValidity(t.takeChildren('validity'));
    if (validity) sig.validity = validity;

    // dependency
    const depArr = t.takeChildren('dependency') as Raw[];
    if (depArr.length > 0) {
      sig.dependency = depArr.map((d) => ({
        id: attrStr(d, 'id'),
        type: attrOptStr(d, 'type'),
      }));
    }

    // reference (child elements referencing other signals/objects)
    const refArr = t.takeChildren('reference') as Raw[];
    if (refArr.length > 0) {
      sig.reference = refArr.map((r) => ({
        elementType: attrStr(r, 'elementType') as 'object' | 'signal',
        elementId: attrStr(r, 'elementId'),
        type: attrOptStr(r, 'type'),
      }));
    }

    // positionRoad
    const pr = t.takeChild('positionRoad') as Raw | undefined;
    if (pr) {
      sig.positionRoad = {
        roadId: attrStr(pr, 'roadId'),
        s: attrNum(pr, 's'),
        t: attrNum(pr, 't'),
        zOffset: attrNum(pr, 'zOffset'),
        hOffset: attrNum(pr, 'hOffset'),
        pitch: attrOptNum(pr, 'pitch'),
        roll: attrOptNum(pr, 'roll'),
      };
    }

    // positionInertial
    const pi = t.takeChild('positionInertial') as Raw | undefined;
    if (pi) {
      sig.positionInertial = {
        x: attrNum(pi, 'x'),
        y: attrNum(pi, 'y'),
        z: attrNum(pi, 'z'),
        hdg: attrNum(pi, 'hdg'),
        pitch: attrOptNum(pi, 'pitch'),
        roll: attrOptNum(pi, 'roll'),
      };
    }

    // Preserve unmodeled signal attrs (@length/@invalidated/@temporary) and
    // whole 1.9 subtrees (<semantics>, board system) for round-trip.
    const extra = t.rest();
    if (extra) sig.extra = extra;

    return sig;
  });
}

export function parseSignalReferences(raw: Raw | undefined): OdrSignalRef[] {
  if (!raw) return [];
  return ensureArray(raw.signalReference).map((sr: Raw) => {
    const ref: OdrSignalRef = {
      s: attrNum(sr, 's'),
      t: attrNum(sr, 't'),
      id: attrStr(sr, 'id'),
      orientation: attrStr(sr, 'orientation', '+'),
    };
    const validity = parseLaneValidity(sr.validity);
    if (validity) ref.validity = validity;
    return ref;
  });
}

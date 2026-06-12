/**
 * Parse OpenDRIVE signal elements.
 */
import type { OdrSignal, OdrSignalRef } from '@osce/shared';
import { ensureArray, attrNum, attrStr, attrOptNum, attrOptStr } from './xml-helpers.js';
import { parseLaneValidity } from './parse-common.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseSignals(raw: Raw | undefined): OdrSignal[] {
  if (!raw) return [];
  return ensureArray(raw.signal).map((s: Raw) => {
    const sig: OdrSignal = {
      id: attrStr(s, 'id'),
      name: attrOptStr(s, 'name'),
      s: attrNum(s, 's'),
      t: attrNum(s, 't'),
      zOffset: attrOptNum(s, 'zOffset'),
      orientation: attrStr(s, 'orientation', '+'),
      dynamic: attrOptStr(s, 'dynamic'),
      country: attrOptStr(s, 'country'),
      countryRevision: attrOptStr(s, 'countryRevision'),
      type: attrOptStr(s, 'type'),
      subtype: attrOptStr(s, 'subtype'),
      value: attrOptNum(s, 'value'),
      unit: attrOptStr(s, 'unit'),
      text: attrOptStr(s, 'text'),
      hOffset: attrOptNum(s, 'hOffset'),
      pitch: attrOptNum(s, 'pitch'),
      roll: attrOptNum(s, 'roll'),
      width: attrOptNum(s, 'width'),
      height: attrOptNum(s, 'height'),
    };

    // validity
    const validity = parseLaneValidity(s.validity);
    if (validity) sig.validity = validity;

    // dependency
    const depArr = ensureArray(s.dependency);
    if (depArr.length > 0) {
      sig.dependency = depArr.map((d: Raw) => ({
        id: attrStr(d, 'id'),
        type: attrOptStr(d, 'type'),
      }));
    }

    // reference (child elements referencing other signals/objects)
    const refArr = ensureArray(s.reference);
    if (refArr.length > 0) {
      sig.reference = refArr.map((r: Raw) => ({
        elementType: attrStr(r, 'elementType') as 'object' | 'signal',
        elementId: attrStr(r, 'elementId'),
        type: attrOptStr(r, 'type'),
      }));
    }

    // positionRoad
    if (s.positionRoad) {
      const pr = s.positionRoad;
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
    if (s.positionInertial) {
      const pi = s.positionInertial;
      sig.positionInertial = {
        x: attrNum(pi, 'x'),
        y: attrNum(pi, 'y'),
        z: attrNum(pi, 'z'),
        hdg: attrNum(pi, 'hdg'),
        pitch: attrOptNum(pi, 'pitch'),
        roll: attrOptNum(pi, 'roll'),
      };
    }

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

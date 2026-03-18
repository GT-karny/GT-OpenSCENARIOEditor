/**
 * Parse OpenDRIVE signal elements.
 */
import type { OdrSignal, OdrSignalRef } from '@osce/shared';
import { ensureArray, toNum, toStr, toOptNum, toOptStr } from './xml-helpers.js';
import { parseLaneValidity } from './parse-common.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseSignals(raw: Raw | undefined): OdrSignal[] {
  if (!raw) return [];
  return ensureArray(raw.signal).map((s: Raw) => {
    const sig: OdrSignal = {
      id: toStr(s.id),
      name: toOptStr(s.name),
      s: toNum(s.s),
      t: toNum(s.t),
      zOffset: toOptNum(s.zOffset),
      orientation: toStr(s.orientation, '+'),
      dynamic: toOptStr(s.dynamic),
      country: toOptStr(s.country),
      countryRevision: toOptStr(s.countryRevision),
      type: toOptStr(s.type),
      subtype: toOptStr(s.subtype),
      value: toOptNum(s.value),
      unit: toOptStr(s.unit),
      text: toOptStr(s.text),
      hOffset: toOptNum(s.hOffset),
      pitch: toOptNum(s.pitch),
      roll: toOptNum(s.roll),
      width: toOptNum(s.width),
      height: toOptNum(s.height),
    };

    // validity
    const validity = parseLaneValidity(s.validity);
    if (validity) sig.validity = validity;

    // dependency
    const depArr = ensureArray(s.dependency);
    if (depArr.length > 0) {
      sig.dependency = depArr.map((d: Raw) => ({
        id: toStr(d.id),
        type: toOptStr(d.type),
      }));
    }

    // reference (child elements referencing other signals/objects)
    const refArr = ensureArray(s.reference);
    if (refArr.length > 0) {
      sig.reference = refArr.map((r: Raw) => ({
        elementType: toStr(r.elementType) as 'object' | 'signal',
        elementId: toStr(r.elementId),
        type: toOptStr(r.type),
      }));
    }

    // positionRoad
    if (s.positionRoad) {
      const pr = s.positionRoad;
      sig.positionRoad = {
        roadId: toStr(pr.roadId),
        s: toNum(pr.s),
        t: toNum(pr.t),
        zOffset: toNum(pr.zOffset),
        hOffset: toNum(pr.hOffset),
        pitch: toOptNum(pr.pitch),
        roll: toOptNum(pr.roll),
      };
    }

    // positionInertial
    if (s.positionInertial) {
      const pi = s.positionInertial;
      sig.positionInertial = {
        x: toNum(pi.x),
        y: toNum(pi.y),
        z: toNum(pi.z),
        hdg: toNum(pi.hdg),
        pitch: toOptNum(pi.pitch),
        roll: toOptNum(pi.roll),
      };
    }

    return sig;
  });
}

export function parseSignalReferences(raw: Raw | undefined): OdrSignalRef[] {
  if (!raw) return [];
  return ensureArray(raw.signalReference).map((sr: Raw) => {
    const ref: OdrSignalRef = {
      s: toNum(sr.s),
      t: toNum(sr.t),
      id: toStr(sr.id),
      orientation: toStr(sr.orientation, '+'),
    };
    const validity = parseLaneValidity(sr.validity);
    if (validity) ref.validity = validity;
    return ref;
  });
}

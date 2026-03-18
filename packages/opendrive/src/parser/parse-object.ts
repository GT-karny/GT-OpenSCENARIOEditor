/**
 * Parse OpenDRIVE road object elements.
 */
import type {
  OdrRoadObject,
  OdrObjectReference,
  OdrTunnel,
  OdrBridge,
} from '@osce/shared';
import { ensureArray, toNum, toStr, toOptNum, toOptStr } from './xml-helpers.js';
import { parseLaneValidity } from './parse-common.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseObjects(raw: Raw | undefined): OdrRoadObject[] {
  if (!raw) return [];
  return ensureArray(raw.object).map(parseObject);
}

function parseObject(o: Raw): OdrRoadObject {
  const obj: OdrRoadObject = {
    id: toStr(o.id),
    name: toOptStr(o.name),
    type: toOptStr(o.type),
    subtype: toOptStr(o.subtype),
    dynamic: toOptStr(o.dynamic),
    s: toNum(o.s),
    t: toNum(o.t),
    zOffset: toOptNum(o.zOffset),
    validLength: toOptNum(o.validLength),
    hdg: toOptNum(o.hdg),
    pitch: toOptNum(o.pitch),
    roll: toOptNum(o.roll),
    length: toOptNum(o.length),
    width: toOptNum(o.width),
    height: toOptNum(o.height),
    radius: toOptNum(o.radius),
    orientation: toOptStr(o.orientation),
  };

  // repeat
  const repeatArr = ensureArray(o.repeat);
  if (repeatArr.length > 0) {
    obj.repeat = repeatArr.map((r: Raw) => ({
      s: toNum(r.s),
      length: toNum(r.length),
      distance: toNum(r.distance),
      tStart: toNum(r.tStart),
      tEnd: toNum(r.tEnd),
      heightStart: toNum(r.heightStart),
      heightEnd: toNum(r.heightEnd),
      zOffsetStart: toNum(r.zOffsetStart),
      zOffsetEnd: toNum(r.zOffsetEnd),
      widthStart: toOptNum(r.widthStart),
      widthEnd: toOptNum(r.widthEnd),
      lengthStart: toOptNum(r.lengthStart),
      lengthEnd: toOptNum(r.lengthEnd),
      radiusStart: toOptNum(r.radiusStart),
      radiusEnd: toOptNum(r.radiusEnd),
    }));
  }

  // outline (single, direct child)
  if (o.outline) {
    obj.outline = parseOutline(o.outline);
  }

  // outlines (wrapper with multiple outline children)
  if (o.outlines) {
    const outlinesWrapper = ensureArray(o.outlines);
    if (outlinesWrapper.length > 0) {
      const outlineChildren = ensureArray(outlinesWrapper[0].outline);
      if (outlineChildren.length > 0) {
        obj.outlines = outlineChildren.map(parseOutline);
      }
    }
  }

  // material
  const materialArr = ensureArray(o.material);
  if (materialArr.length > 0) {
    obj.material = materialArr.map((m: Raw) => ({
      surface: toOptStr(m.surface),
      friction: toOptNum(m.friction),
      roughness: toOptNum(m.roughness),
    }));
  }

  // validity
  const validity = parseLaneValidity(o.validity);
  if (validity) obj.validity = validity;

  // parkingSpace
  if (o.parkingSpace) {
    obj.parkingSpace = {
      access: toStr(o.parkingSpace.access),
      restrictions: toOptStr(o.parkingSpace.restrictions),
    };
  }

  // markings
  if (o.markings) {
    const markingArr = ensureArray(o.markings.marking ?? o.markings);
    if (markingArr.length > 0 && typeof markingArr[0] === 'object') {
      obj.markings = markingArr.map((m: Raw) => ({
        side: toStr(m.side),
        weight: toOptStr(m.weight),
        width: toOptNum(m.width),
        color: toStr(m.color),
        zOffset: toOptNum(m.zOffset),
        spaceLength: toNum(m.spaceLength),
        lineLength: toNum(m.lineLength),
        startOffset: toNum(m.startOffset),
        stopOffset: toNum(m.stopOffset),
        cornerReferences: ensureArray(m.cornerReference).map((cr: Raw) =>
          toNum(typeof cr === 'object' ? cr.id : cr),
        ),
      }));
    }
  }

  // borders
  if (o.borders) {
    const borderArr = ensureArray(o.borders.border ?? o.borders);
    if (borderArr.length > 0 && typeof borderArr[0] === 'object') {
      obj.borders = borderArr.map((b: Raw) => ({
        outlineId: toStr(b.outlineId),
        type: toStr(b.type),
        width: toNum(b.width),
        useCompleteOutline:
          b.useCompleteOutline === true || b.useCompleteOutline === 'true' ? true : undefined,
        cornerReferences: ensureArray(b.cornerReference).map((cr: Raw) =>
          toNum(typeof cr === 'object' ? cr.id : cr),
        ),
      }));
    }
  }

  return obj;
}

function parseOutline(raw: Raw): {
  id?: string;
  fillType?: string;
  outer?: boolean;
  closed?: boolean;
  laneType?: string;
  cornerRoad?: { s: number; t: number; dz: number; height: number; id?: number }[];
  cornerLocal?: { u: number; v: number; z: number; height: number; id?: number }[];
} {
  const outline: ReturnType<typeof parseOutline> = {
    id: toOptStr(raw.id),
    fillType: toOptStr(raw.fillType),
    outer: raw.outer === true || raw.outer === 'true' ? true : undefined,
    closed: raw.closed === true || raw.closed === 'true' ? true : undefined,
    laneType: toOptStr(raw.laneType),
  };

  const cornerRoadArr = ensureArray(raw.cornerRoad);
  if (cornerRoadArr.length > 0) {
    outline.cornerRoad = cornerRoadArr.map((c: Raw) => ({
      s: toNum(c.s),
      t: toNum(c.t),
      dz: toNum(c.dz),
      height: toNum(c.height),
      id: toOptNum(c.id),
    }));
  }

  const cornerLocalArr = ensureArray(raw.cornerLocal);
  if (cornerLocalArr.length > 0) {
    outline.cornerLocal = cornerLocalArr.map((c: Raw) => ({
      u: toNum(c.u),
      v: toNum(c.v),
      z: toNum(c.z),
      height: toNum(c.height),
      id: toOptNum(c.id),
    }));
  }

  return outline;
}

export function parseObjectReferences(raw: Raw | undefined): OdrObjectReference[] {
  if (!raw) return [];
  return ensureArray(raw.objectReference).map((or: Raw) => {
    const ref: OdrObjectReference = {
      s: toNum(or.s),
      t: toNum(or.t),
      id: toStr(or.id),
      zOffset: toOptNum(or.zOffset),
      validLength: toOptNum(or.validLength),
      orientation: toOptStr(or.orientation),
    };
    const validity = parseLaneValidity(or.validity);
    if (validity) ref.validity = validity;
    return ref;
  });
}

export function parseTunnels(raw: Raw | undefined): OdrTunnel[] {
  if (!raw) return [];
  return ensureArray(raw.tunnel).map((t: Raw) => {
    const tunnel: OdrTunnel = {
      s: toNum(t.s),
      length: toNum(t.length),
      name: toOptStr(t.name),
      id: toStr(t.id),
      type: toStr(t.type),
      lighting: toOptNum(t.lighting),
      daylight: toOptNum(t.daylight),
    };
    const validity = parseLaneValidity(t.validity);
    if (validity) tunnel.validity = validity;
    return tunnel;
  });
}

export function parseBridges(raw: Raw | undefined): OdrBridge[] {
  if (!raw) return [];
  return ensureArray(raw.bridge).map((b: Raw) => {
    const bridge: OdrBridge = {
      s: toNum(b.s),
      length: toNum(b.length),
      name: toOptStr(b.name),
      id: toStr(b.id),
      type: toStr(b.type),
    };
    const validity = parseLaneValidity(b.validity);
    if (validity) bridge.validity = validity;
    return bridge;
  });
}

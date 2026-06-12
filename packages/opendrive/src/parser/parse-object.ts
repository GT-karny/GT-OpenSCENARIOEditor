/**
 * Parse OpenDRIVE road object elements.
 */
import type {
  OdrRoadObject,
  OdrObjectReference,
  OdrTunnel,
  OdrBridge,
} from '@osce/shared';
import {
  ensureArray,
  toNum,
  attr,
  attrNum,
  attrStr,
  attrOptNum,
  attrOptStr,
  attrBool,
} from './xml-helpers.js';
import { parseLaneValidity } from './parse-common.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseObjects(raw: Raw | undefined): OdrRoadObject[] {
  if (!raw) return [];
  return ensureArray(raw.object).map(parseObject);
}

function parseObject(o: Raw): OdrRoadObject {
  const obj: OdrRoadObject = {
    id: attrStr(o, 'id'),
    name: attrOptStr(o, 'name'),
    type: attrOptStr(o, 'type'),
    subtype: attrOptStr(o, 'subtype'),
    dynamic: attrOptStr(o, 'dynamic'),
    s: attrNum(o, 's'),
    t: attrNum(o, 't'),
    zOffset: attrOptNum(o, 'zOffset'),
    validLength: attrOptNum(o, 'validLength'),
    hdg: attrOptNum(o, 'hdg'),
    pitch: attrOptNum(o, 'pitch'),
    roll: attrOptNum(o, 'roll'),
    length: attrOptNum(o, 'length'),
    width: attrOptNum(o, 'width'),
    height: attrOptNum(o, 'height'),
    radius: attrOptNum(o, 'radius'),
    orientation: attrOptStr(o, 'orientation'),
  };

  // repeat
  const repeatArr = ensureArray(o.repeat);
  if (repeatArr.length > 0) {
    obj.repeat = repeatArr.map((r: Raw) => ({
      s: attrNum(r, 's'),
      length: attrNum(r, 'length'),
      distance: attrNum(r, 'distance'),
      tStart: attrNum(r, 'tStart'),
      tEnd: attrNum(r, 'tEnd'),
      heightStart: attrNum(r, 'heightStart'),
      heightEnd: attrNum(r, 'heightEnd'),
      zOffsetStart: attrNum(r, 'zOffsetStart'),
      zOffsetEnd: attrNum(r, 'zOffsetEnd'),
      widthStart: attrOptNum(r, 'widthStart'),
      widthEnd: attrOptNum(r, 'widthEnd'),
      lengthStart: attrOptNum(r, 'lengthStart'),
      lengthEnd: attrOptNum(r, 'lengthEnd'),
      radiusStart: attrOptNum(r, 'radiusStart'),
      radiusEnd: attrOptNum(r, 'radiusEnd'),
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
      surface: attrOptStr(m, 'surface'),
      friction: attrOptNum(m, 'friction'),
      roughness: attrOptNum(m, 'roughness'),
    }));
  }

  // validity
  const validity = parseLaneValidity(o.validity);
  if (validity) obj.validity = validity;

  // parkingSpace
  if (o.parkingSpace) {
    obj.parkingSpace = {
      access: attrStr(o.parkingSpace, 'access'),
      restrictions: attrOptStr(o.parkingSpace, 'restrictions'),
    };
  }

  // markings
  if (o.markings) {
    const markingArr = ensureArray(o.markings.marking ?? o.markings);
    if (markingArr.length > 0 && typeof markingArr[0] === 'object') {
      obj.markings = markingArr.map((m: Raw) => ({
        side: attrStr(m, 'side'),
        weight: attrOptStr(m, 'weight'),
        width: attrOptNum(m, 'width'),
        color: attrStr(m, 'color'),
        zOffset: attrOptNum(m, 'zOffset'),
        spaceLength: attrNum(m, 'spaceLength'),
        lineLength: attrNum(m, 'lineLength'),
        startOffset: attrNum(m, 'startOffset'),
        stopOffset: attrNum(m, 'stopOffset'),
        cornerReferences: ensureArray(m.cornerReference).map((cr: Raw) =>
          toNum(typeof cr === 'object' ? attr(cr, 'id') : cr),
        ),
      }));
    }
  }

  // borders
  if (o.borders) {
    const borderArr = ensureArray(o.borders.border ?? o.borders);
    if (borderArr.length > 0 && typeof borderArr[0] === 'object') {
      obj.borders = borderArr.map((b: Raw) => ({
        outlineId: attrStr(b, 'outlineId'),
        type: attrStr(b, 'type'),
        width: attrNum(b, 'width'),
        useCompleteOutline: attrBool(b, 'useCompleteOutline') === true ? true : undefined,
        cornerReferences: ensureArray(b.cornerReference).map((cr: Raw) =>
          toNum(typeof cr === 'object' ? attr(cr, 'id') : cr),
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
    id: attrOptStr(raw, 'id'),
    fillType: attrOptStr(raw, 'fillType'),
    outer: attrBool(raw, 'outer') === true ? true : undefined,
    closed: attrBool(raw, 'closed') === true ? true : undefined,
    laneType: attrOptStr(raw, 'laneType'),
  };

  const cornerRoadArr = ensureArray(raw.cornerRoad);
  if (cornerRoadArr.length > 0) {
    outline.cornerRoad = cornerRoadArr.map((c: Raw) => ({
      s: attrNum(c, 's'),
      t: attrNum(c, 't'),
      dz: attrNum(c, 'dz'),
      height: attrNum(c, 'height'),
      id: attrOptNum(c, 'id'),
    }));
  }

  const cornerLocalArr = ensureArray(raw.cornerLocal);
  if (cornerLocalArr.length > 0) {
    outline.cornerLocal = cornerLocalArr.map((c: Raw) => ({
      u: attrNum(c, 'u'),
      v: attrNum(c, 'v'),
      z: attrNum(c, 'z'),
      height: attrNum(c, 'height'),
      id: attrOptNum(c, 'id'),
    }));
  }

  return outline;
}

export function parseObjectReferences(raw: Raw | undefined): OdrObjectReference[] {
  if (!raw) return [];
  return ensureArray(raw.objectReference).map((or: Raw) => {
    const ref: OdrObjectReference = {
      s: attrNum(or, 's'),
      t: attrNum(or, 't'),
      id: attrStr(or, 'id'),
      zOffset: attrOptNum(or, 'zOffset'),
      validLength: attrOptNum(or, 'validLength'),
      orientation: attrOptStr(or, 'orientation'),
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
      s: attrNum(t, 's'),
      length: attrNum(t, 'length'),
      name: attrOptStr(t, 'name'),
      id: attrStr(t, 'id'),
      type: attrStr(t, 'type'),
      lighting: attrOptNum(t, 'lighting'),
      daylight: attrOptNum(t, 'daylight'),
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
      s: attrNum(b, 's'),
      length: attrNum(b, 'length'),
      name: attrOptStr(b, 'name'),
      id: attrStr(b, 'id'),
      type: attrStr(b, 'type'),
    };
    const validity = parseLaneValidity(b.validity);
    if (validity) bridge.validity = validity;
    return bridge;
  });
}

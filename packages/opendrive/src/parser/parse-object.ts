/**
 * Parse OpenDRIVE road object elements.
 */
import type {
  OdrRoadObject,
  OdrObjectReference,
  OdrObjectOutline,
  OdrObjectMaterial,
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
import { trackNode } from './node-tracker.js';
import { parseLaneValidity } from './parse-common.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseObjects(raw: Raw | undefined): OdrRoadObject[] {
  if (!raw) return [];
  return ensureArray(raw.object).map(parseObject);
}

function parseObject(o: Raw): OdrRoadObject {
  const t = trackNode(o);
  const obj: OdrRoadObject = {
    id: t.str('id'),
    name: t.optStr('name'),
    type: t.optStr('type'),
    subtype: t.optStr('subtype'),
    dynamic: t.optStr('dynamic'),
    s: t.num('s'),
    t: t.num('t'),
    zOffset: t.optNum('zOffset'),
    validLength: t.optNum('validLength'),
    hdg: t.optNum('hdg'),
    pitch: t.optNum('pitch'),
    roll: t.optNum('roll'),
    length: t.optNum('length'),
    width: t.optNum('width'),
    height: t.optNum('height'),
    radius: t.optNum('radius'),
    orientation: t.optStr('orientation'),
  };

  // repeat
  const repeatArr = t.takeChildren('repeat') as Raw[];
  if (repeatArr.length > 0) {
    obj.repeat = repeatArr.map((r) => ({
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

  // outline (single, direct child; forced to an array by the parser config)
  const outlineArr = t.takeChildren('outline') as Raw[];
  if (outlineArr.length > 0) {
    obj.outline = parseOutline(outlineArr[0]);
  }

  // outlines (wrapper with multiple outline children)
  const outlinesArr = t.takeChildren('outlines') as Raw[];
  if (outlinesArr.length > 0) {
    const outlineChildren = ensureArray(outlinesArr[0].outline);
    if (outlineChildren.length > 0) {
      obj.outlines = outlineChildren.map(parseOutline);
    }
  }

  // material
  const materialArr = t.takeChildren('material') as Raw[];
  if (materialArr.length > 0) {
    obj.material = materialArr.map((m) => {
      const mt = trackNode(m);
      const mat: OdrObjectMaterial = {
        surface: mt.optStr('surface'),
        friction: mt.optNum('friction'),
        roughness: mt.optNum('roughness'),
      };
      const ex = mt.rest();
      if (ex) mat.extra = ex;
      return mat;
    });
  }

  // validity
  const validity = parseLaneValidity(t.takeChildren('validity'));
  if (validity) obj.validity = validity;

  // parkingSpace
  const parkingSpace = t.takeChild('parkingSpace') as Raw | undefined;
  if (parkingSpace) {
    obj.parkingSpace = {
      access: attrStr(parkingSpace, 'access'),
      restrictions: attrOptStr(parkingSpace, 'restrictions'),
    };
  }

  // markings (object-level wrapper; 1.9 also allows markings under <outline>)
  const markingsRaw = t.takeChild('markings') as Raw | undefined;
  if (markingsRaw) {
    const markingArr = ensureArray(markingsRaw.marking ?? markingsRaw);
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
  const bordersRaw = t.takeChild('borders') as Raw | undefined;
  if (bordersRaw) {
    const borderArr = ensureArray(bordersRaw.border ?? bordersRaw);
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

  // Preserve unmodeled object attrs (@perpToRoad/@invalidated/@temporary) and
  // whole unmodeled subtrees (<skeleton>, <surface>/<CRG>) for round-trip.
  const extra = t.rest();
  if (extra) obj.extra = extra;

  return obj;
}

function parseOutline(raw: Raw): OdrObjectOutline {
  const t = trackNode(raw);
  const outline: OdrObjectOutline = {
    id: t.optStr('id'),
    fillType: t.optStr('fillType'),
    outer: t.bool('outer') === true ? true : undefined,
    closed: t.bool('closed') === true ? true : undefined,
    laneType: t.optStr('laneType'),
  };

  const cornerRoadArr = t.takeChildren('cornerRoad') as Raw[];
  if (cornerRoadArr.length > 0) {
    outline.cornerRoad = cornerRoadArr.map((c) => ({
      s: attrNum(c, 's'),
      t: attrNum(c, 't'),
      dz: attrNum(c, 'dz'),
      height: attrNum(c, 'height'),
      id: attrOptNum(c, 'id'),
    }));
  }

  const cornerLocalArr = t.takeChildren('cornerLocal') as Raw[];
  if (cornerLocalArr.length > 0) {
    outline.cornerLocal = cornerLocalArr.map((c) => ({
      u: attrNum(c, 'u'),
      v: attrNum(c, 'v'),
      z: attrNum(c, 'z'),
      height: attrNum(c, 'height'),
      id: attrOptNum(c, 'id'),
    }));
  }

  // Preserve unmodeled outline children (1.9 <curveLocal>, nested <markings>).
  const extra = t.rest();
  if (extra) outline.extra = extra;

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

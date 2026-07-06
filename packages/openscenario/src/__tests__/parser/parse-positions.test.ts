import { describe, it, expect } from 'vitest';
import { POSITION_TYPES } from '@osce/shared';
import type { PositionType } from '@osce/shared';
import { parsePosition } from '../../parser/parse-positions.js';
import { createXoscXmlParser } from '../../parser/fxp-config.js';

const xmlParser = createXoscXmlParser();

function parse(xml: string): ReturnType<typeof parsePosition> {
  return parsePosition(xmlParser.parse(xml).Position);
}

// One minimal <Position> per canonical member. Typed as an exhaustive
// Record<PositionType, ...> so adding a Position union member without a fixture
// here is a compile error — the same single-source weld the parser is meant to
// enforce (S4).
const KNOWN_POSITION_XML: Record<PositionType, string> = {
  worldPosition: '<Position><WorldPosition x="1" y="2" z="3"/></Position>',
  lanePosition: '<Position><LanePosition roadId="1" laneId="-1" s="10"/></Position>',
  relativeLanePosition: '<Position><RelativeLanePosition entityRef="Ego" dLane="1"/></Position>',
  roadPosition: '<Position><RoadPosition roadId="1" s="10" t="2"/></Position>',
  relativeRoadPosition: '<Position><RelativeRoadPosition entityRef="Ego" ds="5" dt="1"/></Position>',
  relativeObjectPosition:
    '<Position><RelativeObjectPosition entityRef="Ego" dx="3" dy="4"/></Position>',
  relativeWorldPosition:
    '<Position><RelativeWorldPosition entityRef="Ego" dx="3" dy="4"/></Position>',
  routePosition:
    '<Position><RoutePosition><RouteRef><CatalogReference catalogName="C" entryName="E"/></RouteRef><InRoutePosition><FromCurrentEntity entityRef="Ego"/></InRoutePosition></RoutePosition></Position>',
  geoPosition: '<Position><GeoPosition latitude="35" longitude="139"/></Position>',
  trajectoryPosition:
    '<Position><TrajectoryPosition s="5"><TrajectoryRef><CatalogReference catalogName="C" entryName="E"/></TrajectoryRef></TrajectoryPosition></Position>',
};

describe('parsePosition — S4-4: unknown position throws instead of silent WorldPosition', () => {
  it('parses every canonical POSITION_TYPES member to its discriminator', () => {
    for (const type of POSITION_TYPES) {
      expect(parse(KNOWN_POSITION_XML[type]).type).toBe(type);
    }
  });

  it('throws on an unknown Position child element, naming it', () => {
    // Previously this silently returned { type: 'worldPosition', x: 0, y: 0 },
    // corrupting the scenario with a bogus origin position.
    expect(() => parse('<Position><FooBarPosition x="1" y="2"/></Position>')).toThrow(
      /Unknown Position type/,
    );
    expect(() => parse('<Position><FooBarPosition x="1" y="2"/></Position>')).toThrow(/FooBarPosition/);
  });

  it('still throws on a missing/empty Position element', () => {
    expect(() => parsePosition(undefined)).toThrow(/Position element is missing/);
    // <Position/> collapses to '' (empty), which is treated as missing.
    expect(() => parse('<Position/>')).toThrow(/Position element is missing/);
  });
});

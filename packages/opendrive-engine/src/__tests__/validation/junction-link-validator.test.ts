/**
 * Tests for post-execution junction link validation and repair.
 */

import { describe, it, expect } from 'vitest';
import type { OdrRoad } from '@osce/shared';
import { createOpenDriveStore } from '../../store/opendrive-store.js';
import { validateJunctionLinks, repairJunctionLinks } from '../../validation/junction-validator.js';
import { createTestRoad } from '../helpers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSegmentRoad(id: string, length: number, hdg = 0, x = 0, y = 0): OdrRoad {
  return createTestRoad({
    id,
    length,
    planView: [{ s: 0, x, y, hdg, length, type: 'line' }],
    lanes: [
      {
        s: 0,
        leftLanes: [],
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        rightLanes: [
          {
            id: -1,
            type: 'driving',
            width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
            roadMarks: [],
          },
        ],
      },
    ],
  });
}

function makeConnectingRoad(
  id: string,
  predId: string,
  predContact: 'start' | 'end',
  succId: string,
  succContact: 'start' | 'end',
): OdrRoad {
  return createTestRoad({
    id,
    length: 14,
    junction: '100',
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 14, type: 'line' }],
    link: {
      predecessor: { elementType: 'road', elementId: predId, contactPoint: predContact },
      successor: { elementType: 'road', elementId: succId, contactPoint: succContact },
    },
  });
}

/**
 * Set up a store with a valid junction (segment roads with junction links,
 * connecting roads, and junction connections).
 */
function setupValidJunction() {
  const odrStoreApi = createOpenDriveStore();
  const store = odrStoreApi.getState();

  // Add segment roads
  const seg10 = makeSegmentRoad('10', 43, 0, 0, 0);
  const seg11 = makeSegmentRoad('11', 43, 0, 57, 0);
  const seg20 = makeSegmentRoad('20', 43, Math.PI / 2, 50, -50);
  const seg21 = makeSegmentRoad('21', 43, Math.PI / 2, 50, 57);

  store.addRoad(seg10);
  store.addRoad(seg11);
  store.addRoad(seg20);
  store.addRoad(seg21);

  // Add connecting roads
  store.addRoad(makeConnectingRoad('conn-1', '10', 'end', '21', 'start'));
  store.addRoad(makeConnectingRoad('conn-2', '11', 'start', '20', 'end'));

  // Add junction
  store.addJunction({
    id: '100',
    name: 'Junction 100',
    type: 'default',
    connections: [
      { id: 'c1', incomingRoad: '10', connectingRoad: 'conn-1', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
      { id: 'c2', incomingRoad: '11', connectingRoad: 'conn-2', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
    ],
  });

  // Set road-to-junction links
  store.setRoadLink('10', 'successor', { elementType: 'junction', elementId: '100' });
  store.setRoadLink('11', 'predecessor', { elementType: 'junction', elementId: '100' });

  return { store, odrStoreApi };
}

// ---------------------------------------------------------------------------
// Tests: validateJunctionLinks
// ---------------------------------------------------------------------------

describe('validateJunctionLinks', () => {
  it('returns no errors for a valid document', () => {
    const { store } = setupValidJunction();
    const doc = store.getDocument();
    const errors = validateJunctionLinks(doc);
    expect(errors).toEqual([]);
  });

  it('detects non-existent incomingRoad', () => {
    const { store } = setupValidJunction();

    // Manually break: update junction connection to reference non-existent road
    store.updateJunction('100', {
      connections: [
        { id: 'c1', incomingRoad: 'ghost-road', connectingRoad: 'conn-1', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
        { id: 'c2', incomingRoad: '11', connectingRoad: 'conn-2', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
      ],
    });

    const doc = store.getDocument();
    const errors = validateJunctionLinks(doc);

    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some((e) => e.code === 'STALE_INCOMING_ROAD')).toBe(true);
  });

  it('detects missing road-to-junction link', () => {
    const { store } = setupValidJunction();

    // Remove the junction link from road 10
    store.setRoadLink('10', 'successor', undefined);

    const doc = store.getDocument();
    const errors = validateJunctionLinks(doc);

    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some((e) => e.code === 'MISSING_ROAD_JUNCTION_LINK')).toBe(true);
    expect(errors.some((e) => e.message.includes('10'))).toBe(true);
  });

  it('detects non-existent connectingRoad', () => {
    const { store } = setupValidJunction();

    // Update junction connection to reference non-existent connecting road
    store.updateJunction('100', {
      connections: [
        { id: 'c1', incomingRoad: '10', connectingRoad: 'ghost-conn', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
        { id: 'c2', incomingRoad: '11', connectingRoad: 'conn-2', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
      ],
    });

    const doc = store.getDocument();
    const errors = validateJunctionLinks(doc);

    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some((e) => e.code === 'STALE_CONNECTING_ROAD')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: repairJunctionLinks
// ---------------------------------------------------------------------------

describe('repairJunctionLinks', () => {
  it('repairs missing road-to-junction links using connecting road topology', () => {
    const { store } = setupValidJunction();

    // Break: remove junction links from segment roads
    store.setRoadLink('10', 'successor', undefined);
    store.setRoadLink('11', 'predecessor', undefined);

    const doc = store.getDocument();
    const errorsBefore = validateJunctionLinks(doc);
    expect(errorsBefore.length).toBeGreaterThan(0);

    // Repair
    const repaired = repairJunctionLinks(store, doc);
    expect(repaired).toBeGreaterThan(0);

    // Validate again — should be clean
    const docAfter = store.getDocument();
    const errorsAfter = validateJunctionLinks(docAfter);
    expect(errorsAfter).toEqual([]);

    // Verify the actual links
    const road10 = docAfter.roads.find((r) => r.id === '10');
    expect(road10?.link?.successor?.elementType).toBe('junction');
    expect(road10?.link?.successor?.elementId).toBe('100');

    const road11 = docAfter.roads.find((r) => r.id === '11');
    expect(road11?.link?.predecessor?.elementType).toBe('junction');
    expect(road11?.link?.predecessor?.elementId).toBe('100');
  });

  it('repairs stale incomingRoad references', () => {
    const { store } = setupValidJunction();

    // Break: update junction connection to reference non-existent road,
    // but keep the connecting road's predecessor pointing to the real road.
    store.updateJunction('100', {
      connections: [
        { id: 'c1', incomingRoad: 'old-road', connectingRoad: 'conn-1', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
        { id: 'c2', incomingRoad: '11', connectingRoad: 'conn-2', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
      ],
    });

    const doc = store.getDocument();
    const repaired = repairJunctionLinks(store, doc);
    expect(repaired).toBeGreaterThanOrEqual(1);

    // Verify the connection now references road '10' (from conn-1's predecessor)
    const docAfter = store.getDocument();
    const junction = docAfter.junctions.find((j) => j.id === '100');
    const conn1 = junction?.connections.find((c) => c.connectingRoad === 'conn-1');
    expect(conn1?.incomingRoad).toBe('10');
  });

  it('returns 0 when no repairs needed', () => {
    const { store } = setupValidJunction();
    const doc = store.getDocument();
    const repaired = repairJunctionLinks(store, doc);
    expect(repaired).toBe(0);
  });
});

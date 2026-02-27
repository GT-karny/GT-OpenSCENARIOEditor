import { describe, it, expect } from 'vitest';
import { extractEntityPositions } from '../../scenario/useEntityPositions.js';
import { makeScenarioWithEntities, makeStraightRoadDoc } from '../helpers.js';

describe('extractEntityPositions', () => {
  it('extracts world positions from init teleport actions', () => {
    const doc = makeScenarioWithEntities();
    const positions = extractEntityPositions(doc, null);

    expect(positions.size).toBe(3);
    expect(positions.get('Ego')).toEqual({ x: 10, y: 0, z: 0, h: 0 });
    expect(positions.get('Target')).toEqual({ x: 50, y: -3.5, z: 0, h: 0 });
    expect(positions.get('Pedestrian1')).toEqual({ x: 30, y: 5, z: 0, h: 1.57 });
  });

  it('returns empty map when no init actions exist', () => {
    const doc = makeScenarioWithEntities();
    doc.storyboard.init.entityActions = [];
    const positions = extractEntityPositions(doc, null);
    expect(positions.size).toBe(0);
  });

  it('skips entities without teleport actions', () => {
    const doc = makeScenarioWithEntities();
    // Replace first entity's actions with a speed action (no teleport)
    doc.storyboard.init.entityActions[0].privateActions = [
      {
        id: 'speed-1',
        action: {
          type: 'speedAction',
          dynamics: { dynamicsShape: 'step', dynamicsDimension: 'time', value: 0 },
          target: { kind: 'absolute', value: 25 },
        },
      },
    ];
    const positions = extractEntityPositions(doc, null);
    expect(positions.size).toBe(2);
    expect(positions.has('Ego')).toBe(false);
    expect(positions.has('Target')).toBe(true);
    expect(positions.has('Pedestrian1')).toBe(true);
  });

  it('resolves lane positions when odrDoc is provided', () => {
    const doc = makeScenarioWithEntities();
    const odrDoc = makeStraightRoadDoc();

    // Replace Ego's position with a lane position
    doc.storyboard.init.entityActions[0].privateActions = [
      {
        id: 'tp-lane',
        action: {
          type: 'teleportAction',
          position: {
            type: 'lanePosition',
            roadId: '1',
            laneId: '-1',
            s: 50,
          },
        },
      },
    ];

    const positions = extractEntityPositions(doc, odrDoc);
    expect(positions.has('Ego')).toBe(true);
    const egoPos = positions.get('Ego')!;
    expect(egoPos.x).toBeCloseTo(50, 0);
    expect(egoPos.y).toBeLessThan(0); // Right lane
  });
});

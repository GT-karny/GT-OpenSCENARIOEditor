import { describe, it, expect } from 'vitest';
import { getEntityGeometry, getEntityColor } from '../../utils/entity-geometry.js';
import type { ScenarioEntity } from '@osce/shared';
import { makeScenarioWithEntities } from '../helpers.js';

describe('getEntityGeometry', () => {
  const scenario = makeScenarioWithEntities();
  const ego = scenario.entities[0]; // Vehicle
  const pedestrian = scenario.entities[2]; // Pedestrian

  it('extracts geometry from vehicle definition', () => {
    const geom = getEntityGeometry(ego);
    expect(geom.width).toBe(2.0);
    expect(geom.length).toBe(4.5);
    expect(geom.height).toBe(1.8);
    expect(geom.centerX).toBe(1.4);
    expect(geom.centerY).toBe(0);
    expect(geom.centerZ).toBe(0.9);
  });

  it('extracts geometry from pedestrian definition', () => {
    const geom = getEntityGeometry(pedestrian);
    expect(geom.width).toBe(0.5);
    expect(geom.length).toBe(0.5);
    expect(geom.height).toBe(1.7);
  });

  it('uses defaults for catalog reference entity', () => {
    const catalogEntity: ScenarioEntity = {
      id: 'cat-1',
      name: 'CatalogCar',
      type: 'vehicle',
      definition: {
        kind: 'catalogReference',
        catalogName: 'VehicleCatalog',
        entryName: 'car_white',
        parameterAssignments: [],
      },
    };
    const geom = getEntityGeometry(catalogEntity);
    expect(geom.width).toBeGreaterThan(0);
    expect(geom.length).toBeGreaterThan(0);
    expect(geom.height).toBeGreaterThan(0);
  });

  it('uses defaults for miscObject catalog reference', () => {
    const miscEntity: ScenarioEntity = {
      id: 'misc-1',
      name: 'Barrier',
      type: 'miscObject',
      definition: {
        kind: 'catalogReference',
        catalogName: 'MiscCatalog',
        entryName: 'barrier',
        parameterAssignments: [],
      },
    };
    const geom = getEntityGeometry(miscEntity);
    expect(geom.width).toBe(1.0);
    expect(geom.length).toBe(1.0);
    expect(geom.height).toBe(1.0);
  });
});

describe('getEntityColor', () => {
  it('returns blue for ego vehicle', () => {
    expect(getEntityColor('vehicle', true)).toBe('#3366FF');
  });

  it('returns green for non-ego vehicle', () => {
    expect(getEntityColor('vehicle', false)).toBe('#33CC33');
  });

  it('returns orange for pedestrian', () => {
    expect(getEntityColor('pedestrian', false)).toBe('#FF8800');
  });

  it('returns yellow for miscObject', () => {
    expect(getEntityColor('miscObject', false)).toBe('#CCCC00');
  });
});

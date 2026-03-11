import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import type { BulbFaceShape } from '../../utils/signal-catalog.js';
import {
  getShape,
  createArrowUpShape,
  createArrowLeftShape,
  createArrowRightShape,
  createArrowUpLeftShape,
  createArrowUpRightShape,
  createPedestrianStopShape,
  createPedestrianGoShape,
} from '../../utils/signal-shapes.js';

describe('arrow shape factories', () => {
  it('createArrowUpShape returns a closed Shape', () => {
    const shape = createArrowUpShape();
    expect(shape).toBeInstanceOf(THREE.Shape);
    expect(shape.getPoints().length).toBeGreaterThan(3);
  });

  it('createArrowLeftShape returns a closed Shape', () => {
    const shape = createArrowLeftShape();
    expect(shape).toBeInstanceOf(THREE.Shape);
    expect(shape.getPoints().length).toBeGreaterThan(3);
  });

  it('createArrowRightShape returns a closed Shape', () => {
    const shape = createArrowRightShape();
    expect(shape).toBeInstanceOf(THREE.Shape);
    expect(shape.getPoints().length).toBeGreaterThan(3);
  });
});

describe('combined arrow shapes (single continuous path)', () => {
  it('createArrowUpLeftShape returns a valid Shape without holes', () => {
    const shape = createArrowUpLeftShape();
    expect(shape).toBeInstanceOf(THREE.Shape);
    expect(shape.getPoints().length).toBeGreaterThan(5);
    expect(shape.holes).toHaveLength(0);
    const geo = new THREE.ShapeGeometry(shape);
    expect(geo.attributes.position.count).toBeGreaterThan(3);
  });

  it('createArrowUpRightShape returns a valid Shape without holes', () => {
    const shape = createArrowUpRightShape();
    expect(shape).toBeInstanceOf(THREE.Shape);
    expect(shape.getPoints().length).toBeGreaterThan(5);
    expect(shape.holes).toHaveLength(0);
    const geo = new THREE.ShapeGeometry(shape);
    expect(geo.attributes.position.count).toBeGreaterThan(3);
  });
});

describe('pedestrian shape factories', () => {
  it('createPedestrianStopShape returns a closed Shape', () => {
    const shape = createPedestrianStopShape();
    expect(shape).toBeInstanceOf(THREE.Shape);
    expect(shape.getPoints().length).toBeGreaterThan(5);
  });

  it('createPedestrianGoShape returns a closed Shape', () => {
    const shape = createPedestrianGoShape();
    expect(shape).toBeInstanceOf(THREE.Shape);
    expect(shape.getPoints().length).toBeGreaterThan(5);
  });
});

describe('getShape', () => {
  it('returns null for circle', () => {
    expect(getShape('circle')).toBeNull();
  });

  it('returns Shape instances for all non-circle face shapes', () => {
    const shapes: BulbFaceShape[] = [
      'arrow-up',
      'arrow-left',
      'arrow-right',
      'arrow-up-left',
      'arrow-up-right',
      'arrow-diagonal-left',
      'arrow-diagonal-right',
      'arrow-turn-left',
      'arrow-turn-right',
      'arrow-uturn',
      'arrow-complex',
      'pedestrian-stop',
      'pedestrian-go',
    ];
    for (const s of shapes) {
      const shape = getShape(s);
      expect(shape, `getShape('${s}') should not be null`).toBeInstanceOf(THREE.Shape);
    }
  });

  it('caches shapes (same instance returned)', () => {
    const a = getShape('arrow-up');
    const b = getShape('arrow-up');
    expect(a).toBe(b);
  });
});

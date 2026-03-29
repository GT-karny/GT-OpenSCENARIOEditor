import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import type { BulbFaceShape } from '../../utils/signal-catalog.js';
import { getShape, getShapeGeometry } from '../../utils/signal-shapes.js';

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
      expect(shape!.getPoints().length, `getShape('${s}') should have > 3 points`).toBeGreaterThan(3);
    }
  });

  it('caches shapes (same instance returned)', () => {
    const a = getShape('arrow-up');
    const b = getShape('arrow-up');
    expect(a).toBe(b);
  });

  it('combined arrow shapes have no holes', () => {
    for (const s of ['arrow-up-left', 'arrow-up-right'] as BulbFaceShape[]) {
      const shape = getShape(s)!;
      expect(shape.holes).toHaveLength(0);
      const geo = new THREE.ShapeGeometry(shape);
      expect(geo.attributes.position.count).toBeGreaterThan(3);
    }
  });
});

describe('getShapeGeometry', () => {
  it('returns null for circle', () => {
    expect(getShapeGeometry('circle')).toBeNull();
  });

  it('returns ShapeGeometry for arrow-up', () => {
    const geo = getShapeGeometry('arrow-up');
    expect(geo).toBeInstanceOf(THREE.ShapeGeometry);
    expect(geo!.attributes.position.count).toBeGreaterThan(3);
  });

  it('caches geometry (same instance returned)', () => {
    const a = getShapeGeometry('arrow-left');
    const b = getShapeGeometry('arrow-left');
    expect(a).toBe(b);
  });
});

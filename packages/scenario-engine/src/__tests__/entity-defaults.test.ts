import { describe, it, expect } from 'vitest';
import {
  createDefaultVehicleDefinition,
  createDefaultPedestrianDefinition,
  createDefaultMiscObjectDefinition,
} from '../store/entity-defaults.js';
import { createEntityFromPartial } from '../store/defaults.js';

describe('entity-defaults (canonical single source of truth)', () => {
  describe('createDefaultVehicleDefinition', () => {
    it('produces physics-realistic car defaults (no arcade 200 acceleration)', () => {
      const def = createDefaultVehicleDefinition('Ego');
      expect(def.kind).toBe('vehicle');
      expect(def.vehicleCategory).toBe('car');
      expect(def.performance).toEqual({
        maxSpeed: 69.4,
        maxAcceleration: 5.0,
        maxDeceleration: 8.0,
      });
      expect(def.boundingBox.dimensions).toEqual({ width: 1.8, length: 4.5, height: 1.5 });
    });

    it('is category-aware (truck has its own physics and bbox)', () => {
      const def = createDefaultVehicleDefinition('Truck', 'truck');
      expect(def.vehicleCategory).toBe('truck');
      expect(def.performance).toEqual({
        maxSpeed: 33.3,
        maxAcceleration: 3.0,
        maxDeceleration: 6.0,
      });
      expect(def.boundingBox.dimensions).toEqual({ width: 2.5, length: 12.0, height: 3.5 });
    });

    it('falls back to the car profile for unknown categories', () => {
      const def = createDefaultVehicleDefinition('Unknown', 'trailer');
      expect(def.vehicleCategory).toBe('trailer');
      expect(def.performance.maxAcceleration).toBe(5.0);
    });

    it('returns independent copies (mutating one does not affect the next)', () => {
      const a = createDefaultVehicleDefinition('A');
      a.performance.maxAcceleration = 999;
      a.boundingBox.dimensions.width = 0;
      const b = createDefaultVehicleDefinition('B');
      expect(b.performance.maxAcceleration).toBe(5.0);
      expect(b.boundingBox.dimensions.width).toBe(1.8);
    });
  });

  describe('createDefaultPedestrianDefinition', () => {
    it('produces canonical pedestrian defaults with a single model string', () => {
      const def = createDefaultPedestrianDefinition('Walker');
      expect(def.kind).toBe('pedestrian');
      expect(def.pedestrianCategory).toBe('pedestrian');
      expect(def.mass).toBe(75);
      expect(def.model).toBe('EPTa');
      expect(def.boundingBox.dimensions).toEqual({ width: 0.5, length: 0.3, height: 1.8 });
    });
  });

  describe('createDefaultMiscObjectDefinition', () => {
    it('produces canonical misc-object defaults (not vehicle-sized)', () => {
      const def = createDefaultMiscObjectDefinition('Cone');
      expect(def.kind).toBe('miscObject');
      expect(def.miscObjectCategory).toBe('obstacle');
      expect(def.mass).toBe(100);
      expect(def.boundingBox.dimensions).toEqual({ width: 1.0, length: 1.0, height: 1.0 });
    });
  });

  describe('createEntityFromPartial', () => {
    it('uses the canonical vehicle factory for the fallback definition', () => {
      const entity = createEntityFromPartial({ name: 'Ego' });
      expect(entity.definition.kind).toBe('vehicle');
      if (entity.definition.kind === 'vehicle') {
        expect(entity.definition.performance.maxAcceleration).toBe(5.0);
      }
    });
  });
});

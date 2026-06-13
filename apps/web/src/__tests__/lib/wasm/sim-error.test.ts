import { describe, it, expect } from 'vitest';
import { classifySimError, toErrorMessage } from '../../../lib/wasm/sim-error';

describe('sim-error', () => {
  describe('toErrorMessage', () => {
    it('unwraps Error instances', () => {
      expect(toErrorMessage(new Error('boom'))).toBe('boom');
    });
    it('passes strings through', () => {
      expect(toErrorMessage('plain')).toBe('plain');
    });
    it('stringifies other values', () => {
      expect(toErrorMessage(42)).toBe('42');
      expect(toErrorMessage({ a: 1 })).toBe('[object Object]');
    });
  });

  describe('classifySimError', () => {
    it('classifies load timeouts', () => {
      const r = classifySimError('Scenario load timed out after 30s');
      expect(r.key).toBe('simulation.timeout');
      expect(r.message).toContain('timed out');
    });

    it('classifies missing / unloadable road networks', () => {
      expect(classifySimError("Couldn't locate OpenSCENARIO road.xodr").key).toBe(
        'simulation.missingRoad',
      );
      expect(classifySimError('Failed to load OpenDRIVE file').key).toBe('simulation.missingRoad');
    });

    it('classifies missing catalogs (including unresolved catalog-file references)', () => {
      // esmini reports an unresolved CatalogReference this way:
      expect(
        classifySimError("Couldn't locate OpenSCENARIO file RoutesAtFabriksgatan").key,
      ).toBe('simulation.missingCatalogs');
      expect(classifySimError('Catalog entry not found: car_white').key).toBe(
        'simulation.missingCatalogs',
      );
      expect(classifySimError('Failed to load catalog VehicleCatalog').key).toBe(
        'simulation.missingCatalogs',
      );
    });

    it('classifies runtime/step crashes', () => {
      expect(classifySimError('Playback crashed: bad access').key).toBe('simulation.runtimeError');
    });

    it('classifies worker / wasm crashes', () => {
      expect(classifySimError('Worker encountered an unrecoverable error').key).toBe(
        'simulation.workerError',
      );
      expect(classifySimError('RuntimeError: memory access out of bounds').key).toBe(
        'simulation.workerError',
      );
    });

    it('falls back to initFailed for unknown SE_Init messages', () => {
      const r = classifySimError('Some unexpected scenario parse problem');
      expect(r.key).toBe('simulation.initFailed');
      expect(r.message).toBe('Some unexpected scenario parse problem');
    });

    it('always preserves the raw message for interpolation', () => {
      const raw = new Error('detailed engine failure 0xDEAD');
      expect(classifySimError(raw).message).toBe('detailed engine failure 0xDEAD');
    });
  });
});

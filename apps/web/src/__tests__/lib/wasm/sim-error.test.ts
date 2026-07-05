import { describe, it, expect } from 'vitest';
import {
  classifySimError,
  toErrorMessage,
  xodrHasInclude,
  documentHasInclude,
  INCLUDE_UNSUPPORTED_MESSAGE,
} from '../../../lib/wasm/sim-error';

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

    it('classifies <include>-caused load failures as includeUnsupported (via xodr source)', () => {
      const xodr = '<OpenDRIVE><include file="part1.xodr"/></OpenDRIVE>';
      const r = classifySimError('Failed to load OpenDRIVE file', xodr);
      expect(r.key).toBe('simulation.includeUnsupported');
      expect(r.message).toBe(INCLUDE_UNSUPPORTED_MESSAGE);
    });

    it('classifies <include>-caused load failures via the worker-flagged message', () => {
      const r = classifySimError(
        'OpenDRIVE map uses <include> references (unsupported by the simulator): load failed',
      );
      expect(r.key).toBe('simulation.includeUnsupported');
    });

    it('does not misclassify normal road failures without includes as includeUnsupported', () => {
      const xodr = '<OpenDRIVE><road id="1"/></OpenDRIVE>';
      expect(classifySimError('Failed to load OpenDRIVE file', xodr).key).toBe(
        'simulation.missingRoad',
      );
    });
  });

  describe('xodrHasInclude', () => {
    it('detects self-closing and paired include elements (namespace-tolerant)', () => {
      expect(xodrHasInclude('<OpenDRIVE><include file="a.xodr"/></OpenDRIVE>')).toBe(true);
      expect(xodrHasInclude('<include>a.xodr</include>')).toBe(true);
      expect(xodrHasInclude('<odr:include file="a.xodr"/>')).toBe(true);
    });
    it('returns false when there is no include element', () => {
      expect(xodrHasInclude('<OpenDRIVE><road id="1"/></OpenDRIVE>')).toBe(false);
      expect(xodrHasInclude('<!-- includes are documented elsewhere -->')).toBe(false);
      expect(xodrHasInclude(undefined)).toBe(false);
      expect(xodrHasInclude(null)).toBe(false);
    });
  });

  describe('documentHasInclude', () => {
    it('detects includes at header scope', () => {
      expect(documentHasInclude({ header: { includes: [{ file: 'a.xodr' }] }, roads: [] })).toBe(
        true,
      );
    });
    it('detects includes at road scope', () => {
      expect(
        documentHasInclude({ header: {}, roads: [{ includes: [{ file: 'b.xodr' }] }] }),
      ).toBe(true);
    });
    it('returns false when no scope declares includes', () => {
      expect(documentHasInclude({ header: { includes: [] }, roads: [{}, {}] })).toBe(false);
      expect(documentHasInclude({})).toBe(false);
      expect(documentHasInclude(null)).toBe(false);
      expect(documentHasInclude(undefined)).toBe(false);
    });
  });
});

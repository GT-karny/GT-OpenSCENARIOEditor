import { describe, it, expect } from 'vitest';
import type {
  UseCaseComponent,
  ComponentParameter,
  DecompositionContext,
  UseCaseCategory,
} from '@osce/shared';
import { useCaseComponents, getUseCaseById, getUseCasesByCategory } from '../index.js';

const VALID_CATEGORIES: UseCaseCategory[] = [
  'highway',
  'intersection',
  'pedestrian',
  'parking',
  'general',
];

const emptyContext = (): DecompositionContext => ({ existingEntities: [] });

function defaultParams(uc: UseCaseComponent): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const p of uc.parameters) params[p.name] = p.default;
  return params;
}

/**
 * Collect every entity-name reference embedded anywhere in a decompose result,
 * so referential integrity is checked deeply (actor lists, action targets,
 * teleport positions, trigger conditions) rather than only at the top level.
 * Entity names live under keys `entityRef` (string) and `entityRefs` (string[]).
 */
function collectEntityRefs(node: unknown, refs: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) collectEntityRefs(item, refs);
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'entityRef' && typeof value === 'string') {
        refs.add(value);
      } else if (key === 'entityRefs' && Array.isArray(value)) {
        for (const v of value) if (typeof v === 'string') refs.add(v);
      } else {
        collectEntityRefs(value, refs);
      }
    }
  }
}

/** Pick an in-range value distinct from the parameter's default. */
function pickOverride(p: ComponentParameter): number {
  const def = Number(p.default);
  const lo = p.min ?? def - 10;
  const hi = p.max ?? def + 10;
  let override = lo + (hi - lo) / 3;
  if (Math.abs(override - def) < 1e-6) override = lo + (2 * (hi - lo)) / 3;
  return override;
}

describe('useCaseComponents registry', () => {
  it('exposes at least one use case', () => {
    expect(useCaseComponents.length).toBeGreaterThan(0);
  });

  it('has globally unique ids', () => {
    const ids = useCaseComponents.map((uc) => uc.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getUseCaseById resolves every registered id and rejects unknown ids', () => {
    for (const uc of useCaseComponents) {
      expect(getUseCaseById(uc.id)).toBe(uc);
    }
    expect(getUseCaseById('___no_such_use_case___')).toBeUndefined();
  });

  it('getUseCasesByCategory returns only members of the requested category', () => {
    for (const category of VALID_CATEGORIES) {
      for (const uc of getUseCasesByCategory(category)) {
        expect(uc.category).toBe(category);
      }
    }
  });
});

describe.each(useCaseComponents.map((uc) => [uc.id, uc] as const))(
  'use case: %s',
  (_id, uc) => {
    // (a) metadata well-formed
    it('has well-formed metadata', () => {
      expect(typeof uc.id).toBe('string');
      expect(uc.id).toBeTruthy();
      expect(uc.name).toBeTruthy();
      expect(uc.nameKey).toBeTruthy();
      expect(VALID_CATEGORIES).toContain(uc.category);
      expect(Array.isArray(uc.parameters)).toBe(true);
      expect(typeof uc.decompose).toBe('function');
    });

    it('has unique parameter names', () => {
      const names = uc.parameters.map((p) => p.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it('declares defaults within bounds and valid enum choices', () => {
      for (const p of uc.parameters) {
        if (p.type === 'number') {
          const def = Number(p.default);
          expect(Number.isFinite(def)).toBe(true);
          if (p.min !== undefined) expect(def).toBeGreaterThanOrEqual(p.min);
          if (p.max !== undefined) expect(def).toBeLessThanOrEqual(p.max);
        }
        if (p.type === 'enum') {
          expect(p.enumValues).toBeDefined();
          expect(p.enumValues).toContain(p.default);
        }
      }
    });

    // (b) decompose(defaults) is internally consistent
    it('decompose(defaults) yields consistent internal references', () => {
      const result = uc.decompose(defaultParams(uc), emptyContext());

      expect(Array.isArray(result.entities)).toBe(true);
      expect(result.entities.length).toBeGreaterThan(0);
      expect(Array.isArray(result.initActions)).toBe(true);
      expect(Array.isArray(result.stories)).toBe(true);
      expect(result.stories.length).toBeGreaterThan(0);

      // Produced entity names are the anchor set for every reference.
      const entityNames = new Set<string>();
      for (const e of result.entities) {
        expect(e.name).toBeTruthy();
        entityNames.add(e.name as string);
      }
      expect(entityNames.size).toBe(result.entities.length); // names unique

      // initActions target declared entities.
      for (const ia of result.initActions) {
        expect(entityNames.has(ia.entityName)).toBe(true);
        expect(Array.isArray(ia.actions)).toBe(true);
        expect(ia.actions.length).toBeGreaterThan(0);
      }

      // Every embedded entity reference resolves to a produced entity.
      const refs = new Set<string>();
      collectEntityRefs(result.initActions, refs);
      collectEntityRefs(result.stories, refs);
      for (const ref of refs) {
        expect(entityNames.has(ref)).toBe(true);
      }
    });

    // (c) an overridden numeric parameter is reflected in the output
    const numeric = uc.parameters.find((p) => p.type === 'number');
    if (numeric) {
      it(`reflects an overridden numeric parameter (${numeric.name})`, () => {
        const baseline = uc.decompose(defaultParams(uc), emptyContext());
        const override = pickOverride(numeric);
        const changed = uc.decompose(
          { ...defaultParams(uc), [numeric.name]: override },
          emptyContext(),
        );

        // The override must change the decomposition...
        expect(JSON.stringify(changed)).not.toBe(JSON.stringify(baseline));
        // ...and the overridden value must surface somewhere in the output.
        expect(JSON.stringify(changed)).toContain(String(override));
      });
    }

    // (d) paramMapping keys reference declared parameters
    it('paramMapping keys reference declared parameters', () => {
      const result = uc.decompose(defaultParams(uc), emptyContext());
      const paramNames = new Set(uc.parameters.map((p) => p.name));
      if (result.paramMapping) {
        for (const key of Object.keys(result.paramMapping)) {
          expect(paramNames.has(key)).toBe(true);
        }
      }
    });
  },
);

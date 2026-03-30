import type { CatalogReference, EntityType, ScenarioEntity } from '@osce/shared';
import { useCatalogStore } from '../stores/catalog-store';

const ENTITY_TYPES: EntityType[] = ['vehicle', 'pedestrian', 'miscObject'];

/**
 * After catalogs are loaded, resolve CatalogReference entities to their actual types
 * by inspecting the loaded catalog contents (e.g., PedestrianCatalog → 'pedestrian').
 * Uses direct setState to avoid polluting undo history during initial file load.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveCatalogEntityTypes(storeApi: {
  getState: () => any;
  setState: (s: any) => void;
}): void {
  const { document } = storeApi.getState();
  const { resolveReference } = useCatalogStore.getState();
  let updated = false;

  const updatedEntities = document.entities.map((entity: ScenarioEntity) => {
    if (entity.definition.kind !== 'catalogReference') return entity;
    const resolved = resolveReference(entity.definition as CatalogReference);
    if (!resolved) return entity;

    const resolvedType = resolved.catalogType as EntityType;
    if (!ENTITY_TYPES.includes(resolvedType)) return entity;
    if (entity.type === resolvedType) return entity;

    updated = true;
    return { ...entity, type: resolvedType };
  });

  if (updated) {
    storeApi.setState({ document: { ...document, entities: updatedEntities } });
  }
}

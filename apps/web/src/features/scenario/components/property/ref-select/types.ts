import type { EntityType, ParameterDeclaration, VariableDeclaration } from '@osce/shared';

/** A single selectable row in the generic {@link RefSelect}. */
export interface RefSelectItem {
  name: string;
  group?: string;
  description?: string;
}

/** Display metadata for an entity type group. */
export const TYPE_LABELS: Record<EntityType, string> = {
  vehicle: 'Vehicle',
  pedestrian: 'Pedestrian',
  miscObject: 'Misc Object',
};

export const TYPE_ORDER: EntityType[] = ['vehicle', 'pedestrian', 'miscObject'];

/** Kind of a flat keyboard-navigable item in the entity-backed selectors. */
export type EntityFlatItemKind = 'empty' | 'entity' | 'param' | 'var';

/** A keyboard-navigable item produced by {@link useEntityRefSources}. */
export interface EntityFlatItem {
  kind: EntityFlatItemKind;
  name: string;
}

/** A displayed entity group. */
export interface EntityGroup {
  type: EntityType;
  label: string;
  items: { id: string; name: string; type: EntityType }[];
}

/** A parameter or variable declaration row source. */
export type ParamOrVar = ParameterDeclaration | VariableDeclaration;

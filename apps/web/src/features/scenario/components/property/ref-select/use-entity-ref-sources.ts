import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { EntityType, ParameterDeclaration, VariableDeclaration } from '@osce/shared';
import { useScenarioStore } from '../../../../../stores/use-scenario-store';
import { TYPE_LABELS, TYPE_ORDER, type EntityFlatItem, type EntityGroup } from './types';

interface EntityRefSourcesOptions {
  /** Whether to prepend an empty-selection flat item (single selector only). */
  allowEmpty?: boolean;
}

interface EntityRefSources {
  entities: { id: string; name: string; type: EntityType }[];
  parameters: ParameterDeclaration[];
  variables: VariableDeclaration[];
  /** True when the search query starts with `$` (parameter/variable lookup). */
  parameterMode: boolean;
  grouped: EntityGroup[];
  filteredParams: ParameterDeclaration[];
  filteredVars: VariableDeclaration[];
  /** Flat, keyboard-navigable list aligned with the rendered rows. */
  flatItems: EntityFlatItem[];
}

/**
 * Auto-fetches entities, string parameters, and string variables from the
 * scenario store and derives the filtered/grouped structures shared by the
 * single and multi entity selectors. The `$` prefix in `search` switches the
 * results to parameter/variable lookup mode.
 */
export function useEntityRefSources(
  search: string,
  { allowEmpty = false }: EntityRefSourcesOptions = {},
): EntityRefSources {
  const entities = useScenarioStore(useShallow((s) => s.document.entities));
  const parameters = useScenarioStore((s) => s.document.parameterDeclarations);
  const variables = useScenarioStore((s) => s.document.variableDeclarations);

  const parameterMode = search.startsWith('$');

  const filteredEntities = useMemo(() => {
    if (parameterMode) return [];
    if (!search) return entities;
    const lower = search.toLowerCase();
    return entities.filter((e) => e.name.toLowerCase().includes(lower));
  }, [entities, search, parameterMode]);

  const grouped = useMemo(() => {
    const groups: EntityGroup[] = [];
    const byType = new Map<EntityType, EntityGroup['items']>();
    for (const e of filteredEntities) {
      if (!byType.has(e.type)) byType.set(e.type, []);
      byType.get(e.type)!.push({ id: e.id, name: e.name, type: e.type });
    }
    for (const t of TYPE_ORDER) {
      const items = byType.get(t);
      if (items?.length) groups.push({ type: t, label: TYPE_LABELS[t], items });
    }
    return groups;
  }, [filteredEntities]);

  const filteredParams = useMemo(() => {
    const stringParams = parameters.filter((p) => p.parameterType === 'string');
    if (parameterMode) {
      const fragment = search.substring(1).toLowerCase();
      return stringParams.filter((p) => p.name.toLowerCase().startsWith(fragment));
    }
    if (!search) return stringParams;
    const lower = search.toLowerCase();
    return stringParams.filter((p) => p.name.toLowerCase().includes(lower));
  }, [parameterMode, search, parameters]);

  const filteredVars = useMemo(() => {
    const stringVars = variables.filter((v) => v.variableType === 'string');
    if (parameterMode) {
      const fragment = search.substring(1).toLowerCase();
      return stringVars.filter((v) => v.name.toLowerCase().startsWith(fragment));
    }
    if (!search) return stringVars;
    const lower = search.toLowerCase();
    return stringVars.filter((v) => v.name.toLowerCase().includes(lower));
  }, [parameterMode, search, variables]);

  const flatItems = useMemo(() => {
    const items: EntityFlatItem[] = [];
    if (!parameterMode) {
      if (allowEmpty) items.push({ kind: 'empty', name: '' });
      for (const g of grouped) {
        for (const e of g.items) items.push({ kind: 'entity', name: e.name });
      }
    }
    for (const p of filteredParams) items.push({ kind: 'param', name: p.name });
    for (const v of filteredVars) items.push({ kind: 'var', name: v.name });
    return items;
  }, [parameterMode, allowEmpty, grouped, filteredParams, filteredVars]);

  return {
    entities,
    parameters,
    variables,
    parameterMode,
    grouped,
    filteredParams,
    filteredVars,
    flatItems,
  };
}

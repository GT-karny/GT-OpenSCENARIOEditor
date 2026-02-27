import { useCallback } from 'react';
import type { UseCaseComponent } from '@osce/shared';
import { applyUseCaseComponent } from '@osce/scenario-engine';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';

export function useTemplateApply() {
  const storeApi = useScenarioStoreApi();
  const roadNetwork = useEditorStore((s) => s.roadNetwork);

  const applyTemplate = useCallback(
    (component: UseCaseComponent, params: Record<string, unknown>) => {
      const store = storeApi.getState();
      const context = {
        existingEntities: store.document.entities,
        roadNetwork: roadNetwork ?? undefined,
      };

      applyUseCaseComponent(store, component, params, context);
    },
    [storeApi, roadNetwork],
  );

  return { applyTemplate };
}

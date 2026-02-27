import { useCallback } from 'react';
import { XoscValidator } from '@osce/openscenario';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';

export function useValidation() {
  const storeApi = useScenarioStoreApi();
  const setValidationResult = useEditorStore((s) => s.setValidationResult);

  const runValidation = useCallback(() => {
    const doc = storeApi.getState().document;
    const validator = new XoscValidator();
    const result = validator.validate(doc);
    setValidationResult(result);
    return result;
  }, [storeApi, setValidationResult]);

  return { runValidation };
}

import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { I18nextProvider } from '@osce/i18n';
import { initI18n, i18n } from '@osce/i18n';
import { ScenarioStoreProvider } from '../../stores/scenario-store-context';
import { TooltipProvider } from '../../components/ui/tooltip';
import { useValidation } from '../../hooks/use-validation';
import { useEditorStore } from '../../stores/editor-store';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ScenarioStoreProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ScenarioStoreProvider>
    </I18nextProvider>
  );
}

beforeAll(async () => {
  await initI18n('en');
});

describe('useValidation', () => {
  it('should run validation and set result in editor store', () => {
    const { result } = renderHook(() => useValidation(), { wrapper });

    act(() => {
      result.current.runValidation();
    });

    const validationResult = useEditorStore.getState().validationResult;
    expect(validationResult).toBeDefined();
    expect(validationResult).toHaveProperty('valid');
    expect(validationResult).toHaveProperty('errors');
    expect(validationResult).toHaveProperty('warnings');
  });

  it('should return the validation result', () => {
    const { result } = renderHook(() => useValidation(), { wrapper });

    let returnedResult;
    act(() => {
      returnedResult = result.current.runValidation();
    });

    expect(returnedResult).toBeDefined();
    expect(returnedResult).toHaveProperty('valid');
  });
});

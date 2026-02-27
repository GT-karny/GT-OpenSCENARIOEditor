import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook } from '@testing-library/react';
import { I18nextProvider } from '@osce/i18n';
import { initI18n, i18n } from '@osce/i18n';
import { ScenarioStoreProvider } from '../../stores/scenario-store-context';
import { TooltipProvider } from '../../components/ui/tooltip';
import { useFileOperations } from '../../hooks/use-file-operations';
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

describe('useFileOperations', () => {
  it('should provide file operation functions', () => {
    const { result } = renderHook(() => useFileOperations(), { wrapper });

    expect(result.current.newScenario).toBeInstanceOf(Function);
    expect(result.current.openXosc).toBeInstanceOf(Function);
    expect(result.current.saveXosc).toBeInstanceOf(Function);
    expect(result.current.loadXodr).toBeInstanceOf(Function);
  });

  it('should create a new scenario', () => {
    const { result } = renderHook(() => useFileOperations(), { wrapper });

    // newScenario should not throw
    expect(() => result.current.newScenario()).not.toThrow();
  });
});

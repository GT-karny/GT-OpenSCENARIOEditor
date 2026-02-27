import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { I18nextProvider } from '@osce/i18n';
import { initI18n, i18n } from '@osce/i18n';
import { ScenarioStoreProvider } from '../../stores/scenario-store-context';
import { TooltipProvider } from '../../components/ui/tooltip';
import type { ReactElement } from 'react';

let initialized = false;

export async function initTestI18n() {
  if (!initialized) {
    await initI18n('en');
    initialized = true;
  }
}

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ScenarioStoreProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ScenarioStoreProvider>
    </I18nextProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

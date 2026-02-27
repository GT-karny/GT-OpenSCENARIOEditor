import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from '@osce/i18n';
import { initI18n, i18n } from '@osce/i18n';
import { ScenarioStoreProvider } from './stores/scenario-store-context';
import { TooltipProvider } from './components/ui/tooltip';
import App from './App';
import './globals.css';

async function bootstrap() {
  await initI18n('en');

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <ScenarioStoreProvider>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </ScenarioStoreProvider>
      </I18nextProvider>
    </StrictMode>,
  );
}

bootstrap();

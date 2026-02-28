import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { EditorLayout } from './components/layout/EditorLayout';
import { CursorLight } from './components/apex/CursorLight';
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';
import { useScenarioStoreApi } from './stores/use-scenario-store';
import { useEditorStore } from './stores/editor-store';
import { ServerConnectionProvider } from './providers/ServerConnectionProvider';

export default function App() {
  useKeyboardShortcuts();

  // Track dirty state: any scenario store mutation marks the document as dirty
  const storeApi = useScenarioStoreApi();
  useEffect(() => {
    const unsub = storeApi.subscribe(() => {
      useEditorStore.getState().setDirty(true);
    });
    return unsub;
  }, [storeApi]);

  return (
    <ServerConnectionProvider>
      <CursorLight />
      <EditorLayout />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            'bg-[var(--color-glass-2)] backdrop-blur-[28px] saturate-[1.3] border border-[var(--color-glass-edge-mid)] text-[var(--color-text-primary)] text-xs',
        }}
      />
    </ServerConnectionProvider>
  );
}

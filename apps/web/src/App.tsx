import { useEffect } from 'react';
import { EditorLayout } from './components/layout/EditorLayout';
import { CursorLight } from './components/apex/CursorLight';
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';
import { useScenarioStoreApi } from './stores/use-scenario-store';
import { useEditorStore } from './stores/editor-store';

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
    <>
      <CursorLight />
      <EditorLayout />
    </>
  );
}

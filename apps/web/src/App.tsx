import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { EditorLayout } from './components/layout/EditorLayout';
import { HomeScreen } from './components/home/HomeScreen';
import { CursorLight } from '@osce/theme-apex';
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';
import { useElectronMenu } from './hooks/use-electron-menu';
import { useUnsavedChangesGuard } from './hooks/use-unsaved-changes-guard';
import { useFileDragDrop } from './hooks/use-file-drag-drop';
import { DropOverlay } from './components/editor/DropOverlay';
import { useScenarioStoreApi } from './stores/use-scenario-store';
import { useEditorStore } from './stores/editor-store';
import { useProjectStore } from './stores/project-store';

export default function App() {
  useKeyboardShortcuts();
  useElectronMenu();
  useUnsavedChangesGuard();
  const { isDragging } = useFileDragDrop();
  const currentView = useProjectStore((s) => s.currentView);

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
      {currentView === 'home' ? <HomeScreen /> : <EditorLayout />}
      <DropOverlay visible={isDragging} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            'bg-[var(--color-glass-2)] backdrop-blur-[28px] saturate-[1.3] border border-[var(--color-glass-edge-mid)] text-[var(--color-text-primary)] text-xs',
        }}
      />
    </>
  );
}

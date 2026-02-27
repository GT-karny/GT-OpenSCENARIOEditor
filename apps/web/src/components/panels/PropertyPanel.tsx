import { useTranslation } from '@osce/i18n';
import { ScrollArea } from '../ui/scroll-area';
import { PropertyEditor } from '../property/PropertyEditor';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';

export function PropertyPanel() {
  const { t } = useTranslation('common');
  const selectedIds = useEditorStore((s) => s.selection.selectedElementIds);
  const storeApi = useScenarioStoreApi();

  const selectedId = selectedIds[0] ?? null;
  const element = selectedId ? storeApi.getState().getElementById(selectedId) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b">
        <h3 className="text-xs font-semibold">{t('panels.properties')}</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {element ? (
            <PropertyEditor element={element} elementId={selectedId!} />
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">
              Select an element to view properties
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

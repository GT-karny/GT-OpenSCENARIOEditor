import { useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { EntityListItem } from '../entity/EntityListItem';
import { AddEntityDialog } from '../entity/AddEntityDialog';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';

export function EntityListPanel() {
  const { t } = useTranslation('common');
  const entities = useScenarioStore((s) => s.document.entities);
  const selectedIds = useEditorStore((s) => s.selection.selectedElementIds);
  const setSelection = useEditorStore((s) => s.setSelection);
  const storeApi = useScenarioStoreApi();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleDelete = (id: string) => {
    storeApi.getState().removeEntity(id);
    if (selectedIds.includes(id)) {
      setSelection({ selectedElementIds: selectedIds.filter((eid) => eid !== id) });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h3 className="text-xs font-semibold">{t('panels.entityList')}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Add new entity" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {entities.map((entity) => (
          <EntityListItem
            key={entity.id}
            entity={entity}
            selected={selectedIds.includes(entity.id)}
            onSelect={() => setSelection({ selectedElementIds: [entity.id] })}
            onDelete={() => handleDelete(entity.id)}
          />
        ))}
        {entities.length === 0 && (
          <p className="p-4 text-center text-xs text-muted-foreground">
            No entities. Click + to add.
          </p>
        )}
      </ScrollArea>

      <AddEntityDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}

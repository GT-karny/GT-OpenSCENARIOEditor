import { useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { VariableListItem } from '../variable/VariableListItem';
import { AddVariableDialog } from '../variable/AddVariableDialog';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';

export function VariableListPanel() {
  const { t } = useTranslation('common');
  const variables = useScenarioStore((s) => s.document.variableDeclarations);
  const storeApi = useScenarioStoreApi();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleDelete = (id: string) => {
    storeApi.getState().removeVariable(id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Add variable" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="divider-glow" />

      <ScrollArea className="flex-1">
        {variables.map((v) => (
          <VariableListItem
            key={v.id}
            variable={v}
            onDelete={() => handleDelete(v.id)}
          />
        ))}
        {variables.length === 0 && (
          <p className="p-4 text-center text-xs text-muted-foreground">
            {t('labels.noVariables')}
          </p>
        )}
      </ScrollArea>

      <AddVariableDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}

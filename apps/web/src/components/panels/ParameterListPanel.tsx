import { useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { ParameterListItem } from '../parameter/ParameterListItem';
import { AddParameterDialog } from '../parameter/AddParameterDialog';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';

export function ParameterListPanel() {
  const { t } = useTranslation('common');
  const parameters = useScenarioStore((s) => s.document.parameterDeclarations);
  const storeApi = useScenarioStoreApi();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleDelete = (id: string) => {
    storeApi.getState().removeParameter(id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h3 className="text-xs font-semibold">{t('panels.parameters')}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Add parameter" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {parameters.map((param) => (
          <ParameterListItem
            key={param.id}
            parameter={param}
            onDelete={() => handleDelete(param.id)}
          />
        ))}
        {parameters.length === 0 && (
          <p className="p-4 text-center text-xs text-muted-foreground">
            {t('labels.noParameters')}
          </p>
        )}
      </ScrollArea>

      <AddParameterDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { ParameterListItem } from '../parameter/ParameterListItem';
import { AddParameterDialog } from '../parameter/AddParameterDialog';
import { VariableListItem } from '../variable/VariableListItem';
import { AddVariableDialog } from '../variable/AddVariableDialog';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';

export function VariablesPanel() {
  const { t } = useTranslation('common');
  const parameters = useScenarioStore((s) => s.document.parameterDeclarations);
  const variables = useScenarioStore((s) => s.document.variableDeclarations);
  const storeApi = useScenarioStoreApi();
  const [addParamOpen, setAddParamOpen] = useState(false);
  const [addVarOpen, setAddVarOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={['parameters', 'variables']}>
          <AccordionItem value="parameters" className="border-b-0">
            <div className="flex items-center border-b border-[var(--color-glass-edge)]">
              <AccordionTrigger className="flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] hover:no-underline">
                {t('panels.parameters')}
                <span className="ml-1.5 text-[var(--color-text-tertiary)] font-normal normal-case tracking-normal">
                  ({parameters.length})
                </span>
              </AccordionTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 mr-2 shrink-0"
                aria-label="Add parameter"
                onClick={(e) => {
                  e.stopPropagation();
                  setAddParamOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <AccordionContent className="pb-0 pt-0">
              {parameters.map((param) => (
                <ParameterListItem
                  key={param.id}
                  parameter={param}
                  onDelete={() => storeApi.getState().removeParameter(param.id)}
                />
              ))}
              {parameters.length === 0 && (
                <p className="p-4 text-center text-xs text-[var(--color-text-tertiary)]">
                  {t('labels.noParameters')}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="variables" className="border-b-0">
            <div className="flex items-center border-b border-[var(--color-glass-edge)]">
              <AccordionTrigger className="flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] hover:no-underline">
                {t('panels.variables')}
                <span className="ml-1.5 text-[var(--color-text-tertiary)] font-normal normal-case tracking-normal">
                  ({variables.length})
                </span>
              </AccordionTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 mr-2 shrink-0"
                aria-label="Add variable"
                onClick={(e) => {
                  e.stopPropagation();
                  setAddVarOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <AccordionContent className="pb-0 pt-0">
              {variables.map((v) => (
                <VariableListItem
                  key={v.id}
                  variable={v}
                  onDelete={() => storeApi.getState().removeVariable(v.id)}
                />
              ))}
              {variables.length === 0 && (
                <p className="p-4 text-center text-xs text-[var(--color-text-tertiary)]">
                  {t('labels.noVariables')}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>

      <AddParameterDialog open={addParamOpen} onOpenChange={setAddParamOpen} />
      <AddVariableDialog open={addVarOpen} onOpenChange={setAddVarOpen} />
    </div>
  );
}

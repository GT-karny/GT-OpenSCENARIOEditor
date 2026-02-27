import { useState } from 'react';
import { useTranslation } from '@osce/i18n';
import type { UseCaseComponent, UseCaseCategory } from '@osce/shared';
import { getUseCasesByCategory } from '@osce/templates';
import { ScrollArea } from '../ui/scroll-area';
import { Accordion } from '../ui/accordion';
import { TemplateCategoryGroup } from '../template/TemplateCategoryGroup';
import { ParameterDialog } from '../template/ParameterDialog';
import { useTemplateApply } from '../../hooks/use-template-apply';

const categories: UseCaseCategory[] = ['highway', 'intersection', 'pedestrian', 'parking', 'general'];

export function TemplatePalettePanel() {
  const { t } = useTranslation('common');
  const [selectedUseCase, setSelectedUseCase] = useState<UseCaseComponent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { applyTemplate } = useTemplateApply();

  const handleSelect = (uc: UseCaseComponent) => {
    setSelectedUseCase(uc);
    setDialogOpen(true);
  };

  const handleApply = (params: Record<string, unknown>) => {
    if (selectedUseCase) {
      applyTemplate(selectedUseCase, params);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b">
        <h3 className="text-xs font-semibold">{t('panels.templates')}</h3>
      </div>

      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={['highway']}>
          {categories.map((cat) => {
            const useCases = getUseCasesByCategory(cat);
            if (useCases.length === 0) return null;
            return (
              <TemplateCategoryGroup
                key={cat}
                category={cat}
                useCases={useCases}
                onSelect={handleSelect}
              />
            );
          })}
        </Accordion>
      </ScrollArea>

      <ParameterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        useCase={selectedUseCase}
        onApply={handleApply}
      />
    </div>
  );
}

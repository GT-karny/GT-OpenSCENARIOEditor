import { useTranslation } from '@osce/i18n';
import type { UseCaseComponent, UseCaseCategory } from '@osce/shared';
import { AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { TemplateCard } from './TemplateCard';

interface TemplateCategoryGroupProps {
  category: UseCaseCategory;
  useCases: UseCaseComponent[];
  onSelect: (useCase: UseCaseComponent) => void;
}

export function TemplateCategoryGroup({
  category,
  useCases,
  onSelect,
}: TemplateCategoryGroupProps) {
  const { t } = useTranslation('common');

  return (
    <AccordionItem value={category}>
      <AccordionTrigger className="px-3 py-2 text-xs">
        {t(`categories.${category}`, category)} ({useCases.length})
      </AccordionTrigger>
      <AccordionContent className="px-2 pb-2">
        <div className="space-y-1">
          {useCases.map((uc) => (
            <TemplateCard key={uc.id} useCase={uc} onClick={() => onSelect(uc)} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

import { useTranslation } from '@osce/i18n';
import type { UseCaseComponent } from '@osce/shared';

interface TemplateCardProps {
  useCase: UseCaseComponent;
  onClick: () => void;
}

export function TemplateCard({ useCase, onClick }: TemplateCardProps) {
  const { t } = useTranslation('useCases');

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{useCase.icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{t(useCase.nameKey, useCase.name)}</p>
          <p className="text-xs text-muted-foreground truncate">
            {t(useCase.descriptionKey, useCase.description)}
          </p>
        </div>
      </div>
    </button>
  );
}

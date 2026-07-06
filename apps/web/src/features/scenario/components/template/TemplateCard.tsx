import { useTranslation } from '@osce/i18n';
import type { UseCaseComponent } from '@osce/shared';

interface TemplateCardProps {
  useCase: UseCaseComponent;
  onClick: () => void;
}

export function TemplateCard({ useCase, onClick }: TemplateCardProps) {
  const { t } = useTranslation('useCases');

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/osce-use-case-id', useCase.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className="glass-item w-full text-left p-4 mb-2 overflow-hidden bg-[var(--color-glass-2)] backdrop-blur-[28px] saturate-[1.3] border-[var(--color-glass-edge)] hover:border-[var(--color-glass-edge-bright)] hover:bg-[var(--color-glass-hover)] hover:shadow-[0_0_8px_rgba(155,132,232,0.18),0_0_18px_rgba(123,136,232,0.07)] hover:-translate-y-px transition-all duration-250"
    >
      <p className="text-[12px] font-medium text-[var(--color-text-primary)] mb-1">
        {t(useCase.nameKey, useCase.name)}
      </p>
      <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">
        {t(useCase.descriptionKey, useCase.description)}
      </p>
      <span className="inline-block mt-2 px-2 py-px font-display text-[8px] font-semibold tracking-[0.08em] uppercase text-[var(--color-accent-2)] border border-[rgba(123,136,232,0.12)]">
        {useCase.category}
      </span>
    </button>
  );
}

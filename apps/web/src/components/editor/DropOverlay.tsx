import { useTranslation } from '@osce/i18n';
import { Upload } from 'lucide-react';

/**
 * Full-window drop indicator shown while a file is being dragged over the app.
 * APEX-styled glass overlay; purely visual (the drop is handled at window level).
 */
export function DropOverlay({ visible }: { visible: boolean }) {
  const { t } = useTranslation('common');
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-glass-1)] backdrop-blur-[28px] saturate-[1.3] pointer-events-none enter"
      aria-hidden
    >
      <div className="flex flex-col items-center gap-3 px-10 py-8 bg-[var(--color-glass-2)] border-2 border-dashed border-[var(--color-accent-1)] glow-md">
        <Upload size={40} className="text-[var(--color-accent-1)]" strokeWidth={1.5} />
        <span className="text-base font-display font-semibold tracking-wide text-[var(--color-text-primary)]">
          {t('dnd.dropToOpen')}
        </span>
        <span className="text-xs text-[var(--color-text-secondary)]">{t('dnd.dropHint')}</span>
      </div>
    </div>
  );
}

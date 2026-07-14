/**
 * GT_Sim UI primitive — ErrorPanel.
 *
 * Ported from the GT_Sim fork's `components/ui/ErrorPanel.tsx`. The fork
 * hardcoded the English strings `'Failed to load data: {message}'` and
 * `'Retry'`; both now go through `@osce/i18n` (`gtSim.ui.errorPanel.*`).
 */
import { useTranslation } from '@osce/i18n';
import { Button } from './Button';

export interface ErrorPanelProps {
  error: unknown;
  onRetry?: () => void;
}

export function ErrorPanel({ error, onRetry }: ErrorPanelProps) {
  const { t } = useTranslation('common');
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div className="border border-[var(--color-destructive)]/20 bg-[var(--color-destructive)]/10 p-4">
      <p className="mb-3 text-sm text-[var(--color-destructive)]">
        {t('gtSim.ui.errorPanel.failedToLoad', { message })}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t('gtSim.ui.errorPanel.retry')}
        </Button>
      )}
    </div>
  );
}

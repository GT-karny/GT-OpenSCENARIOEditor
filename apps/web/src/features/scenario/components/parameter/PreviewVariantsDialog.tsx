import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { generateParameterVariants, type GenerateVariantsResult } from '@osce/scenario-engine';
import type { ParameterValueDistributionDocument } from '@osce/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { ScrollArea } from '../../../../components/ui/scroll-area';

interface PreviewVariantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ParameterValueDistributionDocument | null;
}

/** Rows shown in the table are capped for readability. */
const MAX_ROWS = 100;

export function PreviewVariantsDialog({
  open,
  onOpenChange,
  document,
}: PreviewVariantsDialogProps) {
  const { t } = useTranslation('common');
  const [nonce, setNonce] = useState(0);

  // Regenerating is only meaningful for stochastic mode (deterministic is
  // reproducible), but the nonce keeps the memo re-running on demand.
  const result = useMemo<GenerateVariantsResult | null>(() => {
    if (!open || !document) return null;
    void nonce;
    return generateParameterVariants(document.distribution, { maxVariants: MAX_ROWS });
  }, [open, document, nonce]);

  const columns = useMemo(() => {
    if (!result) return [];
    const names = new Set<string>();
    for (const variant of result.variants) {
      for (const key of Object.keys(variant)) names.add(key);
    }
    return Array.from(names);
  }, [result]);

  const regenerate = useCallback(() => setNonce((n) => n + 1), []);

  const shown = result?.variants ?? [];
  const total = result?.totalCount ?? 0;
  const truncatedByCap = shown.length < total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('distributions.previewTitle')}</DialogTitle>
          <DialogDescription>
            {truncatedByCap
              ? t('distributions.previewShowingCapped', { shown: shown.length, total })
              : t('distributions.previewCount', { count: total })}
          </DialogDescription>
        </DialogHeader>

        {result && (result.truncated || truncatedByCap) && (
          <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-[var(--color-text-secondary)] bg-[var(--color-glass-1)]">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent-1)]" />
            {t('distributions.previewShowingCapped', { shown: shown.length, total })}
          </div>
        )}

        {result && result.warnings.length > 0 && (
          <div className="grid gap-1 px-2 py-1.5 text-[11px] text-[var(--color-text-secondary)] bg-[var(--color-glass-1)]">
            {result.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px text-[var(--color-accent-1)]" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        <ScrollArea className="max-h-[50vh] border border-[var(--color-glass-edge)]">
          {columns.length === 0 ? (
            <p className="p-4 text-center text-xs text-[var(--color-text-tertiary)]">
              {t('distributions.previewEmpty')}
            </p>
          ) : (
            <table className="w-full text-[11px] border-collapse">
              <thead className="sticky top-0 bg-[var(--color-glass-1)] backdrop-blur-[40px]">
                <tr>
                  <th className="px-2 py-1 text-left font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-glass-edge)]">
                    #
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-2 py-1 text-left font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-glass-edge)]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((variant, i) => (
                  <tr key={i} className="hover:bg-[var(--color-glass-hover)]">
                    <td className="px-2 py-1 text-[var(--color-text-tertiary)] tabular-nums">
                      {i + 1}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-2 py-1 font-mono text-[var(--color-text-primary)]"
                      >
                        {variant[col] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={regenerate}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {t('distributions.regenerate')}
          </Button>
          <Button onClick={() => onOpenChange(false)}>{t('buttons.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

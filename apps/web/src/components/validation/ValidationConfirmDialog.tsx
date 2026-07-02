import type { ValidationIssue } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface ValidationConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Errors that triggered the confirmation (only errors block saving). */
  errors: ValidationIssue[];
  /** Proceed with the save despite the errors. */
  onConfirm: () => void;
}

/** How many issues to preview before collapsing the remainder into a count. */
const PREVIEW_LIMIT = 5;

/**
 * Save-time guard shown when auto-validation finds blocking errors. Modeled on
 * {@link DeleteConfirmationDialog}: the user can either cancel (fix the errors)
 * or save anyway.
 */
export function ValidationConfirmDialog({
  open,
  onOpenChange,
  errors,
  onConfirm,
}: ValidationConfirmDialogProps) {
  const { t } = useTranslation('common');
  const { t: te } = useTranslation('errors');

  const preview = errors.slice(0, PREVIEW_LIMIT);
  const remaining = errors.length - preview.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--color-popover)] backdrop-blur-[28px] border-[var(--color-glass-edge)] sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[var(--color-text-primary)]">
            {t('validationDialog.title', { count: errors.length })}
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-secondary)]">
            {t('validationDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-48 overflow-y-auto space-y-1 border border-[var(--color-glass-edge)] p-2">
          {preview.map((issue, i) => (
            <li key={`${issue.code}-${i}`} className="flex items-start gap-2 text-xs">
              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <span className="text-[var(--color-text-secondary)]">
                {te(issue.messageKey, { ...issue.params, defaultValue: issue.message })}
              </span>
            </li>
          ))}
          {remaining > 0 && (
            <li className="text-[10px] text-[var(--color-text-tertiary)] pl-5">
              {t('validationDialog.more', { count: remaining })}
            </li>
          )}
        </ul>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('validationDialog.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t('validationDialog.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * GT_Sim UI primitive — ConfirmDialog.
 *
 * Ported from the GT_Sim fork's `components/ui/ConfirmDialog.tsx` (which used
 * the native `<dialog>` element). Rewritten on `@radix-ui/react-dialog`
 * (`Content` given `role="alertdialog"`) because `@radix-ui/react-alert-dialog`
 * is not a dependency of `apps/web` and this lane may not add one
 * (`apps/web/package.json` is frozen for the migration). Props are unchanged
 * except `confirmLabel` is now optional with an i18n-backed default (the fork
 * hardcoded the English literal `'Confirm'`).
 *
 * Non-compat note for other lanes: focus is now trapped inside the dialog and
 * returned to the trigger on close (Radix `FocusScope`), which the fork's
 * native-`<dialog>` version did not do explicitly.
 */
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslation } from '@osce/i18n';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--color-bg-void)]/60" />
        <DialogPrimitive.Content
          role="alertdialog"
          className="glass fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 border border-[var(--color-glass-edge-mid)] p-6 text-[var(--color-foreground)]"
        >
          <DialogPrimitive.Title className="mb-2 font-display text-lg font-bold">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="mb-6 text-sm text-[var(--color-text-secondary)]">
            {message}
          </DialogPrimitive.Description>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              {t('gtSim.ui.confirmDialog.cancel')}
            </Button>
            <Button variant={variant} size="sm" onClick={onConfirm}>
              {confirmLabel ?? t('gtSim.ui.confirmDialog.confirmDefault')}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

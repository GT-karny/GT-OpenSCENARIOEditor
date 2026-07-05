import { useSyncExternalStore } from 'react';
import { useTranslation } from '@osce/i18n';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import {
  subscribeDiscardGuard,
  getDiscardGuardOpen,
  resolveDiscardGuard,
} from '../../hooks/use-discard-guard';

/**
 * Confirmation dialog for the unsaved-changes guard.
 *
 * Presents a three-way choice when an in-app file-open action would replace a
 * dirty document: Save-and-continue / Discard-and-continue / Cancel. The dialog
 * is driven imperatively by the module-level guard controller
 * (`confirmDiscardIfDirty`) rather than local component state, so any file-open
 * entry point can trigger it via a promise.
 *
 * It is self-mounting (see `ensureDiscardGuardMounted`), so it does not require
 * a host component to place it — this keeps the guard usable from plain hooks
 * while remaining discoverable by role/name in E2E tests.
 */
export function DiscardChangesDialog() {
  const { t } = useTranslation('common');
  const open = useSyncExternalStore(subscribeDiscardGuard, getDiscardGuardOpen, getDiscardGuardOpen);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing via overlay/escape is treated as Cancel.
        if (!next) resolveDiscardGuard('cancel');
      }}
    >
      <DialogContent className="bg-[var(--color-bg-primary)] border-[var(--color-glass-edge-mid)] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[var(--color-text-primary)]">
            {t('unsavedGuard.title')}
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-secondary)]">
            {t('unsavedGuard.description')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => resolveDiscardGuard('cancel')}>
            {t('unsavedGuard.cancel')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resolveDiscardGuard('discard')}
            className="text-[var(--color-text-secondary)]"
          >
            {t('unsavedGuard.discard')}
          </Button>
          <Button
            size="sm"
            onClick={() => resolveDiscardGuard('save')}
            className="bg-[var(--color-accent-1)] text-white hover:bg-[var(--color-accent-1)]/90"
          >
            {t('unsavedGuard.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

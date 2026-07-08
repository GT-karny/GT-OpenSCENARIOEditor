import { useMemo } from 'react';
import { useTranslation } from '@osce/i18n';
import { History, FileWarning } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import type { AutosaveSnapshot } from '../../lib/autosave';

interface AutosaveRecoveryDialogProps {
  /** Snapshot to offer for recovery; the dialog is open when non-null. */
  snapshot: AutosaveSnapshot | null;
  onRestore: () => void;
  onDiscard: () => void;
}

function formatTimestamp(epochMs: number, language: string): string {
  try {
    return new Intl.DateTimeFormat(language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(epochMs));
  } catch {
    return new Date(epochMs).toLocaleString();
  }
}

/**
 * Recovery prompt shown at startup when an unclean autosave snapshot exists.
 * Restore loads the snapshot into the editor; Discard deletes it.
 */
export function AutosaveRecoveryDialog({
  snapshot,
  onRestore,
  onDiscard,
}: AutosaveRecoveryDialogProps) {
  const { t, i18n } = useTranslation('common');

  const timestamp = useMemo(
    () => (snapshot ? formatTimestamp(snapshot.savedAt, i18n.language) : ''),
    [snapshot, i18n.language],
  );

  const fileName = snapshot?.fileName ?? t('autosave.untitled');

  return (
    <Dialog open={snapshot !== null} onOpenChange={(open) => { if (!open) onDiscard(); }}>
      <DialogContent className="bg-[var(--color-bg-primary)] border-[var(--color-glass-edge-mid)] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-[var(--color-text-primary)]">
            <FileWarning size={18} className="text-[var(--color-accent-1)]" />
            {t('autosave.recoveryTitle')}
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-secondary)]">
            {t('autosave.recoveryMessage')}
          </DialogDescription>
        </DialogHeader>

        <div className="border border-[var(--color-glass-edge-mid)] bg-[var(--color-bg-deep)] p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <History size={13} className="shrink-0 text-[var(--color-text-muted)]" />
            <span className="text-[var(--color-text-muted)]">{t('autosave.savedAt')}</span>
            <span className="text-[var(--color-text-primary)]">{timestamp}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] truncate">
            <span className="text-[var(--color-text-muted)] shrink-0">{t('autosave.fileLabel')}</span>
            <span className="text-[var(--color-text-primary)] truncate">{fileName}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onDiscard}>
            {t('autosave.discard')}
          </Button>
          <Button
            size="sm"
            onClick={onRestore}
            className="bg-[var(--color-accent-1)] text-white hover:bg-[var(--color-accent-1)]/90"
          >
            {t('autosave.restore')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

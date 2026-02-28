import { useTranslation } from '@osce/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elementName: string;
  elementType: string;
  childCount: number;
  onConfirm: () => void;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  elementName,
  elementType,
  childCount,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  const { t } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--color-popover)] backdrop-blur-[28px] border-[var(--color-glass-edge)] sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-[var(--color-text-primary)]">
            {t('deleteDialog.title', { type: elementType, defaultValue: 'Delete {{type}}?' })}
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-secondary)]">
            {t('deleteDialog.description', {
              name: elementName,
              type: elementType,
              count: childCount,
              defaultValue: '"{{name}}" has {{count}} child element(s) that will also be deleted.',
            })}
            <br />
            <span className="text-xs opacity-70">
              {t('deleteDialog.undoHint', 'This action can be undone with Ctrl+Z.')}
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('deleteDialog.cancel', 'Cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t('deleteDialog.confirm', 'Delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

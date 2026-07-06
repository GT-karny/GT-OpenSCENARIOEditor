import { useTranslation } from '@osce/i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';

interface RandomizeColorsDialogProps {
  open: boolean;
  coloredCount: number;
  onOpenChange: (open: boolean) => void;
  onOverwriteAll: () => void;
  onUnsetOnly: () => void;
}

export function RandomizeColorsDialog({
  open,
  coloredCount,
  onOpenChange,
  onOverwriteAll,
  onUnsetOnly,
}: RandomizeColorsDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('entityColor.overwriteTitle')}</DialogTitle>
          <DialogDescription>
            {t('entityColor.overwriteMessage', { count: coloredCount })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('entityColor.overwriteCancel')}
          </Button>
          <Button variant="outline" onClick={onUnsetOnly}>
            {t('entityColor.overwriteUnsetOnly')}
          </Button>
          <Button onClick={onOverwriteAll}>{t('entityColor.overwriteAll')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

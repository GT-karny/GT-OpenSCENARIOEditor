import { useTranslation } from '@osce/i18n';
import { Timer } from 'lucide-react';

export function TimelinePlaceholder() {
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-muted-foreground">
        <Timer className="mx-auto mb-2 h-8 w-8" />
        <p className="text-sm font-medium">{t('panels.timeline')}</p>
        <p className="text-xs mt-1">@osce/node-editor (Phase 2 - Track E)</p>
      </div>
    </div>
  );
}

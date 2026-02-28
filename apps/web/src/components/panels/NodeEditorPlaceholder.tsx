import { useTranslation } from '@osce/i18n';
import { LayoutGrid } from 'lucide-react';

export function NodeEditorPlaceholder() {
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center justify-center h-full bg-background node-editor-grid">
      <div className="relative z-[1] text-center text-muted-foreground">
        <LayoutGrid className="mx-auto mb-2 h-8 w-8" />
        <p className="text-sm font-medium">{t('panels.nodeEditor')}</p>
        <p className="text-xs mt-1">@osce/node-editor (Phase 2 - Track E)</p>
      </div>
    </div>
  );
}

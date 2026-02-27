import { useTranslation } from '@osce/i18n';
import { Box } from 'lucide-react';

export function ViewerPlaceholder() {
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-muted-foreground">
        <Box className="mx-auto mb-2 h-8 w-8" />
        <p className="text-sm font-medium">{t('panels.3dViewer')}</p>
        <p className="text-xs mt-1">@osce/3d-viewer (Phase 2 - Track F)</p>
      </div>
    </div>
  );
}

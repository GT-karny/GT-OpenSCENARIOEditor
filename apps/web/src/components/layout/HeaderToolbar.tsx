import { useTranslation } from '@osce/i18n';
import { Separator } from '../ui/separator';
import { FileMenu } from '../toolbar/FileMenu';
import { UndoRedoButtons } from '../toolbar/UndoRedoButtons';
import { ValidateButton } from '../toolbar/ValidateButton';
import { LanguageToggle } from '../toolbar/LanguageToggle';
import { RoadNetworkButton } from '../toolbar/RoadNetworkButton';

export function HeaderToolbar() {
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b bg-background">
      <span className="text-sm font-semibold mr-2">{t('app.title')}</span>
      <Separator orientation="vertical" className="h-6" />
      <FileMenu />
      <Separator orientation="vertical" className="h-6" />
      <UndoRedoButtons />
      <Separator orientation="vertical" className="h-6" />
      <RoadNetworkButton />
      <ValidateButton />
      <div className="flex-1" />
      <LanguageToggle />
    </div>
  );
}

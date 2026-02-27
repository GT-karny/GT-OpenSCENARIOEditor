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
    <div className="relative flex items-center gap-1 px-2 py-1 border-b border-border bg-card backdrop-blur-xl">
      <span className="text-sm font-display font-semibold tracking-wider mr-2">{t('app.title')}</span>
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

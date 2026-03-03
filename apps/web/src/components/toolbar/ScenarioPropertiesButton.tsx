import { useTranslation } from '@osce/i18n';
import { FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useEditorStore } from '../../stores/editor-store';

export function ScenarioPropertiesButton() {
  const { t } = useTranslation('common');
  const hasSelection = useEditorStore(
    (s) => s.selection.selectedElementIds.length > 0,
  );

  const handleClick = () => {
    useEditorStore.getState().clearSelection();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={hasSelection ? 'ghost' : 'secondary'}
          size="sm"
          className="text-xs gap-1"
          onClick={handleClick}
        >
          <FileText className="h-4 w-4" />
          {t('scenario.title')}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('scenario.title')}</TooltipContent>
    </Tooltip>
  );
}

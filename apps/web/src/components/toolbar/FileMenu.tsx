import { useTranslation } from '@osce/i18n';
import { FilePlus, FolderOpen, Save, SaveAll } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useFileOperations } from '../../hooks/use-file-operations';
import { useEditorStore } from '../../stores/editor-store';

export function FileMenu() {
  const { t } = useTranslation('common');
  const editorMode = useEditorStore((s) => s.editorMode);
  const {
    newScenario,
    openXosc,
    saveXosc,
    saveAsXosc,
    newOpenDrive,
    loadXodr,
    saveXodr,
    saveAsXodr,
  } = useFileOperations();

  const isRoadNetwork = editorMode === 'roadNetwork';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs">
          File
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={isRoadNetwork ? newOpenDrive : newScenario}>
          <FilePlus />
          New
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={isRoadNetwork ? loadXodr : openXosc}>
          <FolderOpen />
          Open {isRoadNetwork ? '.xodr' : '.xosc'}
          <DropdownMenuShortcut>Ctrl+O</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={isRoadNetwork ? saveXodr : saveXosc}>
          <Save />
          {t('buttons.save')} {isRoadNetwork ? '.xodr' : '.xosc'}
          <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={isRoadNetwork ? saveAsXodr : saveAsXosc}>
          <SaveAll />
          {t('buttons.saveAs')} {isRoadNetwork ? '.xodr' : '.xosc'}
          <DropdownMenuShortcut>Ctrl+Shift+S</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

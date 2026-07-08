import { useCallback, useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { FilePlus, FolderOpen, Save, SaveAll, Clock, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useFileOperations } from '../../hooks/use-file-operations';
import { useRecentFiles } from '../../hooks/use-recent-files';
import { useDocumentRegistry } from '../../stores/document-registry';

export function FileMenu() {
  const { t } = useTranslation('common');
  const isRoadNetwork = useDocumentRegistry((s) => s.focusedBase === 'roadNetwork');
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
  const { items: recentFiles, refresh, openRecent, clearRecent } = useRecentFiles();

  const [open, setOpen] = useState(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) void refresh();
    },
    [refresh],
  );

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Clock />
            {t('recentFiles.title')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {recentFiles.length === 0 ? (
              <DropdownMenuItem disabled>{t('recentFiles.empty')}</DropdownMenuItem>
            ) : (
              <>
                {recentFiles.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => void openRecent(item)}
                    title={item.path ?? item.name}
                  >
                    <span className="truncate max-w-[220px]">{item.name}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void clearRecent()}>
                  <Trash2 />
                  {t('recentFiles.clear')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
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

import { useCallback, useState } from 'react';
import { Cpu, Plus, Trash2, Pencil } from 'lucide-react';
import type { OdrController } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../../../components/ui/context-menu';
import {
  useOdrControllers,
  useOdrSidebarStore,
  useOpenDriveStoreApi,
} from '../../../../hooks/use-opendrive-store';
import { cn } from '@/lib/utils';

interface ControllerListPanelProps {
  searchQuery: string;
}

/**
 * Lists document-level `<controller>` entries with add/rename/delete. Controllers
 * are top-level OpenDRIVE elements (they group signals under a control algorithm),
 * so — unlike roads — they are created here rather than via a canvas tool.
 * Modeled on RoadListPanel.
 */
export function ControllerListPanel({ searchQuery }: ControllerListPanelProps) {
  const { t } = useTranslation('common');
  const controllers = useOdrControllers();
  const odrStoreApi = useOpenDriveStoreApi();
  const selection = useOdrSidebarStore((s) => s.selection);
  const setSelection = useOdrSidebarStore((s) => s.setSelection);

  const query = searchQuery.trim().toLowerCase();
  const filtered = controllers.filter((c) => {
    if (!query) return true;
    const name = (c.name || `Controller ${c.id}`).toLowerCase();
    return name.includes(query) || c.id.includes(query);
  });

  const handleSelect = useCallback(
    (controller: OdrController) => {
      setSelection({ type: 'controller', id: controller.id });
    },
    [setSelection],
  );

  const handleAdd = useCallback(() => {
    const created = odrStoreApi
      .getState()
      .addController({ name: `Controller ${controllers.length + 1}` });
    setSelection({ type: 'controller', id: created.id });
  }, [odrStoreApi, controllers.length, setSelection]);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleRename = useCallback((controller: OdrController) => {
    setRenamingId(controller.id);
    setRenameValue(controller.name || `Controller ${controller.id}`);
  }, []);

  const handleRenameSubmit = useCallback(
    (controllerId: string) => {
      if (renameValue.trim()) {
        odrStoreApi.getState().updateController(controllerId, { name: renameValue.trim() });
      }
      setRenamingId(null);
    },
    [odrStoreApi, renameValue],
  );

  const handleDelete = useCallback(
    (controller: OdrController) => {
      odrStoreApi.getState().removeController(controller.id);
      if (selection.type === 'controller' && selection.id === controller.id) {
        useOdrSidebarStore.getState().clearSelection();
      }
    },
    [odrStoreApi, selection],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-glass-edge)]">
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
          {filtered.length} controller{filtered.length !== 1 ? 's' : ''}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('odrSidebar.controllerList.add')}
          title={t('odrSidebar.controllerList.add')}
          className="h-6 w-6"
          onClick={handleAdd}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Controller list */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {filtered.map((controller) => (
            <ControllerListItem
              key={controller.id}
              controller={controller}
              selected={selection.type === 'controller' && selection.id === controller.id}
              renaming={renamingId === controller.id}
              renameValue={renamingId === controller.id ? renameValue : ''}
              controlsLabel={t('odrSidebar.controllerList.controls', {
                count: controller.controls.length,
              })}
              deleteLabel={t('odrSidebar.controllerList.deleteAria')}
              renameLabel={t('odrSidebar.controllerList.rename')}
              onRenameChange={setRenameValue}
              onRenameSubmit={() => handleRenameSubmit(controller.id)}
              onRenameCancel={() => setRenamingId(null)}
              onSelect={() => handleSelect(controller)}
              onRename={() => handleRename(controller)}
              onDelete={() => handleDelete(controller)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="p-4 text-center text-xs text-[var(--color-text-muted)]">
              {searchQuery
                ? t('odrSidebar.controllerList.emptyFilter')
                : t('odrSidebar.controllerList.empty')}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ---- Controller list item ----

interface ControllerListItemProps {
  controller: OdrController;
  selected: boolean;
  renaming: boolean;
  renameValue: string;
  controlsLabel: string;
  deleteLabel: string;
  renameLabel: string;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function ControllerListItem({
  controller,
  selected,
  renaming,
  renameValue,
  controlsLabel,
  deleteLabel,
  renameLabel,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onSelect,
  onRename,
  onDelete,
}: ControllerListItemProps) {
  const displayName = controller.name || `Controller ${controller.id}`;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            'glass-item flex items-center gap-3 mx-3 my-1 px-3 py-2.5 cursor-pointer group relative',
            selected && 'selected',
          )}
          onClick={onSelect}
        >
          {/* Selected indicator */}
          {selected && (
            <div
              className="absolute left-0 top-[15%] bottom-[15%] w-[2px]"
              style={{
                background:
                  'linear-gradient(180deg, var(--color-accent-vivid), var(--color-accent-2))',
                boxShadow:
                  '0 0 5px rgba(155, 132, 232, 0.12), 0 0 10px rgba(123, 136, 232, 0.05)',
              }}
            />
          )}

          <Cpu className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />

          <div className="flex-1 min-w-0">
            {renaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => onRenameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onRenameSubmit();
                  if (e.key === 'Escape') onRenameCancel();
                }}
                onBlur={onRenameSubmit}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-[12px] font-medium bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] px-1 py-0.5 outline-none"
              />
            ) : (
              <p className="text-[12px] font-medium truncate">{displayName}</p>
            )}
            <div className="text-[10px] text-[var(--color-text-tertiary)] mt-px flex items-center gap-1.5">
              <span>#{controller.id}</span>
              <Badge variant="outline" className="text-[9px] py-0 px-1 leading-tight">
                {controlsLabel}
              </Badge>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label={deleteLabel}
            className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={onRename}>
          <Pencil className="h-3.5 w-3.5 mr-2" />
          {renameLabel}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-red-400">
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          {deleteLabel}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

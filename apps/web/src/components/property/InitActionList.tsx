import { Plus, Trash2, Settings } from 'lucide-react';
import type { EntityInitActions } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { cn } from '../../lib/utils';
import { actionIcons } from '../scene-composer/ActionItem';

interface InitActionListProps {
  entityInit: EntityInitActions;
  selectedActionId: string | null;
  onSelectAction: (id: string) => void;
  onRemoveAction: (id: string) => void;
  onAddAction: () => void;
}

/** Upper section: list of Init actions for an entity with selection + delete. */
export function InitActionList({
  entityInit,
  selectedActionId,
  onSelectAction,
  onRemoveAction,
  onAddAction,
}: InitActionListProps) {
  const { t } = useTranslation('openscenario');
  const { privateActions } = entityInit;

  return (
    <div className="flex flex-col">
      {privateActions.map((pa) => {
        const Icon = actionIcons[pa.action.type] ?? Settings;
        const isSelected = pa.id === selectedActionId;
        return (
          <div
            key={pa.id}
            className={cn(
              'group/init-action flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors',
              isSelected
                ? 'glass-item selected'
                : 'hover:bg-[var(--color-glass-hover)]',
            )}
            onClick={() => onSelectAction(pa.id)}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                isSelected ? 'text-[var(--color-accent-1)]' : 'text-[var(--color-text-muted)]',
              )}
            />
            <span className="text-[11px] text-[var(--color-text-primary)] truncate flex-1">
              {t(`actionTypes.${pa.action.type}` as never)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveAction(pa.id);
              }}
              className="opacity-0 group-hover/init-action:opacity-100 p-0.5 text-[var(--color-text-muted)] hover:text-red-400 transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      <button
        onClick={onAddAction}
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-1)] hover:bg-[var(--color-glass-hover)] transition-colors"
      >
        <Plus className="h-3 w-3" />
        Add Action
      </button>
    </div>
  );
}

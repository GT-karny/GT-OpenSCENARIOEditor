import type { ScenarioEntity } from '@osce/shared';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { EntityIcon } from './EntityIcon';
import { cn } from '@/lib/utils';

interface EntityListItemProps {
  entity: ScenarioEntity;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function EntityListItem({ entity, selected, onSelect, onDelete }: EntityListItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-accent group',
        selected && 'bg-accent',
      )}
      onClick={onSelect}
    >
      <EntityIcon type={entity.type} className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{entity.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{entity.type}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

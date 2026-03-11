import { useState, useCallback } from 'react';
import type { ScenarioEntity } from '@osce/shared';
import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { EntityIcon } from './EntityIcon';
import { cn } from '@/lib/utils';

export const ENTITY_DND_TYPE = 'application/osce-entity-ref';

interface EntityListItemProps {
  entity: ScenarioEntity;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick?: () => void;
  onDelete: () => void;
}

function getEntityCategory(entity: ScenarioEntity): string | undefined {
  const def = entity.definition;
  if (!def || def.kind === 'catalogReference') return undefined;
  switch (def.kind) {
    case 'vehicle':
      return def.vehicleCategory;
    case 'pedestrian':
      return def.pedestrianCategory;
    case 'miscObject':
      return def.miscObjectCategory;
    default:
      return undefined;
  }
}

export function EntityListItem({ entity, selected, onSelect, onDoubleClick, onDelete }: EntityListItemProps) {
  const category = getEntityCategory(entity);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData(ENTITY_DND_TYPE, entity.name);
      e.dataTransfer.effectAllowed = 'copy';
      setIsDragging(true);
    },
    [entity.name],
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      className={cn(
        'glass-item flex items-center gap-3 mx-3 my-1 px-3 py-3 cursor-pointer group',
        selected && 'selected',
        isDragging && 'opacity-50',
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      {/* Selected indicator — left accent bar */}
      {selected && (
        <div
          className="absolute left-0 top-[15%] bottom-[15%] w-[2px]"
          style={{
            background: 'linear-gradient(180deg, var(--color-accent-vivid), var(--color-accent-2))',
            boxShadow: '0 0 5px rgba(155, 132, 232, 0.12), 0 0 10px rgba(123, 136, 232, 0.05)',
          }}
        />
      )}
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-50 cursor-grab" />
      <EntityIcon type={entity.type} className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium truncate">{entity.name}</p>
        <p className="text-[10px] text-[var(--color-text-tertiary)] mt-px capitalize">
          {entity.type}
          {category && <span> &middot; {category}</span>}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete"
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

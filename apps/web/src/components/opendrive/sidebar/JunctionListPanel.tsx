import { useCallback } from 'react';
import { Plus, GitFork, Trash2 } from 'lucide-react';
import type { OdrJunction } from '@osce/shared';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../../ui/context-menu';
import { useOdrJunctions, useOdrSidebarStore } from '../../../hooks/use-opendrive-store';
import { cn } from '@/lib/utils';

interface JunctionListPanelProps {
  searchQuery: string;
}

export function JunctionListPanel({ searchQuery }: JunctionListPanelProps) {
  const junctions = useOdrJunctions();
  const selection = useOdrSidebarStore((s) => s.selection);
  const setSelection = useOdrSidebarStore((s) => s.setSelection);

  const filteredJunctions = junctions.filter((junction) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = (junction.name || `Junction ${junction.id}`).toLowerCase();
    return name.includes(query) || junction.id.includes(query);
  });

  const handleSelect = useCallback(
    (junction: OdrJunction) => {
      setSelection({ type: 'junction', id: junction.id });
    },
    [setSelection],
  );

  const handleDelete = useCallback((_junction: OdrJunction) => {
    // TODO: Implement junction deletion via store action
  }, []);

  const handleAddJunction = useCallback(() => {
    // TODO: Implement junction creation via store action
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header with Add Junction button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-glass-edge)]">
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
          {filteredJunctions.length} junction{filteredJunctions.length !== 1 ? 's' : ''}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          aria-label="Add new junction"
          onClick={handleAddJunction}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Junction list */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {filteredJunctions.map((junction) => (
            <JunctionListItem
              key={junction.id}
              junction={junction}
              selected={selection.type === 'junction' && selection.id === junction.id}
              onSelect={() => handleSelect(junction)}
              onDelete={() => handleDelete(junction)}
            />
          ))}
          {filteredJunctions.length === 0 && (
            <p className="p-4 text-center text-xs text-[var(--color-text-muted)]">
              {searchQuery ? 'No junctions match filter.' : 'No junctions. Click + to add.'}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ---- Junction list item ----

interface JunctionListItemProps {
  junction: OdrJunction;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function JunctionListItem({ junction, selected, onSelect, onDelete }: JunctionListItemProps) {
  const displayName = junction.name || `Junction ${junction.id}`;
  const connectionCount = junction.connections.length;

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

          <GitFork className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />

          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium truncate">{displayName}</p>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-px">
              {junction.type && <span>{junction.type} &middot; </span>}
              {connectionCount} connection{connectionCount !== 1 ? 's' : ''}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete junction"
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
        <ContextMenuItem onClick={onDelete} className="text-red-400">
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

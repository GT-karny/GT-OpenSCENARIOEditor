import { useCallback, useState } from 'react';
import { Route, Trash2, Copy, Pencil } from 'lucide-react';
import type { OdrRoad } from '@osce/shared';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../ui/context-menu';
import {
  useOdrRoads,
  useOdrSidebarStore,
  useOpenDriveStoreApi,
  countRoadLanes,
} from '../../../hooks/use-opendrive-store';
import { cn } from '@/lib/utils';

interface RoadListPanelProps {
  searchQuery: string;
}

export function RoadListPanel({ searchQuery }: RoadListPanelProps) {
  const roads = useOdrRoads();
  const odrStoreApi = useOpenDriveStoreApi();
  const selection = useOdrSidebarStore((s) => s.selection);
  const setSelection = useOdrSidebarStore((s) => s.setSelection);

  const filteredRoads = roads.filter((road) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = (road.name || `Road ${road.id}`).toLowerCase();
    return name.includes(query) || road.id.includes(query);
  });

  const handleSelect = useCallback(
    (road: OdrRoad) => {
      setSelection({ type: 'road', id: road.id });
    },
    [setSelection],
  );

  const [renamingRoadId, setRenamingRoadId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleRename = useCallback((road: OdrRoad) => {
    setRenamingRoadId(road.id);
    setRenameValue(road.name || `Road ${road.id}`);
  }, []);

  const handleRenameSubmit = useCallback(
    (roadId: string) => {
      if (renameValue.trim()) {
        odrStoreApi.getState().updateRoad(roadId, { name: renameValue.trim() });
      }
      setRenamingRoadId(null);
    },
    [odrStoreApi, renameValue],
  );

  const handleDelete = useCallback(
    (road: OdrRoad) => {
      odrStoreApi.getState().removeRoad(road.id);
      if (selection.type === 'road' && selection.id === road.id) {
        useOdrSidebarStore.getState().clearSelection();
      }
    },
    [odrStoreApi, selection],
  );

  const handleDuplicate = useCallback(
    (road: OdrRoad) => {
      const newRoad = odrStoreApi.getState().addRoad({
        name: `${road.name || 'Road'} (copy)`,
        length: road.length,
        planView: road.planView.map((g) => ({ ...g, x: g.x + 10, y: g.y + 10 })),
        lanes: road.lanes,
        elevationProfile: road.elevationProfile,
        lateralProfile: road.lateralProfile,
        signals: [],
      });
      setSelection({ type: 'road', id: newRoad.id });
    },
    [odrStoreApi, setSelection],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-glass-edge)]">
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
          {filteredRoads.length} road{filteredRoads.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Road list */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {filteredRoads.map((road) => (
            <RoadListItem
              key={road.id}
              road={road}
              selected={selection.type === 'road' && selection.id === road.id}
              renaming={renamingRoadId === road.id}
              renameValue={renamingRoadId === road.id ? renameValue : ''}
              onRenameChange={setRenameValue}
              onRenameSubmit={() => handleRenameSubmit(road.id)}
              onRenameCancel={() => setRenamingRoadId(null)}
              onSelect={() => handleSelect(road)}
              onRename={() => handleRename(road)}
              onDelete={() => handleDelete(road)}
              onDuplicate={() => handleDuplicate(road)}
            />
          ))}
          {filteredRoads.length === 0 && (
            <p className="p-4 text-center text-xs text-[var(--color-text-muted)]">
              {searchQuery ? 'No roads match filter.' : 'No roads. Use the Road tool in the toolbar.'}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ---- Road list item ----

interface RoadListItemProps {
  road: OdrRoad;
  selected: boolean;
  renaming: boolean;
  renameValue: string;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function RoadListItem({
  road,
  selected,
  renaming,
  renameValue,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onSelect,
  onRename,
  onDelete,
  onDuplicate,
}: RoadListItemProps) {
  const displayName = road.name || `Road ${road.id}`;
  const laneCount = countRoadLanes(road);

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

          <Route className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />

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
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-px">
              {road.length.toFixed(1)}m &middot; {laneCount} lane{laneCount !== 1 ? 's' : ''}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete road"
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
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="h-3.5 w-3.5 mr-2" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-red-400">
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

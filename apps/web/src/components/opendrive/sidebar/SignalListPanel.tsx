import { useCallback, useMemo } from 'react';
import { Plus, TrafficCone, Trash2 } from 'lucide-react';
import type { OdrSignal } from '@osce/shared';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../../ui/context-menu';
import { useOdrSignals, useOdrSidebarStore } from '../../../hooks/use-opendrive-store';
import { cn } from '@/lib/utils';

type SignalWithRoad = OdrSignal & { roadId: string; roadName: string };

interface SignalListPanelProps {
  searchQuery: string;
}

export function SignalListPanel({ searchQuery }: SignalListPanelProps) {
  const signals = useOdrSignals();
  const selection = useOdrSidebarStore((s) => s.selection);
  const setSelection = useOdrSidebarStore((s) => s.setSelection);

  const filteredSignals = useMemo(() => {
    if (!searchQuery) return signals;
    const query = searchQuery.toLowerCase();
    return signals.filter((signal) => {
      const name = (signal.name || `Signal ${signal.id}`).toLowerCase();
      return (
        name.includes(query) ||
        signal.id.includes(query) ||
        signal.roadName.toLowerCase().includes(query)
      );
    });
  }, [signals, searchQuery]);

  // Group signals by road
  const groupedSignals = useMemo(() => {
    const groups = new Map<string, { roadName: string; signals: SignalWithRoad[] }>();
    for (const signal of filteredSignals) {
      const existing = groups.get(signal.roadId);
      if (existing) {
        existing.signals.push(signal);
      } else {
        groups.set(signal.roadId, {
          roadName: signal.roadName,
          signals: [signal],
        });
      }
    }
    return groups;
  }, [filteredSignals]);

  const handleSelect = useCallback(
    (signal: SignalWithRoad) => {
      setSelection({ type: 'signal', id: signal.id, roadId: signal.roadId });
    },
    [setSelection],
  );

  const handleDelete = useCallback((_signal: SignalWithRoad) => {
    // TODO: Implement signal deletion via store action
  }, []);

  const handleAddSignal = useCallback(() => {
    // TODO: Implement signal creation (needs road selection first)
  }, []);

  const hasRoadSelected = selection.type === 'road' && selection.id !== null;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Add Signal button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-glass-edge)]">
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
          {filteredSignals.length} signal{filteredSignals.length !== 1 ? 's' : ''}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          aria-label="Add new signal"
          onClick={handleAddSignal}
          disabled={!hasRoadSelected}
          title={hasRoadSelected ? 'Add signal to selected road' : 'Select a road first'}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Signal list grouped by road */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {groupedSignals.size > 0 ? (
            Array.from(groupedSignals.entries()).map(([roadId, group]) => (
              <div key={roadId}>
                {/* Road group header */}
                <div className="px-4 pt-3 pb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {group.roadName}
                  </p>
                </div>

                {/* Signals under this road */}
                {group.signals.map((signal) => (
                  <SignalListItem
                    key={`${roadId}-${signal.id}`}
                    signal={signal}
                    selected={
                      selection.type === 'signal' &&
                      selection.id === signal.id &&
                      selection.roadId === roadId
                    }
                    onSelect={() => handleSelect(signal)}
                    onDelete={() => handleDelete(signal)}
                  />
                ))}
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-xs text-[var(--color-text-muted)]">
              {searchQuery ? 'No signals match filter.' : 'No signals defined.'}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ---- Signal list item ----

interface SignalListItemProps {
  signal: SignalWithRoad;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SignalListItem({ signal, selected, onSelect, onDelete }: SignalListItemProps) {
  const displayName = signal.name || `Signal ${signal.id}`;
  const typeLabel = signal.type
    ? `${signal.type}${signal.subtype ? `.${signal.subtype}` : ''}`
    : 'unknown';

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

          <TrafficCone className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />

          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium truncate">{displayName}</p>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-px">
              {typeLabel} &middot; s={signal.s.toFixed(1)}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete signal"
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

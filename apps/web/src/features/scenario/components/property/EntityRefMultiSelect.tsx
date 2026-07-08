import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Plus, X } from 'lucide-react';
import { useScenarioStore } from '../../../../stores/use-scenario-store';
import { EntityIcon } from '../entity/EntityIcon';
import { cn } from '@/lib/utils';
import { useRefDropdown } from './ref-select/use-ref-dropdown';
import { useEntityRefSources } from './ref-select/use-entity-ref-sources';
import { useEntityKeyboardNav } from './ref-select/use-entity-keyboard-nav';
import { useEntityDnd } from './ref-select/use-entity-dnd';
import { RefDropdownShell } from './ref-select/RefDropdownShell';
import { EntityRefRows } from './ref-select/EntityRefRows';

interface EntityRefMultiSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  className?: string;
}

/**
 * Multi-value entity reference picker rendered as removable chips plus a `+`
 * button that opens the shared dropdown. Selecting a row toggles its membership.
 */
export function EntityRefMultiSelect({ value, onValueChange, className }: EntityRefMultiSelectProps) {
  const entities = useScenarioStore(useShallow((s) => s.document.entities));

  const dropdown = useRefDropdown();
  const { open, setOpen, search, setSearch, selectedIndex, containerRef, searchInputRef } =
    dropdown;
  const { parameterMode, grouped, filteredParams, filteredVars, flatItems } =
    useEntityRefSources(search);

  const addIfAbsent = useCallback(
    (name: string) => {
      if (!value.includes(name)) onValueChange([...value, name]);
    },
    [value, onValueChange],
  );

  const handleAdd = useCallback(
    (name: string) => {
      addIfAbsent(name);
      setOpen(false);
    },
    [addIfAbsent, setOpen],
  );

  const handleRemove = useCallback(
    (name: string) => {
      onValueChange(value.filter((v) => v !== name));
    },
    [value, onValueChange],
  );

  const handleToggle = useCallback(
    (name: string) => {
      if (value.includes(name)) onValueChange(value.filter((v) => v !== name));
      else onValueChange([...value, name]);
    },
    [value, onValueChange],
  );

  const handleKeyDown = useEntityKeyboardNav({
    dropdown,
    flatItems,
    parameterMode,
    openOnTrigger: false,
    onCommit: (item) => {
      if (item.kind === 'entity') handleToggle(item.name);
      else if (item.kind === 'param' || item.kind === 'var') handleAdd(`$${item.name}`);
    },
  });

  const { isDragOver, dndHandlers } = useEntityDnd({
    onDropRef: addIfAbsent,
    onDropEntity: addIfAbsent,
  });

  return (
    <div ref={containerRef} className="relative">
      <div
        {...dndHandlers}
        className={cn(
          'flex flex-wrap items-center gap-1 min-h-[2rem] p-1 border border-input bg-transparent',
          isDragOver && 'ring-2 ring-[var(--color-accent-1)] border-[var(--color-accent-1)]',
          className,
        )}
      >
        {value.map((ref) => {
          const entity = entities.find((e) => e.name === ref);
          const isParam = ref.startsWith('$');
          return (
            <span
              key={ref}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)]"
            >
              {entity && <EntityIcon type={entity.type} className="h-3 w-3 text-muted-foreground" />}
              <span className={cn(isParam && 'text-[var(--color-accent-1)] font-medium')}>{ref}</span>
              <button
                type="button"
                onClick={() => handleRemove(ref)}
                className="hover:text-destructive ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-center h-5 w-5 text-muted-foreground hover:text-foreground hover:bg-[var(--color-glass-1)] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <RefDropdownShell
          ref={searchInputRef}
          search={search}
          onSearchChange={setSearch}
          onKeyDown={handleKeyDown}
          searchPlaceholder="Search or type $..."
        >
          <EntityRefRows
            parameterMode={parameterMode}
            grouped={grouped}
            filteredParams={filteredParams}
            filteredVars={filteredVars}
            selectedIndex={selectedIndex}
            isSelected={(ref) => value.includes(ref)}
            onSelectEntity={handleToggle}
            onSelectRef={handleAdd}
            emptyMessage={
              <p className="px-2 py-2 text-[11px] text-muted-foreground italic">
                {search ? 'No matching entities, parameters, or variables' : 'No entities defined'}
              </p>
            }
          />
        </RefDropdownShell>
      )}
    </div>
  );
}

import { useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { EntityIcon } from '../entity/EntityIcon';
import { cn } from '@/lib/utils';
import { useRefDropdown } from './ref-select/use-ref-dropdown';
import { useEntityRefSources } from './ref-select/use-entity-ref-sources';
import { useEntityKeyboardNav } from './ref-select/use-entity-keyboard-nav';
import { useEntityDnd } from './ref-select/use-entity-dnd';
import { RefDropdownShell } from './ref-select/RefDropdownShell';
import { EntityRefRows } from './ref-select/EntityRefRows';

interface EntityRefSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  allowEmpty?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Single-value entity reference picker. Auto-fetches entities/parameters/
 * variables from the scenario store, groups entities by type, and switches to
 * parameter/variable lookup when the search starts with `$`.
 */
export function EntityRefSelect({
  value,
  onValueChange,
  allowEmpty,
  placeholder = 'Select entity...',
  className,
}: EntityRefSelectProps) {
  const dropdown = useRefDropdown();
  const { open, setOpen, search, setSearch, selectedIndex, containerRef, searchInputRef } =
    dropdown;
  const { entities, parameterMode, grouped, filteredParams, filteredVars, flatItems } =
    useEntityRefSources(search, { allowEmpty });

  const isParamRef = value.startsWith('$');
  const matchingEntity = entities.find((e) => e.name === value);

  const handleSelect = useCallback(
    (name: string) => {
      onValueChange(name);
      setOpen(false);
    },
    [onValueChange, setOpen],
  );

  const handleKeyDown = useEntityKeyboardNav({
    dropdown,
    flatItems,
    parameterMode,
    openOnTrigger: true,
    onCommit: (item) => {
      if (item.kind === 'entity' || item.kind === 'empty') handleSelect(item.name);
      else handleSelect(`$${item.name}`);
    },
  });

  const { isDragOver, dndHandlers } = useEntityDnd({
    onDropRef: onValueChange,
    onDropEntity: onValueChange,
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        {...dndHandlers}
        className={cn(
          'flex h-8 w-full items-center gap-1.5 border border-input bg-transparent px-2 text-sm text-left',
          'hover:bg-[var(--color-glass-1)] transition-colors',
          isParamRef && 'text-[var(--color-accent-1)] font-medium',
          isDragOver && 'ring-2 ring-[var(--color-accent-1)] border-[var(--color-accent-1)]',
          className,
        )}
      >
        {value && !isParamRef && matchingEntity && (
          <EntityIcon
            type={matchingEntity.type}
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          />
        )}
        <span className="truncate flex-1">{value || placeholder}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
      </button>

      {open && (
        <RefDropdownShell
          ref={searchInputRef}
          search={search}
          onSearchChange={setSearch}
          onKeyDown={handleKeyDown}
          searchPlaceholder="Search or type $..."
        >
          {allowEmpty && !parameterMode && (
            <button
              type="button"
              className={cn(
                'w-full px-2 py-1 text-left text-xs flex items-center gap-2 hover:bg-[var(--color-glass-1)]',
                selectedIndex === 0 && 'bg-[var(--color-glass-1)]',
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect('');
              }}
            >
              <span className="text-muted-foreground italic">(none)</span>
              {value === '' && <Check className="h-3 w-3 ml-auto" />}
            </button>
          )}
          <EntityRefRows
            parameterMode={parameterMode}
            grouped={grouped}
            filteredParams={filteredParams}
            filteredVars={filteredVars}
            selectedIndex={selectedIndex}
            startIndex={allowEmpty && !parameterMode ? 1 : 0}
            isSelected={(ref) => ref === value}
            onSelectEntity={handleSelect}
            onSelectRef={handleSelect}
            emptyMessage={
              allowEmpty ? null : (
                <p className="px-2 py-2 text-[11px] text-muted-foreground italic">
                  {search ? 'No matching entities, parameters, or variables' : 'No entities defined'}
                </p>
              )
            }
          />
        </RefDropdownShell>
      )}
    </div>
  );
}

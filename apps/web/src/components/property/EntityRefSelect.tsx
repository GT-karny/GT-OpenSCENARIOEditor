import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { EntityType } from '@osce/shared';
import { ChevronDown, Check } from 'lucide-react';
import { useScenarioStore } from '../../stores/use-scenario-store';
import { EntityIcon } from '../entity/EntityIcon';
import { cn } from '@/lib/utils';

interface EntityRefSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  allowEmpty?: boolean;
  placeholder?: string;
  className?: string;
}

const TYPE_LABELS: Record<EntityType, string> = {
  vehicle: 'Vehicle',
  pedestrian: 'Pedestrian',
  miscObject: 'Misc Object',
};

const TYPE_ORDER: EntityType[] = ['vehicle', 'pedestrian', 'miscObject'];

export function EntityRefSelect({
  value,
  onValueChange,
  allowEmpty,
  placeholder = 'Select entity...',
  className,
}: EntityRefSelectProps) {
  const entities = useScenarioStore((s) => s.document.entities);
  const parameters = useScenarioStore((s) => s.document.parameterDeclarations);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isParamRef = value.startsWith('$');
  const matchingEntity = entities.find((e) => e.name === value);

  const parameterMode = search.startsWith('$');

  // Filtered entities
  const filteredEntities = useMemo(() => {
    if (parameterMode) return [];
    if (!search) return entities;
    const lower = search.toLowerCase();
    return entities.filter((e) => e.name.toLowerCase().includes(lower));
  }, [entities, search, parameterMode]);

  // Grouped by type
  const grouped = useMemo(() => {
    const groups: { type: EntityType; label: string; items: typeof filteredEntities }[] = [];
    const byType = new Map<EntityType, typeof filteredEntities>();
    for (const e of filteredEntities) {
      if (!byType.has(e.type)) byType.set(e.type, []);
      byType.get(e.type)!.push(e);
    }
    for (const t of TYPE_ORDER) {
      const items = byType.get(t);
      if (items?.length) groups.push({ type: t, label: TYPE_LABELS[t], items });
    }
    return groups;
  }, [filteredEntities]);

  // Flat list for keyboard navigation
  const flatItems = useMemo(() => {
    const items: { type: 'empty' | 'entity' | 'param-entry' | 'param'; name: string }[] = [];
    if (!parameterMode) {
      if (allowEmpty) items.push({ type: 'empty', name: '' });
      for (const g of grouped) {
        for (const e of g.items) items.push({ type: 'entity', name: e.name });
      }
      items.push({ type: 'param-entry', name: '$' });
    } else {
      const fragment = search.substring(1).toLowerCase();
      const filtered = parameters.filter((p) => {
        if (!['string'].some((t) => t === p.parameterType)) return false;
        return p.name.toLowerCase().startsWith(fragment);
      });
      for (const p of filtered) items.push({ type: 'param', name: p.name });
    }
    return items;
  }, [parameterMode, allowEmpty, grouped, search, parameters]);

  // Clamp selectedIndex
  useEffect(() => {
    setSelectedIndex(0);
  }, [search, open]);

  // Focus search input when opening
  useEffect(() => {
    if (open) {
      // Small delay so the DOM has time to render
      requestAnimationFrame(() => searchInputRef.current?.focus());
    } else {
      setSearch('');
    }
  }, [open]);

  const handleSelect = useCallback(
    (name: string) => {
      onValueChange(name);
      setOpen(false);
    },
    [onValueChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      if (flatItems.length === 0) {
        if (e.key === 'Escape') setOpen(false);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatItems[selectedIndex];
        if (!item) return;
        if (item.type === 'entity') handleSelect(item.name);
        else if (item.type === 'empty') handleSelect('');
        else if (item.type === 'param-entry') setSearch('$');
        else if (item.type === 'param') handleSelect(`$${item.name}`);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (parameterMode) {
          setSearch('');
        } else {
          setOpen(false);
        }
      } else if (e.key === 'Tab') {
        setOpen(false);
      }
    },
    [open, flatItems, selectedIndex, handleSelect, parameterMode],
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Track flat item index for rendering
  let flatIdx = 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex h-8 w-full items-center gap-1.5 border border-input bg-transparent px-2 text-sm text-left',
          'hover:bg-[var(--color-glass-1)] transition-colors',
          isParamRef && 'text-[var(--color-accent-1)] font-medium',
          className,
        )}
      >
        {value && !isParamRef && matchingEntity && (
          <EntityIcon type={matchingEntity.type} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate flex-1">{value || placeholder}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full max-h-52 overflow-auto border border-[var(--color-border-glass)] bg-[var(--color-bg-deep)] shadow-md">
          {/* Search input */}
          <div className="p-1 border-b border-[var(--color-glass-edge)]">
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or type $..."
              className="w-full px-2 py-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>

          {parameterMode ? (
            // Parameter suggestions
            <>
              {flatItems.length === 0 ? (
                <p className="px-2 py-2 text-[11px] text-muted-foreground italic">
                  No matching parameters
                </p>
              ) : (
                flatItems.map((item, i) => {
                  const param = parameters.find((p) => p.name === item.name);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      className={cn(
                        'w-full px-2 py-1 text-left text-xs flex items-center gap-2 hover:bg-[var(--color-glass-1)]',
                        i === selectedIndex && 'bg-[var(--color-glass-1)]',
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(`$${item.name}`);
                      }}
                    >
                      <span className="font-medium text-[var(--color-accent-1)]">${item.name}</span>
                      {param && (
                        <>
                          <span className="text-[var(--color-text-tertiary)] text-[10px]">
                            {param.parameterType}
                          </span>
                          <span className="text-[var(--color-text-tertiary)] text-[10px] ml-auto">
                            = {param.value}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })
              )}
            </>
          ) : (
            // Entity list
            <>
              {allowEmpty && (() => {
                const idx = flatIdx++;
                return (
                  <button
                    key="__empty__"
                    type="button"
                    className={cn(
                      'w-full px-2 py-1 text-left text-xs flex items-center gap-2 hover:bg-[var(--color-glass-1)]',
                      idx === selectedIndex && 'bg-[var(--color-glass-1)]',
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect('');
                    }}
                  >
                    <span className="text-muted-foreground italic">(none)</span>
                    {value === '' && <Check className="h-3 w-3 ml-auto" />}
                  </button>
                );
              })()}

              {grouped.length === 0 && !allowEmpty ? (
                <p className="px-2 py-2 text-[11px] text-muted-foreground italic">
                  {search ? 'No matching entities' : 'No entities defined'}
                </p>
              ) : (
                grouped.map((group) => (
                  <div key={group.type}>
                    <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </div>
                    {group.items.map((entity) => {
                      const idx = flatIdx++;
                      return (
                        <button
                          key={entity.id}
                          type="button"
                          className={cn(
                            'w-full px-2 py-1 text-left text-xs flex items-center gap-2 hover:bg-[var(--color-glass-1)]',
                            idx === selectedIndex && 'bg-[var(--color-glass-1)]',
                          )}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelect(entity.name);
                          }}
                        >
                          <EntityIcon type={entity.type} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{entity.name}</span>
                          {entity.name === value && <Check className="h-3 w-3 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}

              {/* Parameter entry point */}
              <div className="border-t border-[var(--color-glass-edge)]">
                {(() => {
                  const idx = flatIdx++;
                  return (
                    <button
                      type="button"
                      className={cn(
                        'w-full px-2 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-[var(--color-glass-1)]',
                        idx === selectedIndex && 'bg-[var(--color-glass-1)]',
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearch('$');
                        searchInputRef.current?.focus();
                      }}
                    >
                      <span className="font-medium text-[var(--color-accent-1)]">$</span>
                      <span className="text-muted-foreground">Use parameter reference...</span>
                    </button>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

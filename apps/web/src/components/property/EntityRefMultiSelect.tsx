import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { EntityType } from '@osce/shared';
import { Plus, X, Check } from 'lucide-react';
import { useScenarioStore } from '../../stores/use-scenario-store';
import { EntityIcon } from '../entity/EntityIcon';
import { ENTITY_DND_TYPE } from '../entity/EntityListItem';
import { PARAMETER_DND_TYPE } from '../parameter/ParameterListItem';
import { VARIABLE_DND_TYPE } from '../variable/VariableListItem';
import { cn } from '@/lib/utils';

interface EntityRefMultiSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  className?: string;
}

const TYPE_LABELS: Record<EntityType, string> = {
  vehicle: 'Vehicle',
  pedestrian: 'Pedestrian',
  miscObject: 'Misc Object',
};

const TYPE_ORDER: EntityType[] = ['vehicle', 'pedestrian', 'miscObject'];

export function EntityRefMultiSelect({ value, onValueChange, className }: EntityRefMultiSelectProps) {
  const entities = useScenarioStore(useShallow((s) => s.document.entities));
  const parameters = useScenarioStore((s) => s.document.parameterDeclarations);
  const variables = useScenarioStore((s) => s.document.variableDeclarations);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);

  const parameterMode = search.startsWith('$');

  const filteredEntities = useMemo(() => {
    if (parameterMode) return [];
    if (!search) return entities;
    const lower = search.toLowerCase();
    return entities.filter((e) => e.name.toLowerCase().includes(lower));
  }, [entities, search, parameterMode]);

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

  // Filtered string parameters (shown in both modes)
  const filteredParams = useMemo(() => {
    if (parameterMode) {
      const fragment = search.substring(1).toLowerCase();
      return parameters.filter((p) => {
        if (p.parameterType !== 'string') return false;
        return p.name.toLowerCase().startsWith(fragment);
      });
    }
    const stringParams = parameters.filter((p) => p.parameterType === 'string');
    if (!search) return stringParams;
    const lower = search.toLowerCase();
    return stringParams.filter((p) => p.name.toLowerCase().includes(lower));
  }, [parameterMode, search, parameters]);

  // Filtered string variables (same logic as parameters)
  const filteredVars = useMemo(() => {
    if (parameterMode) {
      const fragment = search.substring(1).toLowerCase();
      return variables.filter((v) => {
        if (v.variableType !== 'string') return false;
        return v.name.toLowerCase().startsWith(fragment);
      });
    }
    const stringVars = variables.filter((v) => v.variableType === 'string');
    if (!search) return stringVars;
    const lower = search.toLowerCase();
    return stringVars.filter((v) => v.name.toLowerCase().includes(lower));
  }, [parameterMode, search, variables]);

  const flatItems = useMemo(() => {
    const items: { type: 'entity' | 'param' | 'var'; name: string }[] = [];
    if (!parameterMode) {
      for (const g of grouped) {
        for (const e of g.items) items.push({ type: 'entity', name: e.name });
      }
      for (const p of filteredParams) items.push({ type: 'param', name: p.name });
      for (const v of filteredVars) items.push({ type: 'var', name: v.name });
    } else {
      for (const p of filteredParams) items.push({ type: 'param', name: p.name });
      for (const v of filteredVars) items.push({ type: 'var', name: v.name });
    }
    return items;
  }, [parameterMode, grouped, filteredParams, filteredVars]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search, open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    } else {
      setSearch('');
    }
  }, [open]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (
      e.dataTransfer.types.includes(PARAMETER_DND_TYPE) ||
      e.dataTransfer.types.includes(VARIABLE_DND_TYPE) ||
      e.dataTransfer.types.includes(ENTITY_DND_TYPE)
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const paramName = e.dataTransfer.getData(PARAMETER_DND_TYPE) || e.dataTransfer.getData(VARIABLE_DND_TYPE);
      if (paramName) {
        const ref = `$${paramName}`;
        if (!value.includes(ref)) {
          onValueChange([...value, ref]);
        }
        return;
      }
      const entityName = e.dataTransfer.getData(ENTITY_DND_TYPE);
      if (entityName && !value.includes(entityName)) {
        onValueChange([...value, entityName]);
      }
    },
    [value, onValueChange],
  );

  const handleAdd = useCallback(
    (name: string) => {
      if (!value.includes(name)) {
        onValueChange([...value, name]);
      }
      setOpen(false);
    },
    [value, onValueChange],
  );

  const handleRemove = useCallback(
    (name: string) => {
      onValueChange(value.filter((v) => v !== name));
    },
    [value, onValueChange],
  );

  const handleToggle = useCallback(
    (name: string) => {
      if (value.includes(name)) {
        onValueChange(value.filter((v) => v !== name));
      } else {
        onValueChange([...value, name]);
      }
    },
    [value, onValueChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
        if (item.type === 'entity') handleToggle(item.name);
        else if (item.type === 'param' || item.type === 'var') handleAdd(`$${item.name}`);
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
    [flatItems, selectedIndex, handleToggle, handleAdd, parameterMode],
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

  let flatIdx = 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Chip area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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

        {/* Add button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-center h-5 w-5 text-muted-foreground hover:text-foreground hover:bg-[var(--color-glass-1)] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full max-h-52 overflow-auto border border-[var(--color-border-glass)] bg-[var(--color-bg-deep)] shadow-md">
          {/* Search */}
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
            // Parameter/Variable mode (triggered by typing $)
            <>
              {flatItems.length === 0 ? (
                <p className="px-2 py-2 text-[11px] text-muted-foreground italic">
                  No matching parameters or variables
                </p>
              ) : (
                flatItems.map((item, i) => {
                  const param = item.type === 'param'
                    ? parameters.find((p) => p.name === item.name)
                    : variables.find((v) => v.name === item.name);
                  const typeLabel = param
                    ? ('parameterType' in param ? param.parameterType : param.variableType)
                    : '';
                  return (
                    <button
                      key={`${item.type}-${item.name}`}
                      type="button"
                      className={cn(
                        'w-full px-2 py-1 text-left text-xs flex items-center gap-2 hover:bg-[var(--color-glass-1)]',
                        i === selectedIndex && 'bg-[var(--color-glass-1)]',
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAdd(`$${item.name}`);
                      }}
                    >
                      <span className="font-medium text-[var(--color-accent-1)]">${item.name}</span>
                      <span className="text-[var(--color-text-tertiary)] text-[10px]">
                        {item.type === 'var' ? 'var' : 'param'}
                      </span>
                      {param && (
                        <>
                          <span className="text-[var(--color-text-tertiary)] text-[10px]">
                            {typeLabel}
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
            // Entity list + inline parameters
            <>
              {grouped.length === 0 && filteredParams.length === 0 && filteredVars.length === 0 ? (
                <p className="px-2 py-2 text-[11px] text-muted-foreground italic">
                  {search ? 'No matching entities, parameters, or variables' : 'No entities defined'}
                </p>
              ) : (
                <>
                  {grouped.map((group) => (
                    <div key={group.type}>
                      <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {group.label}
                      </div>
                      {group.items.map((entity) => {
                        const idx = flatIdx++;
                        const selected = value.includes(entity.name);
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
                              handleToggle(entity.name);
                            }}
                          >
                            <EntityIcon
                              type={entity.type}
                              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            />
                            <span>{entity.name}</span>
                            {selected && <Check className="h-3 w-3 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}

                  {/* Inline parameter section */}
                  {filteredParams.length > 0 && (
                    <div className={cn(grouped.length > 0 && 'border-t border-[var(--color-glass-edge)]')}>
                      <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Parameters
                      </div>
                      {filteredParams.map((param) => {
                        const idx = flatIdx++;
                        const selected = value.includes(`$${param.name}`);
                        return (
                          <button
                            key={param.id}
                            type="button"
                            className={cn(
                              'w-full px-2 py-1 text-left text-xs flex items-center gap-2 hover:bg-[var(--color-glass-1)]',
                              idx === selectedIndex && 'bg-[var(--color-glass-1)]',
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAdd(`$${param.name}`);
                            }}
                          >
                            <span className="font-medium text-[var(--color-accent-1)]">${param.name}</span>
                            <span className="text-[var(--color-text-tertiary)] text-[10px]">
                              {param.parameterType}
                            </span>
                            <span className="text-[var(--color-text-tertiary)] text-[10px] ml-auto">
                              = {param.value}
                            </span>
                            {selected && <Check className="h-3 w-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline variable section */}
                  {filteredVars.length > 0 && (
                    <div className={cn((grouped.length > 0 || filteredParams.length > 0) && 'border-t border-[var(--color-glass-edge)]')}>
                      <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Variables
                      </div>
                      {filteredVars.map((v) => {
                        const idx = flatIdx++;
                        const selected = value.includes(`$${v.name}`);
                        return (
                          <button
                            key={v.id}
                            type="button"
                            className={cn(
                              'w-full px-2 py-1 text-left text-xs flex items-center gap-2 hover:bg-[var(--color-glass-1)]',
                              idx === selectedIndex && 'bg-[var(--color-glass-1)]',
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAdd(`$${v.name}`);
                            }}
                          >
                            <span className="font-medium text-[var(--color-accent-1)]">${v.name}</span>
                            <span className="text-[var(--color-text-tertiary)] text-[10px]">
                              {v.variableType}
                            </span>
                            <span className="text-[var(--color-text-tertiary)] text-[10px] ml-auto">
                              = {v.value}
                            </span>
                            {selected && <Check className="h-3 w-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

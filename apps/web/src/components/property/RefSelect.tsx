import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ChevronDown, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RefSelectItem {
  name: string;
  group?: string;
  description?: string;
}

interface RefSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  items: RefSelectItem[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function RefSelect({
  value,
  onValueChange,
  items,
  placeholder = 'Select...',
  emptyMessage = 'No items available',
  className,
}: RefSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const valueExists = !value || items.some((item) => item.name === value);

  // Filtered items
  const filtered = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower),
    );
  }, [items, search]);

  // Group items for display
  const groups = useMemo(() => {
    const result: { label: string | null; items: RefSelectItem[] }[] = [];
    const byGroup = new Map<string | null, RefSelectItem[]>();
    for (const item of filtered) {
      const key = item.group ?? null;
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key)!.push(item);
    }
    for (const [label, groupItems] of byGroup) {
      result.push({ label, items: groupItems });
    }
    return result;
  }, [filtered]);

  // Flat list for keyboard navigation
  const flatItems = useMemo(() => {
    const result: string[] = [];
    for (const g of groups) {
      for (const item of g.items) result.push(item.name);
    }
    return result;
  }, [groups]);

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

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (flatItems.length > 0) {
          setSelectedIndex((prev) => (prev + 1) % flatItems.length);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (flatItems.length > 0) {
          setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems.length > 0 && flatItems[selectedIndex] !== undefined) {
          handleSelect(flatItems[selectedIndex]);
        } else if (search) {
          // Manual input: accept the search text as the value
          handleSelect(search);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === 'Tab') {
        setOpen(false);
      }
    },
    [open, flatItems, selectedIndex, handleSelect, search],
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
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex h-8 w-full items-center gap-1.5 border border-input bg-transparent px-2 text-sm text-left',
          'hover:bg-[var(--color-glass-1)] transition-colors',
          className,
        )}
      >
        <span className="truncate flex-1">{value || placeholder}</span>
        {value && !valueExists && (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
        )}
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
              placeholder="Search..."
              className="w-full px-2 py-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="px-2 py-2 text-[11px] text-muted-foreground italic">
              {search ? 'No matches' : emptyMessage}
            </p>
          ) : (
            groups.map((group, gi) => (
              <div key={group.label ?? gi}>
                {group.label && (
                  <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </div>
                )}
                {group.items.map((item) => {
                  const idx = flatIdx++;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      className={cn(
                        'w-full px-2 py-1 text-left text-xs flex items-center gap-2 hover:bg-[var(--color-glass-1)]',
                        idx === selectedIndex && 'bg-[var(--color-glass-1)]',
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(item.name);
                      }}
                    >
                      <span className="truncate">{item.name}</span>
                      {item.description && (
                        <span className="text-[var(--color-text-tertiary)] text-[10px] ml-auto shrink-0">
                          {item.description}
                        </span>
                      )}
                      {item.name === value && <Check className="h-3 w-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

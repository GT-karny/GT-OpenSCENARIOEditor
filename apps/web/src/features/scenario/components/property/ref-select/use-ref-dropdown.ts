import { useEffect, useRef, useState } from 'react';

/**
 * Shared open/search/selection state for the ref-select family.
 *
 * Owns the dropdown lifecycle that is identical across the single, multi, and
 * generic selectors: open toggle, search text, keyboard cursor, search-input
 * autofocus, search reset on close, selection-index reset, and outside-click
 * dismissal.
 */
export function useRefDropdown() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset cursor whenever the search query or open state changes.
  useEffect(() => {
    setSelectedIndex(0);
  }, [search, open]);

  // Focus the search input on open; clear the query on close.
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    } else {
      setSearch('');
    }
  }, [open]);

  // Close when clicking outside the container.
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

  return {
    open,
    setOpen,
    search,
    setSearch,
    selectedIndex,
    setSelectedIndex,
    containerRef,
    searchInputRef,
  };
}

export type RefDropdown = ReturnType<typeof useRefDropdown>;

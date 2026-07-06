import { useCallback } from 'react';
import type { EntityFlatItem } from './types';
import type { RefDropdown } from './use-ref-dropdown';

interface EntityKeyboardNavOptions {
  dropdown: RefDropdown;
  flatItems: EntityFlatItem[];
  parameterMode: boolean;
  /**
   * Whether the trigger itself can open the dropdown on Enter/Space/ArrowDown.
   * True for the single selector (button trigger), false for the multi selector
   * whose dropdown is already open whenever the search input is mounted.
   */
  openOnTrigger: boolean;
  /** Invoked when the user commits the highlighted item with Enter. */
  onCommit: (item: EntityFlatItem) => void;
}

/**
 * Arrow/Enter/Escape/Tab handling shared by the single and multi entity
 * selectors. Selection semantics (replace vs toggle) live in `onCommit`.
 */
export function useEntityKeyboardNav({
  dropdown,
  flatItems,
  parameterMode,
  openOnTrigger,
  onCommit,
}: EntityKeyboardNavOptions) {
  const { open, setOpen, setSearch, selectedIndex, setSelectedIndex } = dropdown;

  return useCallback(
    (e: React.KeyboardEvent) => {
      if (openOnTrigger && !open) {
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
        if (item) onCommit(item);
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
    [openOnTrigger, open, flatItems, selectedIndex, parameterMode, setOpen, setSearch, setSelectedIndex, onCommit],
  );
}

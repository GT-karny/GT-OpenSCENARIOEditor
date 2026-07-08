import { forwardRef, type ReactNode } from 'react';

interface RefDropdownShellProps {
  search: string;
  onSearchChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  searchPlaceholder: string;
  children: ReactNode;
}

/**
 * The positioned dropdown panel and search input shared by every ref selector.
 * The forwarded ref targets the search input so callers can autofocus it.
 */
export const RefDropdownShell = forwardRef<HTMLInputElement, RefDropdownShellProps>(
  function RefDropdownShell({ search, onSearchChange, onKeyDown, searchPlaceholder, children }, ref) {
    return (
      <div className="absolute z-50 top-full left-0 mt-1 w-full max-h-52 overflow-auto border border-[var(--color-border-glass)] bg-[var(--color-bg-deep)] shadow-md">
        <div className="p-1 border-b border-[var(--color-glass-edge)]">
          <input
            ref={ref}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={searchPlaceholder}
            className="w-full px-2 py-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
        {children}
      </div>
    );
  },
);

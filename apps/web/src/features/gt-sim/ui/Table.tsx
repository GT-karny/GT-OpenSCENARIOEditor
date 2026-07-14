/**
 * GT_Sim UI primitive — TableShell + TableSkeleton.
 *
 * Ported from the GT_Sim fork's `components/ui/Table.tsx`. Restyled with
 * APEX `var(--color-*)` tokens; `.glass` (theme-apex utility class) provides
 * the panel background/blur/border.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
  className?: string;
}

export interface TableShellProps {
  columns: TableColumn[];
  children: ReactNode;
}

export function TableShell({ columns, children }: TableShellProps) {
  return (
    <div className="glass overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-glass-edge)] text-[var(--color-text-secondary)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(col.align === 'right' ? 'text-right' : 'text-left', 'px-4 py-3 font-medium', col.className)}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** Skeleton rows for the loading state. */
export function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <div className="glass overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-glass-edge)]">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-3 w-16 animate-pulse bg-[var(--color-glass-1)]" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row} className="border-b border-[var(--color-glass-edge)]/50">
              {Array.from({ length: columns }).map((_, col) => (
                <td key={col} className="px-4 py-3">
                  <div
                    className="h-3 animate-pulse bg-[var(--color-glass-1)]"
                    style={{ width: `${50 + Math.random() * 40}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

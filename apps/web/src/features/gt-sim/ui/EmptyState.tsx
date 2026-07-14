/**
 * GT_Sim UI primitive — EmptyState.
 *
 * Ported from the GT_Sim fork's `components/ui/EmptyState.tsx`, unchanged
 * API. `message` is caller-supplied (already i18n-resolved by the caller).
 */
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="py-12 text-center">
      <p className="mb-4 text-[var(--color-text-secondary)]">{message}</p>
      {action}
    </div>
  );
}

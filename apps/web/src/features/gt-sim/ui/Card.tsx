/**
 * GT_Sim UI primitive — Card.
 *
 * Ported from the GT_Sim fork's `components/ui/Card.tsx` (a thin GlassPanel
 * wrapper). Identical API — this lane's version uses the editor's
 * `@osce/theme-apex` `GlassPanel` directly (same component the fork's own
 * `Card.tsx` already delegated to).
 */
import type { ReactNode } from 'react';
import { GlassPanel } from '@osce/theme-apex';
import { cn } from '@/lib/utils';

export interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'active';
}

export function Card({ title, children, className, variant = 'default' }: CardProps) {
  return (
    <GlassPanel variant={variant} className={cn('p-4', className)}>
      {title && <h2 className="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">{title}</h2>}
      {children}
    </GlassPanel>
  );
}

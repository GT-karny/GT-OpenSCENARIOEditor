/**
 * GT_Sim UI primitive — Button.
 *
 * Ported from the GT_Sim fork's `components/ui/Button.tsx`. Same variant/size
 * API (fork-compatible props), restyled with APEX `var(--color-*)` tokens
 * instead of the fork's bare Tailwind color names (see `docs/STYLE_GUIDE.md`).
 */
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-[var(--color-accent-vivid)]/80 hover:bg-[var(--color-accent-vivid)] text-[var(--color-bg-void)] glow-edge',
  secondary:
    'bg-[var(--color-glass-1)] hover:bg-[var(--color-glass-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-glass-edge)]',
  danger: 'bg-[var(--color-destructive)]/80 hover:bg-[var(--color-destructive)] text-[var(--color-bg-void)]',
  ghost:
    'bg-transparent hover:bg-[var(--color-glass-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
} as const;

const sizes = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-sm px-4 py-3',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-none font-medium transition-colors cursor-pointer',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

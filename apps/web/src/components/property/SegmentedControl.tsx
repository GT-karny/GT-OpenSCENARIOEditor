import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SegmentedControlProps<T extends string> {
  value: T;
  options: readonly T[];
  onValueChange: (value: T) => void;
  /** Custom display labels per option. Falls back to option value. */
  labels?: Partial<Record<T, string>>;
  /** Custom icon/element per option (rendered instead of or alongside label). */
  icons?: Partial<Record<T, ReactNode>>;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onValueChange,
  labels,
  icons,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={cn('flex gap-0.5 p-0.5 bg-muted rounded-sm', className)}>
      {options.map((opt) => {
        const icon = icons?.[opt];
        const label = labels?.[opt] ?? opt;
        const selected = value === opt;

        return (
          <button
            key={opt}
            type="button"
            title={labels?.[opt] ?? opt}
            onClick={() => onValueChange(opt)}
            className={cn(
              'flex-1 flex items-center justify-center px-2 py-1 text-[10px] font-medium transition-all rounded-sm whitespace-nowrap',
              selected
                ? 'glass-item selected'
                : 'text-muted-foreground hover:text-foreground hover:bg-[var(--color-glass-hover)]',
            )}
          >
            {icon ?? label}
          </button>
        );
      })}
    </div>
  );
}

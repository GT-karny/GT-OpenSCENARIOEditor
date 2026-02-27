import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'active';
}

/**
 * APEX glass panel with cursor-reactive edge reflections.
 *
 * Uses CSS classes (.glass, .glass-elevated, .glass-active) that respond
 * to the cursor light system via CSS custom properties set by useCursorLight.
 *
 * The ::before pseudo renders the wide light surface reflection,
 * and ::after renders the hot light edge-only specular (rose lavender).
 */
export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass',
          variant === 'elevated' && 'glass-elevated',
          variant === 'active' && 'glass-active',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

GlassPanel.displayName = 'GlassPanel';

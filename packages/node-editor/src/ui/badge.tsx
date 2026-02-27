/**
 * Small label badge for node type tags and counts.
 */

import type React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const base = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium';
  const variants = {
    default: 'bg-black/10 text-current',
    outline: 'border border-current/30 text-current',
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

import type React from 'react';

export interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

export function Label({ children, className = '' }: LabelProps) {
  return (
    <label className={`text-xs font-medium text-gray-600 ${className}`}>
      {children}
    </label>
  );
}

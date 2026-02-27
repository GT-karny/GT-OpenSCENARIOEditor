import type React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <input
        className={`w-full px-2 py-1 text-sm border rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 ${className}`}
        {...props}
      />
    </div>
  );
}

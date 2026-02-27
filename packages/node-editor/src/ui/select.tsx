import type React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <select
        className={`w-full px-2 py-1 text-sm border rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

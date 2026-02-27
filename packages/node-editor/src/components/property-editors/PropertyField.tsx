/**
 * Reusable property field component for name-value display/edit.
 */

import { Input } from '../../ui/input.js';
import { Select } from '../../ui/select.js';

export interface PropertyFieldProps {
  label: string;
  value: string | number | boolean;
  type?: 'text' | 'number' | 'select' | 'readonly';
  options?: Array<{ value: string; label: string }>;
  onChange?: (value: string) => void;
}

export function PropertyField({ label, value, type = 'text', options, onChange }: PropertyFieldProps) {
  if (type === 'readonly') {
    return (
      <div className="space-y-1">
        <div className="text-xs font-medium text-gray-600">{label}</div>
        <div className="text-sm text-gray-800 px-2 py-1 bg-gray-50 rounded">{String(value)}</div>
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <Select
        label={label}
        options={options}
        value={String(value)}
        onChange={(e) => onChange?.(e.target.value)}
      />
    );
  }

  return (
    <Input
      label={label}
      type={type}
      value={String(value)}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}

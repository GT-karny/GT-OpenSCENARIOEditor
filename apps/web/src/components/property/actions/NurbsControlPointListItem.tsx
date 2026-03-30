import { useState, useEffect, useCallback } from 'react';
import type { NurbsControlPoint } from '@osce/shared';
import { Trash2 } from 'lucide-react';
import { Input } from '../../ui/input';
import { formatPosition } from './TrajectoryVertexListItem';

export interface NurbsControlPointListItemProps {
  index: number;
  controlPoint: NurbsControlPoint;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTimeChange: (time: number | undefined) => void;
  onWeightChange: (weight: number | undefined) => void;
}

/**
 * Decimal-safe number input that keeps local string state while editing.
 */
function DecimalInput({
  value,
  placeholder,
  title,
  onChange,
}: {
  value: number | undefined;
  placeholder: string;
  title: string;
  onChange: (value: number | undefined) => void;
}) {
  const [localValue, setLocalValue] = useState(value != null ? String(value) : '');

  useEffect(() => {
    setLocalValue(value != null ? String(value) : '');
  }, [value]);

  const commit = useCallback(() => {
    if (localValue === '') {
      onChange(undefined);
    } else {
      const parsed = parseFloat(localValue);
      if (!isNaN(parsed)) {
        onChange(parsed);
      } else {
        setLocalValue(value != null ? String(value) : '');
      }
    }
  }, [localValue, onChange, value]);

  return (
    <Input
      value={localValue}
      placeholder={placeholder}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      onClick={(e) => e.stopPropagation()}
      className="h-6 w-[44px] shrink-0 text-[10px] text-center px-1"
      title={title}
    />
  );
}

export function NurbsControlPointListItem({
  index,
  controlPoint,
  isSelected,
  onSelect,
  onDelete,
  onTimeChange,
  onWeightChange,
}: NurbsControlPointListItemProps) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-none border px-2 py-1 cursor-pointer transition-colors ${
        isSelected
          ? 'border-[var(--color-glass-edge-active)] bg-[var(--color-accent-dim)]'
          : 'border-[var(--color-glass-edge)] hover:border-[var(--color-glass-edge-mid)] hover:bg-[var(--color-glass-hover)]'
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Index badge */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-none bg-muted text-[10px] font-semibold text-muted-foreground">
        #{index + 1}
      </span>

      {/* Position summary */}
      <span className="flex-1 truncate text-xs text-foreground">
        {formatPosition(controlPoint.position)}
      </span>

      {/* Weight input */}
      <DecimalInput
        value={controlPoint.weight}
        placeholder="w"
        title="Weight"
        onChange={onWeightChange}
      />

      {/* Time input */}
      <DecimalInput
        value={controlPoint.time}
        placeholder="t"
        title="Time (s)"
        onChange={onTimeChange}
      />

      {/* Delete button */}
      <button
        type="button"
        className="shrink-0 p-0.5 text-muted-foreground hover:text-destructive transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete control point"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

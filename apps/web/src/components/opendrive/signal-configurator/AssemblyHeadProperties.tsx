/**
 * Inline property panel shown when a head is selected on the configurator canvas.
 * Displays preset name, X/Y offsets (editable), computed dimensions, and remove button.
 */

import { useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import type { AssemblyHeadPlacement } from '@osce/opendrive-engine';
import { getPresetById, computeHeadWidth, computeHeadHeight } from '@osce/opendrive-engine';

interface AssemblyHeadPropertiesProps {
  head: AssemblyHeadPlacement;
  index: number;
  onMove: (index: number, x: number, y: number) => void;
  onRemove: (index: number) => void;
}

export function AssemblyHeadProperties({
  head,
  index,
  onMove,
  onRemove,
}: AssemblyHeadPropertiesProps) {
  const preset = getPresetById(head.presetId);
  const bulbCount = preset?.bulbs.length ?? 3;
  const orientation = preset?.orientation ?? 'vertical';
  const w = computeHeadWidth(bulbCount, orientation);
  const h = computeHeadHeight(bulbCount, orientation);

  const handleXChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) onMove(index, val, head.y);
    },
    [index, head.y, onMove],
  );

  const handleYChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) onMove(index, head.x, val);
    },
    [index, head.x, onMove],
  );

  return (
    <div className="border-t border-[var(--color-glass-edge)] px-3 py-2 space-y-1.5">
      {/* Preset name */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-[var(--color-text-muted)]">
          {preset?.label ?? head.presetId}
        </span>
        <button
          type="button"
          className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-status-error)] transition-colors"
          onClick={() => onRemove(index)}
          title="Remove head"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* X / Y offsets */}
      <div className="flex gap-2">
        <label className="flex items-center gap-1 flex-1">
          <span className="text-[9px] text-[var(--color-text-tertiary)] w-3">X</span>
          <input
            type="number"
            step={0.05}
            value={Math.round(head.x * 100) / 100}
            onChange={handleXChange}
            className="w-full h-5 px-1 text-[10px] rounded-none bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] text-[var(--color-text-primary)]"
          />
        </label>
        <label className="flex items-center gap-1 flex-1">
          <span className="text-[9px] text-[var(--color-text-tertiary)] w-3">Y</span>
          <input
            type="number"
            step={0.05}
            value={Math.round(head.y * 100) / 100}
            onChange={handleYChange}
            className="w-full h-5 px-1 text-[10px] rounded-none bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] text-[var(--color-text-primary)]"
          />
        </label>
      </div>

      {/* Dimensions (read-only) */}
      <div className="flex gap-2 text-[9px] text-[var(--color-text-tertiary)]">
        <span>W: {w.toFixed(2)}m</span>
        <span>H: {h.toFixed(2)}m</span>
        <span>{orientation}</span>
      </div>
    </div>
  );
}

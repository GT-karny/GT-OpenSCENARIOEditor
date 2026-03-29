/**
 * Bottom palette strip showing draggable signal head presets.
 * Users drag from palette onto the canvas to add heads.
 */

import { useEffect, useState, memo } from 'react';
import { BUILT_IN_PRESETS, renderSignalHeadToCanvas } from '@osce/opendrive-engine';
import type { SignalHeadCategory } from '@osce/opendrive-engine';

const CATEGORY_ORDER: SignalHeadCategory[] = ['vehicle', 'arrow', 'pedestrian'];
const CATEGORY_LABELS: Record<SignalHeadCategory, string> = {
  vehicle: 'V',
  arrow: 'A',
  pedestrian: 'P',
};

function PaletteItem({ presetId, label }: { presetId: string; label: string }) {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const canvas = renderSignalHeadToCanvas(presetId);
    if (canvas) setImageUrl(canvas.toDataURL());
  }, [presetId]);

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-signal-preset', presetId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex flex-col items-center gap-0.5 p-1 cursor-grab hover:bg-[var(--color-glass-hover)] transition-colors shrink-0"
      title={label}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={label} className="h-8 w-auto object-contain" draggable={false} />
      ) : (
        <div className="h-8 w-5 bg-[var(--color-glass-2)]" />
      )}
      <span className="text-[8px] text-[var(--color-text-tertiary)] truncate max-w-[40px]">
        {label}
      </span>
    </div>
  );
}

export const AssemblyHeadPalette = memo(function AssemblyHeadPalette() {
  return (
    <div className="border-t border-[var(--color-glass-edge)] px-2 py-1">
      <div className="flex items-center gap-2 overflow-x-auto">
        {CATEGORY_ORDER.map((cat) => {
          const presets = BUILT_IN_PRESETS.filter((p) => p.category === cat);
          if (presets.length === 0) return null;
          return (
            <div key={cat} className="flex items-center gap-0.5">
              <span className="text-[8px] font-medium text-[var(--color-text-tertiary)] shrink-0">
                {CATEGORY_LABELS[cat]}
              </span>
              {presets.map((p) => (
                <PaletteItem key={p.id} presetId={p.id} label={p.label} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
});

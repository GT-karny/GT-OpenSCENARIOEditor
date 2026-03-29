/**
 * Thumbnail preview of an assembly preset using Canvas2D rendering.
 * Shows all heads at their X/Y positions scaled to fit.
 */

import { useEffect, useState, memo } from 'react';
import type { AssemblyPreset } from '@osce/opendrive-engine';
import { renderAssemblyThumbnail } from '@osce/opendrive-engine';

interface AssemblyThumbnailProps {
  preset: AssemblyPreset;
  width?: number;
  height?: number;
  className?: string;
}

export const AssemblyThumbnail = memo(function AssemblyThumbnail({
  preset,
  width = 48,
  height = 64,
  className,
}: AssemblyThumbnailProps) {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (preset.heads.length === 0) {
      setImageUrl('');
      return;
    }
    const canvas = renderAssemblyThumbnail(preset.heads, 128);
    setImageUrl(canvas.toDataURL());
  }, [preset]);

  if (!imageUrl) {
    return (
      <div
        className={className}
        style={{ width, height }}
      >
        <div className="w-full h-full flex items-center justify-center text-[8px] text-[var(--color-text-tertiary)]">
          Empty
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={preset.name}
      className={className}
      style={{ width, height, objectFit: 'contain' }}
      draggable={false}
    />
  );
});

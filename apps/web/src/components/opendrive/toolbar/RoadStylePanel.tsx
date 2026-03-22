/**
 * Road style panel: shows lane presets when road creation tool is active.
 * Replaces the property editor in the right panel during creation mode.
 */

import { DEFAULT_PRESETS } from '@osce/opendrive-engine';
import { useOdrSidebarStore } from '../../../hooks/use-opendrive-store';
import { LanePresetPreview } from './LanePresetPreview';
import { ScrollArea } from '../../ui/scroll-area';
import { cn } from '@/lib/utils';

export function RoadStylePanel() {
  const selectedPreset = useOdrSidebarStore((s) => s.roadCreation.selectedPreset);
  const setSelectedPreset = useOdrSidebarStore((s) => s.setSelectedPreset);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-[var(--color-glass-edge)]">
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
          Road Style
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {DEFAULT_PRESETS.map((preset) => (
            <div
              key={preset.name}
              className={cn(
                'glass-item px-3 py-2.5 cursor-pointer',
                selectedPreset === preset.name && 'selected',
              )}
              onClick={() => setSelectedPreset(preset.name)}
            >
              <p className="text-[12px] font-medium mb-1">{preset.name}</p>
              <p className="text-[10px] text-[var(--color-text-tertiary)] mb-2">
                {preset.description}
              </p>
              <LanePresetPreview
                leftLanes={preset.leftLanes}
                rightLanes={preset.rightLanes}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

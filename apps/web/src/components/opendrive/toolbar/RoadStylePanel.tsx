/**
 * Road style panel: shows lane presets when road creation tool is active.
 * Replaces the property editor in the right panel during creation mode.
 */

import type { OdrRoadRule } from '@osce/shared';
import { DEFAULT_PRESETS } from '@osce/opendrive-engine';
import {
  useOdrSidebarStore,
  useOdrRoads,
  useOpenDriveStoreApi,
} from '../../../hooks/use-opendrive-store';
import { LanePresetPreview } from './LanePresetPreview';
import { ScrollArea } from '../../ui/scroll-area';
import { cn } from '@/lib/utils';

const TRAFFIC_RULE_OPTIONS: ReadonlyArray<{ value: OdrRoadRule; label: string }> = [
  { value: 'RHT', label: 'RHT' },
  { value: 'LHT', label: 'LHT' },
];

/** Two-option segmented toggle, matching the road-network toolbar's visual pattern. */
function TrafficRuleToggle({
  value,
  onChange,
}: {
  value: OdrRoadRule;
  onChange: (rule: OdrRoadRule) => void;
}) {
  return (
    <div className="flex items-center h-6">
      {TRAFFIC_RULE_OPTIONS.map((opt, i) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={cn(
              'h-full px-2 text-[10px] transition-colors',
              i === 0 && 'border-r border-[var(--color-glass-edge)]',
              isActive
                ? 'glass-item selected text-[var(--color-text-primary)] bg-[var(--color-glass-active)]'
                : 'text-[var(--color-text-muted)] bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-2)]',
            )}
            onClick={() => onChange(opt.value)}
          >
            <span className="relative z-[2]">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function RoadStylePanel() {
  const selectedPreset = useOdrSidebarStore((s) => s.roadCreation.selectedPreset);
  const setSelectedPreset = useOdrSidebarStore((s) => s.setSelectedPreset);
  const defaultTrafficRule = useOdrSidebarStore((s) => s.roadCreation.defaultTrafficRule);
  const setDefaultTrafficRule = useOdrSidebarStore((s) => s.setDefaultTrafficRule);
  const roads = useOdrRoads();
  const odrStoreApi = useOpenDriveStoreApi();

  const handleApplyToAllRoads = () => {
    const store = odrStoreApi.getState();
    store.beginBatch('Apply traffic rule to all roads');
    for (const road of roads) {
      // Only set 'LHT' explicitly; RHT is the XSD default so leave rule undefined
      // to keep the serialized .xodr minimal.
      store.updateRoad(road.id, { rule: defaultTrafficRule === 'LHT' ? 'LHT' : undefined });
    }
    store.endBatch();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-[var(--color-glass-edge)]">
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
          Road Style
        </span>
      </div>

      <div className="px-3 py-2 space-y-1.5 border-b border-[var(--color-glass-edge)]">
        <span className="text-[10px] font-medium text-[var(--color-text-muted)]">
          Traffic rule
        </span>
        <div className="flex items-center justify-between gap-2">
          <TrafficRuleToggle value={defaultTrafficRule} onChange={setDefaultTrafficRule} />
          <button
            type="button"
            className="h-6 px-2 text-[10px] text-[var(--color-text-muted)] border border-[var(--color-glass-edge)] rounded-none transition-colors hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-hover)] disabled:opacity-50 disabled:pointer-events-none"
            disabled={roads.length === 0}
            onClick={handleApplyToAllRoads}
            title="Set the traffic rule on every existing road"
          >
            Apply to all roads
          </button>
        </div>
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

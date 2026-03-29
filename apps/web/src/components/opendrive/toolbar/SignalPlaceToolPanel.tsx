/**
 * Signal place tool panel: replaces the property editor when signal-place tool is active.
 * Shows signal head presets, housing assembly presets with thumbnails,
 * and opens the visual configurator for creating/editing assemblies.
 */

import { useState, useCallback, useMemo } from 'react';
import { Crosshair, Move, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  BUILT_IN_PRESETS,
  getAllAssemblyPresets,
  saveCustomPreset,
  removeCustomPreset,
  BUILT_IN_ASSEMBLY_PRESETS,
  getPresetById,
} from '@osce/opendrive-engine';
import type { AssemblyPreset, SignalHeadCategory } from '@osce/opendrive-engine';
import { useOdrSidebarStore } from '../../../hooks/use-opendrive-store';
import { ScrollArea } from '../../ui/scroll-area';
import { SignalAssemblyConfigurator } from '../signal-configurator/SignalAssemblyConfigurator';
import { AssemblyThumbnail } from '../signal-configurator/AssemblyThumbnail';
import { cn } from '@/lib/utils';

// ── Bulb color CSS values ────────────────────────────────────────────────────

const BULB_CSS: Record<string, string> = {
  red: '#EF4444',
  yellow: '#F59E0B',
  green: '#22C55E',
};

// ── Category labels ──────────────────────────────────────────────────────────

const CATEGORY_ORDER: SignalHeadCategory[] = ['vehicle', 'arrow', 'pedestrian'];
const CATEGORY_LABELS: Record<SignalHeadCategory, string> = {
  vehicle: 'Vehicle',
  arrow: 'Arrow',
  pedestrian: 'Pedestrian',
};

// ── Inline bulb preview for a single head preset ─────────────────────────────

function BulbDots({ presetId }: { presetId: string }) {
  const headPreset = getPresetById(presetId);
  if (!headPreset) return null;
  return (
    <div
      className={cn(
        'flex gap-0.5 shrink-0',
        headPreset.orientation === 'vertical' ? 'flex-col' : 'flex-row',
      )}
    >
      {headPreset.bulbs.map((bulb, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full border border-[var(--color-glass-edge)]"
          style={{ backgroundColor: BULB_CSS[bulb.color] }}
        />
      ))}
    </div>
  );
}

// ── Configurator edit mode ──────────────────────────────────────────────────

type ConfiguratorMode =
  | { type: 'off' }
  | { type: 'new' }
  | { type: 'edit'; preset: AssemblyPreset };

// ── Main panel ───────────────────────────────────────────────────────────────

export function SignalPlaceToolPanel() {
  const selectionType = useOdrSidebarStore((s) => s.signalPlace.selectionType);
  const selectedPresetId = useOdrSidebarStore((s) => s.signalPlace.selectedPresetId);
  const subMode = useOdrSidebarStore((s) => s.signalPlace.subMode);
  const tSnapMode = useOdrSidebarStore((s) => s.signalPlace.tSnapMode);
  const signalOrientation = useOdrSidebarStore((s) => s.signalPlace.signalOrientation);
  const setSignalPlaceSelection = useOdrSidebarStore((s) => s.setSignalPlaceSelection);
  const setSignalPlaceSubMode = useOdrSidebarStore((s) => s.setSignalPlaceSubMode);
  const setSignalPlaceTSnapMode = useOdrSidebarStore((s) => s.setSignalPlaceTSnapMode);
  const setSignalPlaceOrientation = useOdrSidebarStore((s) => s.setSignalPlaceOrientation);

  const [configuratorMode, setConfiguratorMode] = useState<ConfiguratorMode>({ type: 'off' });
  const [, forceUpdate] = useState(0);

  const assemblyPresets = useMemo(
    () => getAllAssemblyPresets(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configuratorMode],
  );

  // Group head presets by category
  const groupedPresets = useMemo(() => {
    const map = new Map<SignalHeadCategory, typeof BUILT_IN_PRESETS>();
    for (const cat of CATEGORY_ORDER) {
      map.set(
        cat,
        BUILT_IN_PRESETS.filter((p) => p.category === cat),
      );
    }
    return map;
  }, []);

  const handleSaveAssembly = useCallback(
    (preset: AssemblyPreset) => {
      saveCustomPreset(preset);
      setConfiguratorMode({ type: 'off' });
      setSignalPlaceSelection('assembly', preset.id);
      forceUpdate((n) => n + 1);
    },
    [setSignalPlaceSelection],
  );

  const handleRemoveAssembly = useCallback(
    (presetId: string) => {
      removeCustomPreset(presetId);
      if (selectionType === 'assembly' && selectedPresetId === presetId) {
        setSignalPlaceSelection('head', '3-light-vertical');
      }
      forceUpdate((n) => n + 1);
    },
    [selectionType, selectedPresetId, setSignalPlaceSelection],
  );

  const isBuiltInAssembly = useCallback(
    (id: string) => BUILT_IN_ASSEMBLY_PRESETS.some((p) => p.id === id),
    [],
  );

  // ── Visual Configurator mode ──
  if (configuratorMode.type !== 'off') {
    return (
      <SignalAssemblyConfigurator
        preset={configuratorMode.type === 'edit' ? configuratorMode.preset : null}
        onSave={handleSaveAssembly}
        onCancel={() => setConfiguratorMode({ type: 'off' })}
      />
    );
  }

  // ── Normal selection mode ──
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--color-glass-edge)]">
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">Signal</span>
      </div>

      {/* Controls: sub-mode + t-snap */}
      <div className="px-3 py-2 space-y-1.5 border-b border-[var(--color-glass-edge)]">
        <div className="flex gap-1">
          <ControlButton
            icon={Crosshair}
            label="Place"
            active={subMode === 'place'}
            onClick={() => setSignalPlaceSubMode('place')}
          />
          <ControlButton
            icon={Move}
            label="Move"
            active={subMode === 'move'}
            onClick={() => setSignalPlaceSubMode('move')}
          />
        </div>
        <div className="flex gap-1">
          <SnapButton
            label="Lane Above"
            active={tSnapMode === 'lane-above'}
            onClick={() => setSignalPlaceTSnapMode('lane-above')}
          />
          <SnapButton
            label="Road Edge"
            active={tSnapMode === 'road-edge'}
            onClick={() => setSignalPlaceTSnapMode('road-edge')}
          />
        </div>
        <div className="flex gap-1">
          <SnapButton
            label="Auto"
            active={signalOrientation === 'auto'}
            onClick={() => setSignalPlaceOrientation('auto')}
          />
          <SnapButton
            label="+ (→)"
            active={signalOrientation === '+'}
            onClick={() => setSignalPlaceOrientation('+')}
          />
          <SnapButton
            label="− (←)"
            active={signalOrientation === '-'}
            onClick={() => setSignalPlaceOrientation('-')}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* ── Signal Types (single housing) ── */}
          <section>
            <SectionLabel>Signal Types</SectionLabel>
            <div className="space-y-2 mt-1.5">
              {CATEGORY_ORDER.map((cat) => {
                const presets = groupedPresets.get(cat);
                if (!presets?.length) return null;
                return (
                  <div key={cat}>
                    <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <div className="space-y-0.5 mt-0.5">
                      {presets.map((preset) => (
                        <div
                          key={preset.id}
                          className={cn(
                            'glass-item px-2 py-1.5 cursor-pointer flex items-center gap-2',
                            selectionType === 'head' &&
                              selectedPresetId === preset.id &&
                              'selected',
                          )}
                          onClick={() => setSignalPlaceSelection('head', preset.id)}
                        >
                          <BulbDots presetId={preset.id} />
                          <span className="text-[11px]">{preset.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="divider-glow" />

          {/* ── Assemblies (housing combinations) with thumbnails ── */}
          <section>
            <SectionLabel>Assemblies</SectionLabel>
            <div className="space-y-0.5 mt-1.5">
              {assemblyPresets.map((preset) => (
                <div
                  key={preset.id}
                  className={cn(
                    'glass-item px-2 py-1.5 cursor-pointer flex items-center gap-2 group',
                    selectionType === 'assembly' &&
                      selectedPresetId === preset.id &&
                      'selected',
                  )}
                  onClick={() => setSignalPlaceSelection('assembly', preset.id)}
                >
                  <AssemblyThumbnail
                    preset={preset}
                    width={32}
                    height={48}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] truncate">{preset.name}</p>
                    <p className="text-[9px] text-[var(--color-text-tertiary)]">
                      {preset.heads
                        .map((h) => getPresetById(h.presetId)?.label ?? h.presetId)
                        .join(' + ')}
                    </p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-accent-vivid)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfiguratorMode({ type: 'edit', preset });
                      }}
                      title="Edit assembly"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {!isBuiltInAssembly(preset.id) && (
                      <button
                        type="button"
                        className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-status-error)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAssembly(preset.id);
                        }}
                        title="Delete assembly"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* New Assembly */}
            <button
              type="button"
              className="flex items-center gap-1 mt-2 h-6 px-2 text-[10px] text-[var(--color-accent-vivid)] hover:text-[var(--color-text-primary)] transition-colors"
              onClick={() => setConfiguratorMode({ type: 'new' })}
            >
              <Plus className="w-3 h-3" />
              New Assembly
            </button>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium text-[var(--color-text-muted)]">{children}</span>
  );
}

function ControlButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-1 h-6 px-2 text-[10px] rounded-none transition-colors flex-1',
        active
          ? 'text-[var(--color-text-primary)] bg-[var(--color-glass-hover)] border-b border-[var(--color-accent-vivid)]'
          : 'text-[var(--color-text-muted)] border-b border-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-hover)]',
      )}
      onClick={onClick}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}

function SnapButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex-1 h-5 text-[9px] rounded-none transition-colors',
        active
          ? 'text-[var(--color-text-primary)] bg-[var(--color-glass-hover)]'
          : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-muted)] hover:bg-[var(--color-glass-1)]',
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/**
 * Inline editor for a selected cell (track × phase).
 * State presets + custom input + track signal ID management.
 */

import { memo, useMemo } from 'react';
import { X } from 'lucide-react';
import { SignalIcon2D } from './SignalIcon2D';
import type { TrackDefinition } from './SignalTrack';

interface CellEditorProps {
  track: TrackDefinition;
  phaseName: string;
  currentState: string;
  onChangeState: (state: string) => void;
  onClose: () => void;
}

interface Preset {
  label: string;
  value: string;
}

const PRESETS_3: Preset[] = [
  { label: 'Red', value: 'on;off;off' },
  { label: 'Yellow', value: 'off;on;off' },
  { label: 'Green', value: 'off;off;on' },
  { label: 'R+Y', value: 'on;on;off' },
  { label: 'Y\u26A1', value: 'off;flashing;off' },
  { label: 'R\u26A1', value: 'flashing;off;off' },
  { label: 'Off', value: 'off;off;off' },
];

const PRESETS_PED: Preset[] = [
  { label: 'Red (Stop)', value: 'on;off' },
  { label: 'Green (Go)', value: 'off;on' },
  { label: 'G\u26A1', value: 'off;flashing' },
  { label: 'Off', value: 'off;off' },
];

const PRESETS_1: Preset[] = [
  { label: 'ON', value: 'on' },
  { label: 'Flash', value: 'flashing' },
  { label: 'OFF', value: 'off' },
];

function isPedestrianDescriptor(track: TrackDefinition): boolean {
  return track.catalogKey === '1000002' || track.catalogKey.includes('pedestrian');
}

export const CellEditor = memo(function CellEditor({
  track,
  phaseName,
  currentState,
  onChangeState,
  onClose,
}: CellEditorProps) {
  const presets = useMemo(() => {
    if (isPedestrianDescriptor(track)) return PRESETS_PED;
    const bulbCount = track.descriptor.bulbs.length;
    if (bulbCount >= 3) return PRESETS_3;
    if (bulbCount === 1) return PRESETS_1;
    return PRESETS_PED; // 2-bulb fallback
  }, [track]);

  return (
    <div className="border-t border-[var(--color-glass-edge)] bg-[var(--color-glass-1)] px-3 py-2">
      <div className="flex items-center gap-3">
        <SignalIcon2D
          descriptor={track.descriptor}
          activeState={currentState}
          width={20}
          height={44}
        />
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[var(--color-text-secondary)]">
            {track.label} / {phaseName}
          </span>
          <input
            type="text"
            value={currentState}
            onChange={(e) => onChangeState(e.target.value)}
            placeholder="on;off;off"
            className="h-6 w-28 px-1.5 text-xs bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] rounded-none text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {/* Preset buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChangeState(preset.value)}
              className={`
                h-6 px-2 text-[10px] font-medium rounded-none border transition-colors
                ${currentState === preset.value
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/10'
                  : 'border-[var(--color-glass-edge)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-hover)]'
                }
              `}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs shrink-0"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
});

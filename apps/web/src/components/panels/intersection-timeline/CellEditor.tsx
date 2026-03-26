/**
 * Inline editor for a selected cell (track × phase).
 * State presets + custom input + track signal ID management.
 */

import { memo, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { SignalIcon2D } from './SignalIcon2D';
import type { TrackDefinition } from './SignalTrack';

interface CellEditorProps {
  track: TrackDefinition;
  phaseName: string;
  currentState: string;
  onChangeState: (state: string) => void;
  onChangeTrackLabel: (label: string) => void;
  onAddSignalId: (id: string) => void;
  onRemoveSignalId: (id: string) => void;
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
  { label: 'Off', value: 'off;off;off' },
];

const PRESETS_PED: Preset[] = [
  { label: 'Red (Stop)', value: 'on;off' },
  { label: 'Green (Go)', value: 'off;on' },
  { label: 'Off', value: 'off;off' },
];

const PRESETS_1: Preset[] = [
  { label: 'ON', value: 'on' },
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
  onChangeTrackLabel,
  onAddSignalId,
  onRemoveSignalId,
  onClose,
}: CellEditorProps) {
  const presets = useMemo(() => {
    if (isPedestrianDescriptor(track)) return PRESETS_PED;
    const bulbCount = track.descriptor.bulbs.length;
    if (bulbCount >= 3) return PRESETS_3;
    if (bulbCount === 1) return PRESETS_1;
    return PRESETS_PED; // 2-bulb fallback
  }, [track]);

  const [newIdInput, setNewIdInput] = useState('');
  const hasIds = track.signalIds.length > 0;

  const handleAddId = () => {
    const trimmed = newIdInput.trim();
    if (trimmed) {
      onAddSignalId(trimmed);
      setNewIdInput('');
    }
  };

  return (
    <div className="border-t border-[var(--color-glass-edge)] bg-[var(--color-glass-1)] px-3 py-2 space-y-1.5">
      {/* Warning if no IDs */}
      {!hasIds && (
        <div className="text-[10px] text-[var(--color-status-warning)] bg-[var(--color-status-warning)]/10 px-2 py-1">
          Add at least one Signal ID to this track for state changes to take effect in .xosc
        </div>
      )}

      {/* Row 1: State editing */}
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

      {/* Row 2: Track label + Signal IDs */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-[var(--color-text-secondary)] shrink-0">Label:</span>
        <input
          type="text"
          value={track.label}
          onChange={(e) => onChangeTrackLabel(e.target.value)}
          className="h-5 w-24 px-1 text-[10px] bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] rounded-none text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
        />
        <span className="text-[9px] text-[var(--color-text-secondary)] shrink-0 ml-2">Signal IDs:</span>
        <div className="flex items-center gap-1 flex-wrap">
          {track.signalIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-0.5 h-5 px-1.5 text-[10px] bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] text-[var(--color-text-primary)]"
            >
              {id}
              <button
                type="button"
                onClick={() => onRemoveSignalId(id)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-status-error)] ml-0.5"
              >
                <X className="size-2.5" />
              </button>
            </span>
          ))}
          {/* Inline input for adding ID */}
          <form
            className="inline-flex items-center gap-0.5"
            onSubmit={(e) => { e.preventDefault(); handleAddId(); }}
          >
            <input
              type="text"
              value={newIdInput}
              onChange={(e) => setNewIdInput(e.target.value)}
              placeholder="ID"
              className="h-5 w-14 px-1 text-[10px] bg-[var(--color-glass-2)] border border-dashed border-[var(--color-glass-edge)] rounded-none text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-secondary)]/50"
            />
            <button
              type="submit"
              className="inline-flex items-center h-5 px-1 text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-glass-edge)] transition-colors"
            >
              <Plus className="size-2.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
});

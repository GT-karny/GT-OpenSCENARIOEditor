/**
 * A single track row in the matrix timeline.
 * A track is defined by signal TYPE (not ID), and can have multiple signal IDs assigned.
 * All IDs in the same track share the same state per phase.
 */

import { memo, useMemo, useState, useCallback } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import type { TrafficSignalPhase } from '@osce/shared';
import type { SignalDescriptor, BulbColor } from '@osce/3d-viewer';
import { SignalIcon2D } from './SignalIcon2D';

export interface TrackDefinition {
  /** Unique track key (internal, not persisted) */
  trackKey: string;
  /** User-facing label, e.g. "NS 3-color" */
  label: string;
  /** Signal catalog key, e.g. "1000001" or "trafficLight:arrow-left" */
  catalogKey: string;
  /** Visual descriptor resolved from catalogKey */
  descriptor: SignalDescriptor;
  /** One or more OpenDRIVE signal IDs assigned to this track */
  signalIds: string[];
  /** Cached states per phase index (used when signalIds is empty) */
  pendingStates?: Record<number, string>;
}

interface SignalTrackProps {
  track: TrackDefinition;
  phases: TrafficSignalPhase[];
  totalDuration: number;
  activePhaseIndex: number | null;
  selectedCell: { phaseIndex: number; trackKey: string } | null;
  onCellClick: (phaseIndex: number, trackKey: string) => void;
  onTrackLabelChange: (trackKey: string, label: string) => void;
  onAddSignalId: (trackKey: string, signalId: string) => void;
  onRemoveSignalId: (trackKey: string, signalId: string) => void;
  onDeleteTrack: (trackKey: string) => void;
}

/** Get state string for this track in a phase (uses first signalId, falls back to pendingStates) */
function getTrackStateInPhase(
  phase: TrafficSignalPhase,
  signalIds: string[],
  phaseIndex: number,
  pendingStates?: Record<number, string>,
): string {
  for (const id of signalIds) {
    const st = phase.trafficSignalStates.find((s) => s.trafficSignalId === id);
    if (st) return st.state;
  }
  return pendingStates?.[phaseIndex] ?? '';
}

// Color palette for cell backgrounds
const COLOR_BG: Record<BulbColor | 'off', { bg: string; text: string }> = {
  red: { bg: 'rgba(239,68,68,0.18)', text: '#f87171' },
  yellow: { bg: 'rgba(251,191,36,0.18)', text: '#fbbf24' },
  green: { bg: 'rgba(16,185,129,0.18)', text: '#34d399' },
  off: { bg: 'rgba(115,115,115,0.08)', text: '#6b7280' },
};

const LABEL_MAP: Record<BulbColor, string> = { red: 'R', yellow: 'Y', green: 'G' };

interface CellColorResult {
  bg: string;
  text: string;
  hasFlashing: boolean;
}

/**
 * Determine cell background color from state string + bulb definitions.
 * Uses the descriptor's bulb colors instead of assuming [red, yellow, green] order.
 */
function cellColor(state: string, bulbs: readonly { color: BulbColor }[]): CellColorResult {
  if (!state) return { bg: 'transparent', text: '#6b7280', hasFlashing: false };
  const lower = state.toLowerCase().trim();
  if (!lower || lower === 'off') return { ...COLOR_BG.off, hasFlashing: false };

  // Check for all-off patterns
  const allOff = lower.split(';').every((s) => s.trim() === 'off');
  if (allOff) return { ...COLOR_BG.off, hasFlashing: false };

  if (lower.includes(';')) {
    const parts = lower.split(';').map((s) => s.trim());
    // Collect active bulb colors using the descriptor
    const activeColors: BulbColor[] = [];
    let hasFlashing = false;
    for (let i = 0; i < parts.length; i++) {
      if ((parts[i] === 'on' || parts[i] === 'flashing') && i < bulbs.length) {
        activeColors.push(bulbs[i].color);
        if (parts[i] === 'flashing') hasFlashing = true;
      }
    }
    if (activeColors.length === 0) return { ...COLOR_BG.off, hasFlashing: false };
    // Priority: red > yellow > green (for mixed states like R+Y)
    if (activeColors.includes('red')) return { ...COLOR_BG.red, hasFlashing };
    if (activeColors.includes('yellow')) return { ...COLOR_BG.yellow, hasFlashing };
    if (activeColors.includes('green')) return { ...COLOR_BG.green, hasFlashing };
    // Fallback for unknown bulb colors
    return { ...(COLOR_BG[activeColors[0]] ?? COLOR_BG.off), hasFlashing };
  }

  // Named color format
  const isFlash = lower === 'flashing';
  if (lower.includes('green') || lower === 'on' || isFlash) return { ...COLOR_BG.green, hasFlashing: isFlash };
  if (lower.includes('yellow')) return { ...COLOR_BG.yellow, hasFlashing: false };
  if (lower.includes('red')) return { ...COLOR_BG.red, hasFlashing: false };
  return { bg: 'rgba(115,115,115,0.08)', text: '#9ca3af', hasFlashing: false };
}

/**
 * Short display label for a state, using bulb definitions for correct naming.
 */
function stateLabel(state: string, bulbs: readonly { color: BulbColor }[]): string {
  if (!state) return '—';
  const lower = state.toLowerCase().trim();

  // All-off patterns
  if (!lower || lower === 'off') return 'OFF';
  const parts = lower.split(';').map((s) => s.trim());
  if (parts.every((s) => s === 'off')) return 'OFF';

  if (lower === 'on') return 'ON';

  if (lower.includes(';')) {
    // Build label from active bulb colors
    const labels: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      if ((parts[i] === 'on' || parts[i] === 'flashing') && i < bulbs.length) {
        const base = LABEL_MAP[bulbs[i].color] ?? `#${i + 1}`;
        labels.push(parts[i] === 'flashing' ? base + '\u26A1' : base);
      }
    }
    if (labels.length === 0) return 'OFF';
    return labels.join('+');
  }

  // Named color format
  if (lower.includes('green')) return 'G';
  if (lower.includes('yellow')) return 'Y';
  if (lower.includes('red')) return 'R';
  return state.length > 8 ? state.slice(0, 7) + '…' : state;
}

export const SignalTrack = memo(function SignalTrack({
  track,
  phases,
  totalDuration,
  activePhaseIndex,
  selectedCell,
  onCellClick,
  onTrackLabelChange,
  onAddSignalId,
  onRemoveSignalId,
  onDeleteTrack,
}: SignalTrackProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [newIdInput, setNewIdInput] = useState('');

  // Current state for the signal icon
  const currentState = useMemo(() => {
    if (activePhaseIndex === null || !phases[activePhaseIndex]) return '';
    return getTrackStateInPhase(phases[activePhaseIndex], track.signalIds, activePhaseIndex, track.pendingStates);
  }, [activePhaseIndex, phases, track.signalIds, track.pendingStates]);

  const idsDisplay = track.signalIds.length > 0
    ? track.signalIds.join(', ')
    : 'no ID';

  const handleAddId = useCallback(() => {
    const trimmed = newIdInput.trim();
    if (trimmed) {
      onAddSignalId(track.trackKey, trimmed);
      setNewIdInput('');
    }
  }, [newIdInput, onAddSignalId, track.trackKey]);

  return (
    <div className="flex items-stretch h-10 border-b border-[var(--color-glass-edge)]">
      {/* Track label + signal icon (clickable) */}
      <button
        type="button"
        onClick={() => setShowPopover((v) => !v)}
        className="flex items-center gap-1.5 w-[140px] shrink-0 px-2 border-r border-[var(--color-glass-edge)] hover:bg-[var(--color-glass-hover)] transition-colors relative text-left"
      >
        <SignalIcon2D
          descriptor={track.descriptor}
          activeState={currentState}
          width={16}
          height={36}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-[var(--color-text-primary)] truncate font-medium leading-tight">
            {track.label}
          </span>
          <span className={`text-[9px] truncate leading-tight ${track.signalIds.length > 0 ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-status-warning)]'}`}>
            {idsDisplay}
          </span>
        </div>

        {/* Track settings popover */}
        {showPopover && (
          <div
            className="absolute top-full left-0 z-30 w-56 bg-[var(--color-bg-deep)] border border-[var(--color-glass-edge)] shadow-lg p-2 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Label */}
            <div className="space-y-0.5">
              <span className="text-[9px] text-[var(--color-text-secondary)]">Label</span>
              <input
                type="text"
                value={track.label}
                onChange={(e) => onTrackLabelChange(track.trackKey, e.target.value)}
                className="h-5 w-full px-1 text-[10px] bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] rounded-none text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Signal IDs */}
            <div className="space-y-0.5">
              <span className="text-[9px] text-[var(--color-text-secondary)]">Signal IDs</span>
              <div className="flex items-center gap-1 flex-wrap">
                {track.signalIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-0.5 h-5 px-1.5 text-[10px] bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] text-[var(--color-text-primary)]"
                  >
                    {id}
                    <button
                      type="button"
                      onClick={() => onRemoveSignalId(track.trackKey, id)}
                      className="text-[var(--color-text-secondary)] hover:text-[var(--color-status-error)] ml-0.5"
                    >
                      <X className="size-2.5" />
                    </button>
                  </span>
                ))}
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

            {/* Delete track */}
            <button
              type="button"
              onClick={() => { onDeleteTrack(track.trackKey); setShowPopover(false); }}
              className="flex items-center gap-1 text-[10px] text-[var(--color-status-error)] hover:text-[var(--color-status-error)]/80 transition-colors"
            >
              <Trash2 className="size-3" />
              Delete track
            </button>
          </div>
        )}
      </button>

      {/* Phase cells */}
      <div className="flex-1 flex items-stretch">
        {phases.map((phase, pi) => {
          const state = getTrackStateInPhase(phase, track.signalIds, pi, track.pendingStates);
          const colors = cellColor(state, track.descriptor.bulbs);
          const isActive = activePhaseIndex === pi;
          const isSelected =
            selectedCell?.phaseIndex === pi && selectedCell?.trackKey === track.trackKey;

          const widthPercent =
            totalDuration > 0 ? (phase.duration / totalDuration) * 100 : 0;

          return (
            <button
              key={pi}
              type="button"
              onClick={() => onCellClick(pi, track.trackKey)}
              className={`
                relative overflow-hidden border-r border-[var(--color-glass-edge)] transition-all
                hover:brightness-125
                ${isSelected ? 'ring-1 ring-inset ring-[var(--color-accent)]' : ''}
              `}
              style={{
                width: `${widthPercent}%`,
                minWidth: widthPercent > 0 ? 4 : 0,
                backgroundColor: colors.bg,
                backgroundImage: colors.hasFlashing
                  ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.12) 3px, rgba(255,255,255,0.12) 4px)'
                  : undefined,
                filter: isActive ? 'brightness(1.3)' : undefined,
              }}
            >
              <span
                className="text-[10px] font-medium"
                style={{ color: colors.text }}
              >
                {stateLabel(state, track.descriptor.bulbs)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

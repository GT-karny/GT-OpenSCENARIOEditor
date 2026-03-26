/**
 * Inline detail editor for a selected phase.
 * Shows phase name, duration, and signal state entries with preset dropdown.
 */

import { memo, useMemo } from 'react';
import type { TrafficSignalController, TrafficSignalPhase, TrafficSignalState } from '@osce/shared';
import type { SignalDescriptor } from '@osce/3d-viewer';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { SignalIcon2D } from './SignalIcon2D';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

const STATE_PRESETS = [
  { label: 'Red', value: 'on;off;off' },
  { label: 'Yellow', value: 'off;on;off' },
  { label: 'Green', value: 'off;off;on' },
  { label: 'Red+Yellow', value: 'on;on;off' },
  { label: 'Off', value: 'off;off;off' },
  { label: 'Custom', value: '__custom__' },
] as const;

interface PhaseDetailPanelProps {
  controller: TrafficSignalController;
  phaseIndex: number;
  onUpdatePhase: (
    controllerId: string,
    phaseIndex: number,
    updates: Partial<TrafficSignalPhase>,
  ) => void;
  signalDescriptors: Map<string, SignalDescriptor>;
  defaultDescriptor: SignalDescriptor;
}

export const PhaseDetailPanel = memo(function PhaseDetailPanel({
  controller,
  phaseIndex,
  onUpdatePhase,
  signalDescriptors,
  defaultDescriptor,
}: PhaseDetailPanelProps) {
  const phase = controller.phases[phaseIndex];
  if (!phase) return null;

  const updateStates = (newStates: TrafficSignalState[]) => {
    onUpdatePhase(controller.id, phaseIndex, { trafficSignalStates: newStates });
  };

  const updateState = (stateIndex: number, updates: Partial<TrafficSignalState>) => {
    const newStates = phase.trafficSignalStates.map((s, i) =>
      i === stateIndex ? { ...s, ...updates } : s,
    );
    updateStates(newStates);
  };

  return (
    <div className="border-t border-[var(--color-glass-edge)] bg-[var(--color-glass-1)] px-3 py-2 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">
          Phase Detail
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-0.5">
          <Label className="text-[10px]">Name</Label>
          <Input
            value={phase.name}
            onChange={(e) =>
              onUpdatePhase(controller.id, phaseIndex, { name: e.target.value })
            }
            className="h-6 text-xs"
          />
        </div>
        <div className="grid gap-0.5">
          <Label className="text-[10px]">Duration (s)</Label>
          <Input
            type="number"
            value={phase.duration}
            onChange={(e) =>
              onUpdatePhase(controller.id, phaseIndex, {
                duration: parseFloat(e.target.value) || 0,
              })
            }
            className="h-6 text-xs"
          />
        </div>
      </div>

      {/* Signal states */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--color-text-secondary)]">Signal States</span>
          <button
            type="button"
            className="text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            onClick={() =>
              updateStates([
                ...phase.trafficSignalStates,
                { trafficSignalId: '', state: 'off;off;off' },
              ])
            }
          >
            + Add
          </button>
        </div>

        {phase.trafficSignalStates.map((st, si) => (
          <SignalStateRow
            key={si}
            state={st}
            stateIndex={si}
            descriptor={signalDescriptors.get(st.trafficSignalId) ?? defaultDescriptor}
            onUpdate={(updates) => updateState(si, updates)}
            onRemove={() =>
              updateStates(phase.trafficSignalStates.filter((_, i) => i !== si))
            }
          />
        ))}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------

interface SignalStateRowProps {
  state: TrafficSignalState;
  stateIndex: number;
  descriptor: SignalDescriptor;
  onUpdate: (updates: Partial<TrafficSignalState>) => void;
  onRemove: () => void;
}

function SignalStateRow({ state, descriptor, onUpdate, onRemove }: SignalStateRowProps) {
  const presetValue = useMemo(() => {
    const match = STATE_PRESETS.find((p) => p.value === state.state);
    return match ? match.value : '__custom__';
  }, [state.state]);

  return (
    <div className="flex items-center gap-1.5">
      <SignalIcon2D descriptor={descriptor} activeState={state.state} width={12} height={28} />
      <Input
        value={state.trafficSignalId}
        placeholder="Signal ID"
        onChange={(e) => onUpdate({ trafficSignalId: e.target.value })}
        className="h-6 text-xs w-20"
      />
      <Select
        value={presetValue}
        onValueChange={(v) => {
          if (v !== '__custom__') onUpdate({ state: v });
        }}
      >
        <SelectTrigger className="h-6 text-xs w-24 rounded-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATE_PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value} className="text-xs">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={state.state}
        placeholder="on;off;off"
        onChange={(e) => onUpdate({ state: e.target.value })}
        className="h-6 text-xs flex-1"
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-[var(--color-text-secondary)] hover:text-[var(--color-status-error)] transition-colors text-xs shrink-0"
      >
        ×
      </button>
    </div>
  );
}

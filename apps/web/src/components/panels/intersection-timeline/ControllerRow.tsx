/**
 * One horizontal row in the timeline representing a single TrafficSignalController.
 * Left: signal icon + controller name. Right: phase blocks.
 */

import { memo, useMemo } from 'react';
import type { TrafficSignalController } from '@osce/shared';
import type { SignalDescriptor } from '@osce/3d-viewer';
import { SignalIcon2D } from './SignalIcon2D';
import { PhaseBlock } from './PhaseBlock';
import {
  getActivePhase,
  getControllerCycleDuration,
} from '../../../hooks/use-signal-timeline';
import type { SelectedPhase } from '../../../hooks/use-signal-timeline';

interface ControllerRowProps {
  controller: TrafficSignalController;
  currentTime: number;
  selectedPhase: SelectedPhase | null;
  onSelectPhase: (phase: SelectedPhase | null) => void;
  signalDescriptors: Map<string, SignalDescriptor>;
  defaultDescriptor: SignalDescriptor;
}

export const ControllerRow = memo(function ControllerRow({
  controller,
  currentTime,
  selectedPhase,
  onSelectPhase,
  signalDescriptors,
  defaultDescriptor,
}: ControllerRowProps) {
  const cycleDuration = getControllerCycleDuration(controller);
  const activeResult = getActivePhase(controller, currentTime);

  // Determine the primary signal ID (first state of the first phase)
  const primarySignalId = useMemo(() => {
    for (const phase of controller.phases) {
      if (phase.trafficSignalStates.length > 0) {
        return phase.trafficSignalStates[0].trafficSignalId;
      }
    }
    return '';
  }, [controller.phases]);

  // Get current state for the primary signal
  const primaryState = useMemo(() => {
    if (!activeResult) return '';
    const st = activeResult.phase.trafficSignalStates.find(
      (s) => s.trafficSignalId === primarySignalId,
    );
    return st?.state ?? '';
  }, [activeResult, primarySignalId]);

  const descriptor = signalDescriptors.get(primarySignalId) ?? defaultDescriptor;

  return (
    <div className="flex items-stretch h-10 group">
      {/* Left: Signal icon + controller name */}
      <div className="flex items-center gap-1.5 w-[120px] shrink-0 px-2 border-r border-[var(--color-glass-edge)]">
        <SignalIcon2D
          descriptor={descriptor}
          activeState={primaryState}
          width={16}
          height={36}
        />
        <span className="text-[10px] text-[var(--color-text-primary)] truncate font-medium">
          {controller.name}
        </span>
      </div>

      {/* Right: Phase blocks */}
      <div className="flex-1 flex items-stretch px-0.5 gap-[1px]">
        {controller.phases.map((phase, pi) => (
          <PhaseBlock
            key={pi}
            phase={phase}
            totalDuration={cycleDuration}
            isSelected={
              selectedPhase?.controllerId === controller.id &&
              selectedPhase?.phaseIndex === pi
            }
            isActive={activeResult?.index === pi}
            onClick={() =>
              onSelectPhase(
                selectedPhase?.controllerId === controller.id &&
                  selectedPhase?.phaseIndex === pi
                  ? null
                  : { controllerId: controller.id, phaseIndex: pi },
              )
            }
          />
        ))}
        {controller.phases.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[10px] text-[var(--color-text-secondary)] italic">
              No phases
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

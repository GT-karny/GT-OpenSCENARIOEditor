import type { SpeedUnit } from '@osce/shared';

import { useEditorStore } from '../stores/editor-store';

const MPS_TO_KMPH = 3.6;

const SPEED_LABELS: Record<SpeedUnit, string> = {
  mps: 'm/s',
  kmph: 'km/h',
};

/** Convert internal m/s value to display unit */
export function toDisplaySpeed(mps: number, unit: SpeedUnit): number {
  if (unit === 'kmph') return +(mps * MPS_TO_KMPH).toFixed(4);
  return mps;
}

/** Convert display unit value to internal m/s */
export function toInternalSpeed(display: number, unit: SpeedUnit): number {
  if (unit === 'kmph') return +(display / MPS_TO_KMPH).toFixed(6);
  return display;
}

/** Get display label for speed unit */
export function speedUnitLabel(unit: SpeedUnit): string {
  return SPEED_LABELS[unit];
}

/** Hook providing speed unit preference and conversion helpers */
export function useSpeedUnit() {
  const speedUnit = useEditorStore((s) => s.preferences.speedUnit);
  return {
    speedUnit,
    label: speedUnitLabel(speedUnit),
    toDisplay: (mps: number) => toDisplaySpeed(mps, speedUnit),
    toInternal: (display: number) => toInternalSpeed(display, speedUnit),
  };
}

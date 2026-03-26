/**
 * Determine the dominant visual color of a traffic signal phase
 * based on its signal states.
 *
 * Returns inline CSS values (not Tailwind classes) to avoid purge issues.
 */

import type { TrafficSignalState } from '@osce/shared';

export interface PhaseColorResult {
  /** Background color (CSS) */
  bg: string;
  /** Border color (CSS) */
  border: string;
  /** Label text color (CSS) */
  label: string;
}

const COLORS = {
  green: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', label: '#34d399' },
  yellow: { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)', label: '#fbbf24' },
  red: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', label: '#f87171' },
  redGreen: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(16, 185, 129, 0.4)', label: '#f87171' },
  off: { bg: 'rgba(115, 115, 115, 0.1)', border: 'rgba(115, 115, 115, 0.3)', label: '#9ca3af' },
} as const;

/**
 * Analyze all signal states in a phase and return a color theme
 * representing the dominant signal state.
 */
export function phaseBlockColor(states: TrafficSignalState[]): PhaseColorResult {
  if (states.length === 0) return COLORS.off;

  let hasGreen = false;
  let hasYellow = false;
  let hasRed = false;
  let allOff = true;

  for (const st of states) {
    const lower = st.state.toLowerCase().trim();
    if (!lower || lower === 'off' || lower === 'off;off;off') continue;
    allOff = false;

    if (lower.includes(';')) {
      const parts = lower.split(';').map((s) => s.trim());
      // Standard 3-light: index 0=red, 1=yellow, 2=green
      if (parts[0] === 'on') hasRed = true;
      if (parts.length > 1 && parts[1] === 'on') hasYellow = true;
      if (parts.length > 2 && parts[2] === 'on') hasGreen = true;
      // For 1-2 bulb signals, any "on" counts as active
      if (parts.some((p) => p === 'on') && !hasRed && !hasYellow && !hasGreen) {
        hasGreen = true;
      }
    } else {
      if (lower.includes('green') || lower === 'on') hasGreen = true;
      if (lower.includes('yellow')) hasYellow = true;
      if (lower.includes('red')) hasRed = true;
    }
  }

  if (allOff) return COLORS.off;
  if (hasRed && hasGreen) return COLORS.redGreen;
  if (hasGreen) return COLORS.green;
  if (hasYellow) return COLORS.yellow;
  if (hasRed) return COLORS.red;

  return COLORS.off;
}

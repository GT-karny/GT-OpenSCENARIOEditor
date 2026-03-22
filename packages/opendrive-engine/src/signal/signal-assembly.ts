/**
 * Signal Assembly — groups multiple signal heads on a single pole.
 * This is an editor-internal concept; OpenDRIVE represents each head
 * as a separate <signal> element with the same s/t position.
 */

/** Assembly of multiple signal heads on one pole. */
export interface SignalAssembly {
  id: string;
  poleType: 'straight' | 'arm';
  /** Arm length in meters (for arm type, default ~3m). */
  armLength?: number;
  /** Arm angle in radians (auto-computed toward road center). */
  armAngle?: number;
  heads: SignalAssemblyHead[];
}

/** A single signal head within an assembly. */
export interface SignalAssemblyHead {
  /** Corresponds to OdrSignal.id. */
  id: string;
  /** Preset id, e.g. '3-light-vertical'. */
  presetId: string;
  /** Where on the pole this head is mounted. */
  position: 'top' | 'arm' | 'lower';
  /** Height fine-tuning in meters. */
  offsetY?: number;
}

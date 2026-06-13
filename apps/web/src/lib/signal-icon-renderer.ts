/**
 * Thin re-export adapter for the canonical signal icon renderer.
 *
 * The implementation now lives in @osce/opendrive-engine.
 * This module preserves the original module path so SignalIcon2D.tsx requires no edits.
 *
 * BULB_SPACING is now unified with the engine value (0.38, was 0.33).
 * 2D icons will appear slightly more spread — see orchestrator visual verification.
 */

export {
  renderSignalToCanvas,
  getBulbMode,
  BULB_SPACING,
} from '@osce/opendrive-engine';
export type { BulbMode, SignalDescriptor, BulbColor, BulbFaceShape } from '@osce/opendrive-engine';

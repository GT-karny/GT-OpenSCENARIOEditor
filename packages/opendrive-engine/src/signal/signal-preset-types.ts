/**
 * Shared types for signal presets and descriptors.
 *
 * Single source of truth — consumed by both opendrive-engine and 3d-viewer.
 */

// ---------------------------------------------------------------------------
// Bulb primitives
// ---------------------------------------------------------------------------

/** Shape rendered on a bulb face */
export type BulbFaceShape =
  | 'circle'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-up-left'
  | 'arrow-up-right'
  | 'arrow-diagonal-left'
  | 'arrow-diagonal-right'
  | 'arrow-turn-left'
  | 'arrow-turn-right'
  | 'arrow-uturn'
  | 'arrow-complex'
  | 'pedestrian-stop'
  | 'pedestrian-go';

/** Color identity of a single bulb */
export type BulbColor = 'red' | 'yellow' | 'green';

/** Definition of a single bulb in the signal */
export interface BulbDefinition {
  color: BulbColor;
  shape: BulbFaceShape;
}

// ---------------------------------------------------------------------------
// Signal orientation
// ---------------------------------------------------------------------------

export type SignalHeadOrientation = 'vertical' | 'horizontal';

// ---------------------------------------------------------------------------
// Signal descriptor (visual representation of a signal variant)
// ---------------------------------------------------------------------------

/** Visual descriptor for a traffic signal variant */
export interface SignalDescriptor {
  label: string;
  bulbs: BulbDefinition[];
  housing: { width: number; depth: number; height: number };
  bulbRadius: number;
  orientation: SignalHeadOrientation;
}

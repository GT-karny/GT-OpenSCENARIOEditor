/**
 * Shared types for signal presets.
 * Re-exports BulbFaceShape so opendrive-engine does not depend on 3d-viewer.
 */

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

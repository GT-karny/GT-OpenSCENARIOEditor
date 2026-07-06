/**
 * Pure metric computation for batch scenario runs.
 *
 * Given the per-frame object states produced by the esmini engine, derive the
 * safety metrics the batch matrix reports:
 *
 * - `minDistance`  — the smallest center-to-center distance between any pair of
 *   entities across all frames.
 * - `minTtc`       — the smallest time-to-collision over all approaching pairs.
 * - `collision`    — whether any pair came within a bounding-radius threshold.
 *
 * The functions here take a minimal frame shape (position + optional bounding
 * dimensions) so they stay independent of the WASM message protocol and are
 * unit-testable without a worker or WASM runtime. The batch runner is
 * responsible for projecting raw engine frames onto {@link MetricFrame}.
 */

/** A single entity's state within a frame, reduced to what metrics need. */
export interface MetricObject {
  /** Stable identity used to pair the same entity across frames. */
  id: number;
  /** World-space center X (meters). */
  x: number;
  /** World-space center Y (meters). */
  y: number;
  /** Bounding-box length (meters), when the engine reports it. */
  length?: number;
  /** Bounding-box width (meters), when the engine reports it. */
  width?: number;
}

/** A frame reduced to a timestamp and the entities present in it. */
export interface MetricFrame {
  /** Simulation time of the frame (seconds). */
  time: number;
  objects: MetricObject[];
}

export interface BatchMetrics {
  /**
   * Smallest center-to-center distance seen between any entity pair across all
   * frames. `Infinity` when there was never a pair (fewer than two entities).
   */
  minDistance: number;
  /**
   * Smallest time-to-collision over all approaching pairs, in seconds.
   * `Infinity` when no pair ever approached (relative closing speed too low).
   */
  minTtc: number;
  /** Whether any pair came within the collision threshold. */
  collision: boolean;
  /** The collision threshold (meters) used for this computation. */
  collisionThreshold: number;
}

/**
 * Default collision threshold (meters) used when frames carry no bounding
 * dimensions. Roughly the half-length + half-length of two passenger cars,
 * i.e. a coarse proxy for "the bounding boxes have touched".
 */
export const DEFAULT_COLLISION_THRESHOLD_M = 2.0;

/** Below this closing speed (m/s) a pair is treated as not approaching. */
export const MIN_CLOSING_SPEED_MS = 0.1;

/** Euclidean center distance between two objects. */
function distance(a: MetricObject, b: MetricObject): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * Bounding radius of an object: half the diagonal of its footprint when
 * dimensions are known, otherwise `undefined` so callers fall back to the
 * documented default.
 */
function boundingRadius(obj: MetricObject): number | undefined {
  if (obj.length === undefined || obj.width === undefined) return undefined;
  if (obj.length <= 0 && obj.width <= 0) return undefined;
  return Math.hypot(obj.length, obj.width) / 2;
}

/**
 * Collision threshold for a pair: the sum of the two bounding radii when both
 * carry dimensions, else {@link DEFAULT_COLLISION_THRESHOLD_M}. Two entities are
 * considered in contact once their center distance drops below this.
 */
function pairCollisionThreshold(a: MetricObject, b: MetricObject): number {
  const ra = boundingRadius(a);
  const rb = boundingRadius(b);
  if (ra !== undefined && rb !== undefined) return ra + rb;
  return DEFAULT_COLLISION_THRESHOLD_M;
}

/**
 * Compute {@link BatchMetrics} from an ordered stream of frames.
 *
 * TTC for a pair at successive frames is estimated as
 * `(distance - collisionThreshold) / closingSpeed`, where `closingSpeed` is the
 * rate the center distance shrinks between the two frames. Only approaching
 * pairs (closing faster than {@link MIN_CLOSING_SPEED_MS}) contribute; a pair
 * that is stationary or separating yields `Infinity`.
 */
export function computeBatchMetrics(frames: readonly MetricFrame[]): BatchMetrics {
  let minDistance = Infinity;
  let minTtc = Infinity;
  let collision = false;
  // Report the coarsest threshold observed so the UI can label the run.
  let reportedThreshold = DEFAULT_COLLISION_THRESHOLD_M;

  let prev: MetricFrame | undefined;

  for (const frame of frames) {
    const { objects } = frame;

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const a = objects[i];
        const b = objects[j];
        const d = distance(a, b);
        const threshold = pairCollisionThreshold(a, b);
        reportedThreshold = threshold;

        if (d < minDistance) minDistance = d;
        if (d < threshold) collision = true;

        // TTC needs the same pair in the previous frame to estimate closing speed.
        if (prev) {
          const pa = prev.objects.find((o) => o.id === a.id);
          const pb = prev.objects.find((o) => o.id === b.id);
          if (pa && pb) {
            const dt = frame.time - prev.time;
            if (dt > 0) {
              const prevDist = distance(pa, pb);
              const closingSpeed = (prevDist - d) / dt;
              if (closingSpeed > MIN_CLOSING_SPEED_MS) {
                const gap = d - threshold;
                const ttc = gap <= 0 ? 0 : gap / closingSpeed;
                if (ttc < minTtc) minTtc = ttc;
              }
            }
          }
        }
      }
    }

    prev = frame;
  }

  return { minDistance, minTtc, collision, collisionThreshold: reportedThreshold };
}

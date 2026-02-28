import type { SimulationFrame, SimulationObjectState } from '@osce/shared';
import type { osi3 } from '../generated/osi.js';

/**
 * Convert an OSI GroundTruth message to a SimulationFrame.
 * Pure function — no side effects, no state.
 */
export function convertGroundTruth(gt: osi3.IGroundTruth): SimulationFrame {
  const time = convertTimestamp(gt.timestamp);
  const objects = (gt.movingObject ?? []).map(convertMovingObject);
  return { time, objects };
}

/**
 * Convert OSI Timestamp to seconds as a number.
 * timestamp.seconds + nanos / 1e9
 */
function convertTimestamp(ts: osi3.ITimestamp | null | undefined): number {
  if (!ts) return 0;
  const seconds = typeof ts.seconds === 'number' ? ts.seconds : Number(ts.seconds ?? 0);
  const nanos = ts.nanos ?? 0;
  return seconds + nanos / 1e9;
}

/**
 * Convert a single MovingObject to SimulationObjectState.
 */
export function convertMovingObject(mo: osi3.IMovingObject): SimulationObjectState {
  const id = toNumber(mo.id?.value);
  const name = getEntityName(mo);
  const pos = mo.base?.position;
  const ori = mo.base?.orientation;
  const vel = mo.base?.velocity;

  return {
    id,
    name,
    x: pos?.x ?? 0,
    y: pos?.y ?? 0,
    z: pos?.z ?? 0,
    h: ori?.yaw ?? 0,
    p: ori?.pitch ?? 0,
    r: ori?.roll ?? 0,
    speed: computeSpeed(vel),
  };
}

/**
 * Extract entity name from MovingObject's source_reference.
 * Looks for type="net.asam.openscenario" and identifier starting with "entity_name:".
 * Falls back to "object_{id}" if not found.
 */
export function getEntityName(mo: osi3.IMovingObject): string {
  const refs = mo.sourceReference ?? [];
  for (const ref of refs) {
    if (ref.type === 'net.asam.openscenario') {
      const identifiers = ref.identifier ?? [];
      for (const id of identifiers) {
        if (id.startsWith('entity_name:')) {
          return id.substring('entity_name:'.length);
        }
      }
    }
  }
  return `object_${toNumber(mo.id?.value)}`;
}

/**
 * Compute scalar speed from a Vector3d velocity.
 * speed = sqrt(vx² + vy² + vz²)
 */
export function computeSpeed(velocity: osi3.IVector3d | null | undefined): number {
  if (!velocity) return 0;
  const vx = velocity.x ?? 0;
  const vy = velocity.y ?? 0;
  const vz = velocity.z ?? 0;
  return Math.sqrt(vx * vx + vy * vy + vz * vz);
}

/** Convert a possibly-Long value to a number. */
function toNumber(value: number | Long | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

/** Long type from protobufjs (duck-typed to avoid import). */
interface Long {
  toNumber(): number;
}

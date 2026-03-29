/**
 * Re-exports the canonical signal catalog from @osce/opendrive-engine.
 *
 * Existing consumers in this package import from './signal-catalog.js'.
 * This file maintains backwards compatibility while the source of truth
 * lives in opendrive-engine.
 */

export type {
  BulbColor,
  BulbDefinition,
  BulbFaceShape,
  SignalDescriptor,
} from '@osce/opendrive-engine';

export {
  SIGNAL_CATALOG,
  ARROW_SUBTYPE_MAP,
  housingForBulbCount,
  resolveSignalDescriptor,
} from '@osce/opendrive-engine';

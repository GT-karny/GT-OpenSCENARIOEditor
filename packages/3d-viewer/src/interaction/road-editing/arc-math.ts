/**
 * Shared math utilities for automatic arc/line computation during road creation.
 *
 * The single implementation lives in `@osce/opendrive`; this module re-exports it
 * so existing `./arc-math.js` imports and index re-exports keep working.
 */

export { computeAutoArc, computeGeometryEndpoint } from '@osce/opendrive';
export type { AutoArcResult } from '@osce/opendrive';

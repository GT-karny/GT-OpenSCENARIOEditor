/**
 * OpenDRIVE signal `<semantics>` types (t_signals_semantics, OpenDRIVE 1.9).
 *
 * A signal's `<semantics>` block enumerates typed traffic-behavior entries. The
 * XSD (OpenDRIVE_Signal.xsd t_signals_semantics) models it as an xs:sequence of
 * per-kind repeatable elements (speed, lane, priority, …). We flatten those into
 * one ordered {@link OdrSemanticsEntry} array tagged by `kind`; the serializer
 * re-groups them by kind in XSD element order (a schema-valid document is
 * already kind-grouped, so this round-trips losslessly).
 *
 * Enum value spaces are const arrays + welded unions so the parser and the
 * editing UI share one source of truth.
 */

import type { OdrExtra } from './odr-common.js';

// e_signals_semantics_speed
export const ODR_SEMANTICS_SPEED_TYPES = [
  'maximum',
  'maximumEnd',
  'minimum',
  'minimumEnd',
  'recommended',
  'recommendedEnd',
  'zone',
  'zoneEnd',
] as const;
export type OdrSemanticsSpeedType = (typeof ODR_SEMANTICS_SPEED_TYPES)[number];

// e_signals_semantics_lane
export const ODR_SEMANTICS_LANE_TYPES = [
  'noOvertakeCars',
  'noOvertakeCarsEnd',
  'noOvertakeTrucks',
  'noOvertakeTrucksEnd',
  'priorityOverOncoming',
  'roundabout',
  'yieldForOncoming',
  'other',
] as const;
export type OdrSemanticsLaneType = (typeof ODR_SEMANTICS_LANE_TYPES)[number];

// e_signals_semantics_priority
export const ODR_SEMANTICS_PRIORITY_TYPES = [
  '4way',
  'keepClearLine',
  'noParkingLine',
  'noTurnOnRed',
  'priorityRoad',
  'priorityRoadEnd',
  'priorityToTheRightRule',
  'stop',
  'stopLine',
  'turnOnRedAllowed',
  'trafficLight',
  'waitingLine',
  'yield',
] as const;
export type OdrSemanticsPriorityType = (typeof ODR_SEMANTICS_PRIORITY_TYPES)[number];

// e_signals_semantics_supplementaryTime
export const ODR_SEMANTICS_SUPPLEMENTARY_TIME_TYPES = ['day', 'time'] as const;
export type OdrSemanticsSupplementaryTimeType =
  (typeof ODR_SEMANTICS_SUPPLEMENTARY_TIME_TYPES)[number];

// e_signals_semantics_supplementaryDistance
export const ODR_SEMANTICS_SUPPLEMENTARY_DISTANCE_TYPES = ['for', 'in'] as const;
export type OdrSemanticsSupplementaryDistanceType =
  (typeof ODR_SEMANTICS_SUPPLEMENTARY_DISTANCE_TYPES)[number];

// e_signals_semantics_supplementaryEnvironment
export const ODR_SEMANTICS_SUPPLEMENTARY_ENVIRONMENT_TYPES = ['fog', 'rain', 'snow'] as const;
export type OdrSemanticsSupplementaryEnvironmentType =
  (typeof ODR_SEMANTICS_SUPPLEMENTARY_ENVIRONMENT_TYPES)[number];

/**
 * e_personCategory (OpenDRIVE_Signal.xsd) — currently only `pedestrian`, but the
 * `<person><type>` value is kept as a plain string so an unknown/future literal
 * survives round-trip. The const array drives the UI dropdown.
 */
export const ODR_PERSON_CATEGORIES = ['pedestrian'] as const;
export type OdrPersonCategory = (typeof ODR_PERSON_CATEGORIES)[number];

/** e_vehicleCategory (harmonized ASAM OpenX literals). Kept as string for round-trip; array drives the UI. */
export const ODR_VEHICLE_CATEGORIES = [
  'bicycle',
  'car',
  'semiTrailer',
  'trailer',
  'train',
  'tram',
  'van',
  'bus',
  'heavyTruck',
  'microMobilityDevice',
  'motorcycle',
  'other',
  'landVehicle',
  'semiTractor',
  'standupScooter',
  'workMachine',
] as const;
export type OdrVehicleCategory = (typeof ODR_VEHICLE_CATEGORIES)[number];

/**
 * A traffic participant inside a `<prohibited>`/`<supplementaryAllows>`/
 * `<supplementaryProhibits>` entry. `person`/`vehicle` carry a required `<type>`
 * child (category); `animal` is an empty element.
 */
export type OdrSemanticsParticipant =
  | { kind: 'animal'; extra?: OdrExtra }
  | { kind: 'person'; category: string; extra?: OdrExtra }
  | { kind: 'vehicle'; category: string; extra?: OdrExtra };

export interface OdrSemanticsSpeedEntry {
  kind: 'speed';
  /** e_signals_semantics_speed (@type, optional). */
  type?: OdrSemanticsSpeedType;
  /** @value (optional). */
  value?: number;
  /** e_unitSpeed (@unit, optional) — kept as string (m/s, km/h, mph). */
  unit?: string;
  extra?: OdrExtra;
}

export interface OdrSemanticsLaneEntry {
  kind: 'lane';
  type?: OdrSemanticsLaneType;
  extra?: OdrExtra;
}

export interface OdrSemanticsPriorityEntry {
  kind: 'priority';
  type?: OdrSemanticsPriorityType;
  extra?: OdrExtra;
}

export interface OdrSemanticsProhibitedEntry {
  kind: 'prohibited';
  participants: OdrSemanticsParticipant[];
  extra?: OdrExtra;
}

export interface OdrSemanticsWarningEntry {
  kind: 'warning';
  extra?: OdrExtra;
}

export interface OdrSemanticsRoutingEntry {
  kind: 'routing';
  extra?: OdrExtra;
}

export interface OdrSemanticsStreetnameEntry {
  kind: 'streetname';
  extra?: OdrExtra;
}

export interface OdrSemanticsParkingEntry {
  kind: 'parking';
  extra?: OdrExtra;
}

export interface OdrSemanticsTouristEntry {
  kind: 'tourist';
  extra?: OdrExtra;
}

export interface OdrSemanticsSupplementaryTimeEntry {
  kind: 'supplementaryTime';
  type?: OdrSemanticsSupplementaryTimeType;
  value?: number;
  extra?: OdrExtra;
}

export interface OdrSemanticsSupplementaryAllowsEntry {
  kind: 'supplementaryAllows';
  participants: OdrSemanticsParticipant[];
  extra?: OdrExtra;
}

export interface OdrSemanticsSupplementaryProhibitsEntry {
  kind: 'supplementaryProhibits';
  participants: OdrSemanticsParticipant[];
  extra?: OdrExtra;
}

export interface OdrSemanticsSupplementaryDistanceEntry {
  kind: 'supplementaryDistance';
  type?: OdrSemanticsSupplementaryDistanceType;
  value?: number;
  /** e_unitDistance (@unit, optional) — kept as string (m, km, ft, mile). */
  unit?: string;
  extra?: OdrExtra;
}

export interface OdrSemanticsSupplementaryEnvironmentEntry {
  kind: 'supplementaryEnvironment';
  type?: OdrSemanticsSupplementaryEnvironmentType;
  extra?: OdrExtra;
}

export interface OdrSemanticsSupplementaryExplanatoryEntry {
  kind: 'supplementaryExplanatory';
  extra?: OdrExtra;
}

/** Kind-discriminated union covering every `<semantics>` child element. */
export type OdrSemanticsEntry =
  | OdrSemanticsSpeedEntry
  | OdrSemanticsLaneEntry
  | OdrSemanticsPriorityEntry
  | OdrSemanticsProhibitedEntry
  | OdrSemanticsWarningEntry
  | OdrSemanticsRoutingEntry
  | OdrSemanticsStreetnameEntry
  | OdrSemanticsParkingEntry
  | OdrSemanticsTouristEntry
  | OdrSemanticsSupplementaryTimeEntry
  | OdrSemanticsSupplementaryAllowsEntry
  | OdrSemanticsSupplementaryProhibitsEntry
  | OdrSemanticsSupplementaryDistanceEntry
  | OdrSemanticsSupplementaryEnvironmentEntry
  | OdrSemanticsSupplementaryExplanatoryEntry;

export type OdrSemanticsKind = OdrSemanticsEntry['kind'];

/**
 * `<semantics>` child element names in XSD sequence order. The serializer emits
 * entries grouped by kind in this order; participant kinds that take part in the
 * traffic-participant model are excluded (they are children, not top-level).
 */
export const ODR_SEMANTICS_KINDS: readonly OdrSemanticsKind[] = [
  'speed',
  'lane',
  'priority',
  'prohibited',
  'warning',
  'routing',
  'streetname',
  'parking',
  'tourist',
  'supplementaryTime',
  'supplementaryAllows',
  'supplementaryProhibits',
  'supplementaryDistance',
  'supplementaryEnvironment',
  'supplementaryExplanatory',
] as const;

/** Kinds whose entries carry a `participants` list. */
export const ODR_SEMANTICS_PARTICIPANT_KINDS: readonly OdrSemanticsKind[] = [
  'prohibited',
  'supplementaryAllows',
  'supplementaryProhibits',
] as const;

export interface OdrSignalSemantics {
  entries: OdrSemanticsEntry[];
  /** Unmodeled `<semantics>` children (g_additionalData, unknown tags) preserved for round-trip. */
  extra?: OdrExtra;
}

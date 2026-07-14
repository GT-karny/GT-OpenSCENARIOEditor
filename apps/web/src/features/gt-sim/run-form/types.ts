/**
 * Cluster B (run form) — local UI-state types.
 *
 * Literal unions that also appear in the `@osce/esmini` wire contract
 * (`GtSimExecutionParams`) are derived from it via indexed-access types
 * instead of being re-declared, so this file cannot drift from the esmini
 * contract (migration instruction: "esmini側の型を正とする" when overlapping).
 */
import type { GtSimExecutionParams, ManualDriveConfig } from '@osce/esmini';

/** Controller selector value. Not part of the wire contract (UI-only). */
export type ControllerType = 'default' | 'manual' | 'virtual_driver';

export type DriveMode = NonNullable<GtSimExecutionParams['drive_mode']>;
export type LaneChangeTiming = NonNullable<GtSimExecutionParams['route_drive_timing']>;
export type LaneChangeGap = NonNullable<GtSimExecutionParams['route_drive_gap']>;

/** All values that feed `buildRunRequest` (controller + execution). */
export interface RunFormValues {
  // Controller
  controllerType: ControllerType;
  manualDriveConfig: ManualDriveConfig;
  driveMode: DriveMode;
  laneChangeTiming: LaneChangeTiming;
  laneChangeGap: LaneChangeGap;
  // Execution
  hz: number;
  headless: boolean;
  record: boolean;
  noRealtime: boolean;
  timeout: number;
  osiEnabled: boolean;
  osiIp: string;
  autolight: boolean;
  autolightHeadlights: boolean;
  vehiclePhysics: boolean;
  kinematicMode: boolean;
  routeDriveMode: boolean;
  threads: boolean;
  winX: number;
  winY: number;
  winW: number;
  winH: number;
}

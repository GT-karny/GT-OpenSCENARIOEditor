/**
 * Assemble a `POST /api/simulations` request body from run-form state.
 *
 * Ported from the GT_Sim fork's `api/simulationRequest.ts`
 * (`buildSimulationRequest` / `mergeExecution`), but delegates the actual
 * merge-with-defaults to `@osce/esmini`'s `buildGtSimSimulationRequest` /
 * `buildGtSimExecutionParams` instead of re-implementing it — per the
 * migration instructions, when a fork "pure function" duplicates logic that
 * already exists in the esmini adapter layer, the esmini version is
 * authoritative (it also guarantees `execution.headless` is always sent
 * explicitly, defaulting to `true`, which the fork's version did not).
 */
import { buildGtSimSimulationRequest } from '@osce/esmini';
import type {
  ControllerConfig,
  GtSimExecutionOverrides,
  GtSimSimulationRequest,
} from '@osce/esmini';
import type { RunFormValues } from '../types';

export interface BuildRunRequestOptions {
  scenarioId: string;
  projectId?: string;
  controller: ControllerConfig;
  values: RunFormValues;
  paramOverrides?: Record<string, string>;
}

/** Build the `execution` overrides block from run-form values. */
function toExecutionOverrides(values: RunFormValues): GtSimExecutionOverrides {
  return {
    headless: values.headless,
    record: values.record,
    hz: values.hz,
    no_realtime: values.noRealtime,
    timeout: values.timeout,
    osi: { enabled: values.osiEnabled, ip: values.osiIp },
    autolight: values.autolight,
    // F6: only meaningful with AutoLight on; the sub-toggle is hidden otherwise.
    autolight_headlights: values.autolight && values.autolightHeadlights,
    vehicle_physics: values.vehiclePhysics,
    kinematic_mode: values.kinematicMode,
    route_drive_mode: values.routeDriveMode,
    route_drive_timing: values.laneChangeTiming,
    route_drive_gap: values.laneChangeGap,
    threads: values.threads,
    window: { x: values.winX, y: values.winY, w: values.winW, h: values.winH },
    drive_mode: values.driveMode,
  };
}

export function buildRunRequest({
  scenarioId,
  projectId,
  controller,
  values,
  paramOverrides,
}: BuildRunRequestOptions): GtSimSimulationRequest {
  return buildGtSimSimulationRequest({
    scenarioId,
    projectId,
    controller,
    execution: toExecutionOverrides(values),
    paramOverrides,
  });
}

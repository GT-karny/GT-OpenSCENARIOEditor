/**
 * GT_Sim wire <-> editor adapter layer (WP1, migration plan §7 / D7).
 *
 * Wraps the frozen mapping helpers in `gt-sim-status.ts` and adds:
 *  - `adaptJobStatus`: narrows the raw wire `status` string, converts
 *    `progress_pct (0-100)` to `progress (0-1)`, and derives the editor
 *    `SimulationStatus` + waiting/terminal flags in one shot.
 *  - `buildGtSimExecutionParams` / `buildGtSimSimulationRequest`: assemble a
 *    POST /api/simulations body with `execution.headless` ALWAYS sent
 *    explicitly (default `true`). The GT_Sim backend defaults headless to
 *    `false`, so omitting it opens a native OSG window — the unified-UI
 *    contract requires headless unless the user opts into the native window.
 */

import type { EditorSimulationStatus, GtSimJobStatus } from './gt-sim-status.js';
import {
  isGtSimTerminal,
  isGtSimWaiting,
  mapGtSimProgress,
  mapGtSimStatus,
} from './gt-sim-status.js';
import type {
  ControllerConfig,
  GtSimExecutionParams,
  GtSimSimulationRequest,
  GtSimSimulationStatus,
  WindowConfig,
} from './gt-sim-api-types.js';

const GT_SIM_JOB_STATUSES: readonly GtSimJobStatus[] = [
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
  'timeout',
] as const;

/**
 * Narrow the raw wire `status` string to `GtSimJobStatus`. Unknown values fall
 * back to `failed` (a terminal error state) rather than throwing, so a backend
 * that adds a status can never crash the editor.
 */
export function narrowGtSimStatus(status: string): GtSimJobStatus {
  return (GT_SIM_JOB_STATUSES as readonly string[]).includes(status)
    ? (status as GtSimJobStatus)
    : 'failed';
}

/** A GT_Sim job status enriched with editor-facing derived fields. */
export interface AdaptedJobStatus {
  jobId: string;
  scenarioId: string;
  projectId: string | null;
  /** Narrowed raw status. */
  rawStatus: GtSimJobStatus;
  /** Editor-facing status (`idle|running|completed|error`). */
  editorStatus: EditorSimulationStatus;
  /** `progress_pct` mapped to 0-1. */
  progress: number;
  /** True while accepted but not yet producing frames (`queued`). */
  isWaiting: boolean;
  /** True once the job reached a terminal outcome. */
  isTerminal: boolean;
  errorMessage: string | null;
  outputDir: string | null;
  /** The original wire record (unmodified). */
  raw: GtSimSimulationStatus;
}

/** Adapt a raw job-status wire record to `AdaptedJobStatus`. */
export function adaptJobStatus(raw: GtSimSimulationStatus): AdaptedJobStatus {
  const rawStatus = narrowGtSimStatus(raw.status);
  return {
    jobId: raw.job_id,
    scenarioId: raw.scenario_id,
    projectId: raw.project_id,
    rawStatus,
    editorStatus: mapGtSimStatus(rawStatus),
    progress: mapGtSimProgress(raw.progress_pct),
    isWaiting: isGtSimWaiting(rawStatus),
    isTerminal: isGtSimTerminal(rawStatus),
    errorMessage: raw.error_message,
    outputDir: raw.output_dir,
    raw,
  };
}

/** Default native-window geometry (mirrors the fork defaults). */
const DEFAULT_WINDOW: WindowConfig = { x: 60, y: 60, w: 1280, h: 720 };

/**
 * Baseline execution params. `headless: true` and `osi.enabled: true` are the
 * unified-UI defaults (headless run, OSI frames streamed over WS to the
 * editor's 3d-viewer).
 */
export const DEFAULT_GT_SIM_EXECUTION: GtSimExecutionParams = {
  headless: true,
  record: false,
  hz: 100,
  no_realtime: false,
  timeout: 120,
  osi: { enabled: true, ip: '127.0.0.1' },
  autolight: false,
  autolight_headlights: false,
  vehicle_physics: false,
  kinematic_mode: false,
  route_drive_mode: false,
  threads: false,
  window: { ...DEFAULT_WINDOW },
  extra_args: [],
  drive_mode: 'comfort',
};

/** Partial overrides for `buildGtSimExecutionParams`. */
export type GtSimExecutionOverrides = Partial<
  Omit<GtSimExecutionParams, 'osi' | 'window' | 'extra_args'>
> & {
  osi?: Partial<GtSimExecutionParams['osi']>;
  window?: Partial<WindowConfig>;
  extra_args?: string[];
};

/**
 * Build an `execution` block, merging overrides over `DEFAULT_GT_SIM_EXECUTION`.
 * `headless` is guaranteed present in the result (defaults to `true`); pass
 * `{ headless: false }` only for an explicit native-window opt-in.
 */
export function buildGtSimExecutionParams(
  overrides: GtSimExecutionOverrides = {},
): GtSimExecutionParams {
  const { osi, window, extra_args, ...rest } = overrides;
  return {
    ...DEFAULT_GT_SIM_EXECUTION,
    ...rest,
    osi: { ...DEFAULT_GT_SIM_EXECUTION.osi, ...osi },
    window: { ...DEFAULT_GT_SIM_EXECUTION.window, ...window },
    extra_args: extra_args ? [...extra_args] : [],
  };
}

/** Options for `buildGtSimSimulationRequest`. */
export interface BuildGtSimSimulationRequestOptions {
  scenarioId: string;
  projectId?: string;
  controller?: ControllerConfig;
  controllerType?: string;
  execution?: GtSimExecutionOverrides;
  paramOverrides?: Record<string, string>;
}

/**
 * Assemble a `POST /api/simulations` body. Guarantees `execution.headless` is
 * sent explicitly (default `true`).
 */
export function buildGtSimSimulationRequest({
  scenarioId,
  projectId,
  controller,
  controllerType = 'virtual_driver',
  execution,
  paramOverrides,
}: BuildGtSimSimulationRequestOptions): GtSimSimulationRequest {
  const request: GtSimSimulationRequest = {
    scenario_id: scenarioId,
    controller: controller ?? { controller_type: controllerType },
    execution: buildGtSimExecutionParams(execution),
  };
  if (projectId !== undefined) request.project_id = projectId;
  if (paramOverrides !== undefined) request.param_overrides = paramOverrides;
  return request;
}

/**
 * GT_Sim REST API wire types — raw request/response shapes as sent/received by
 * the GT_Sim FastAPI backend.
 *
 * Ported verbatim (as data contracts) from the GT_Sim fork frontend
 * `web/frontend/src/api/client.ts`. Wire field names stay `snake_case` on
 * purpose — these are the un-adapted transport types. The type <-> editor
 * adapter layer (progress/status mapping etc.) lives in `gt-sim-status.ts`
 * (contract) and is implemented in WP1.
 *
 * Naming: type names follow the editor's PascalCase convention. Types whose
 * bare name would collide with `@osce/shared` re-exports in the package barrel
 * (`SimulationRequest`, `SimulationStatus`) or with generic editor concepts
 * (`Project`) carry a `GtSim` prefix. Domain-specific names (Odr*, Vd*,
 * Annotation*, ExecutionDefaults, ...) keep their source names.
 */

// --- OpenDRIVE side-model metadata (plan P9a) ---

export interface OdrAuditWarnings {
  version: { rev_major: number; rev_minor: number };
  unsupported_elements: number;
  unsupported_attributes: number;
  removed16_hits: number;
  entries: string[];
}

export interface OdrUserDataItem {
  owner_path: string;
  context_id: string;
  xml: string;
}

export interface OdrSignalSemantics {
  speeds: Array<{ type: string; value: number; unit: string }>;
  lane_types: string[];
  priority_types: string[];
  prohibited: Array<{ kind: string; category: string }>;
  warning_count: number;
}

export interface OdrSignal {
  road_id: string;
  signal_id: string;
  has_semantics: boolean;
  semantics: OdrSignalSemantics;
  dependencies: Array<{ id: string; type: string }>;
  references: Array<{ element_type: string; element_id: string; type: string }>;
  temporary: boolean;
  invalidated: boolean;
}

export interface OdrJunctionPriority {
  junction_id: string;
  type: string;
  priorities: Array<{ high: string; low: string }>;
}

export interface OdrCrosswalk {
  junction_id: string;
  id: string;
  crossing_road: string;
  road_at_start: string;
  road_at_end: string;
  synth_object_id: number;
}

export interface OdrRailTrackRef {
  id: string;
  s: number;
  dir: string;
}

export interface OdrRailSwitch {
  road_id: string;
  name: string;
  id: string;
  position: string;
  main_track: OdrRailTrackRef;
  side_track: OdrRailTrackRef;
  partner: { name: string; id: string } | null;
}

export interface OdrRailStation {
  id: string;
  name: string;
  type: string;
  platforms: Array<{
    id: string;
    name: string;
    segments: Array<{ road_id: string; s_start: number; s_end: number; side: string }>;
  }>;
}

/** P9b: 1.9 lane layers (P8 shadow storage + process selection-mode latch). */
export interface OdrLaneLayerSection {
  s: number;
  length: number;
  has_length: boolean;
  lane_count: number;
}

export interface OdrLaneLayer {
  /** "permanent" | "temporary" (effective name; never empty). */
  name: string;
  lane_offset_count: number;
  sections: OdrLaneLayerSection[];
}

export interface OdrRoadLaneLayers {
  road_id: string;
  /** Mode resolved at parse time for this road. */
  active_mode: string;
  has_temporary: boolean;
  temp_s_start: number;
  temp_s_end: number;
  layers: OdrLaneLayer[];
}

export interface OdrLaneLayers {
  /** Process-wide GT_ODR_LANE_LAYERS latch: "permanent" | "temporary". */
  mode: string;
  roads: OdrRoadLaneLayers[];
}

/** P9b: virtual-junction (P6) metadata. */
export interface OdrVirtualJunction {
  junction_id: string;
  name: string;
  main_road_id: string;
  main_road_length: number;
  s_start: number;
  s_end: number;
  /** "+" | "-" | "". */
  orientation: string;
  anchor_count: number;
  connection_count: number;
}

export interface OdrMetadata {
  warnings: OdrAuditWarnings;
  user_data: OdrUserDataItem[];
  data_quality: OdrUserDataItem[];
  signals: OdrSignal[];
  junction_priorities: OdrJunctionPriority[];
  crosswalks: OdrCrosswalk[];
  railroad: { switches: OdrRailSwitch[]; stations: OdrRailStation[] };
  lane_layers: OdrLaneLayers;
  virtual_junctions: OdrVirtualJunction[];
}

// --- Scenario metadata ---

export interface ScenarioParam {
  name: string;
  type: string;
  value: string;
}

export interface ScenarioInfo {
  file: string;
  filename: string;
  road_file: string | null;
  entities: Array<{ name: string; model: string | null; controller: string | null }>;
  params: ScenarioParam[];
  has_controller: boolean;
}

/** A road sign placed along the route (OpenDRIVE `signal`/`RM_RoadSign`), as sent by `.../road-geometry`. */
export interface RoadGeometrySign {
  id: number;
  road_id: number;
  x: number;
  y: number;
  z: number;
  h: number;
  s: number;
  t: number;
  name: string;
  orientation: number;
  height: number;
  width: number;
}

/** A stop line's road-surface polyline, as sent by `.../road-geometry`. */
export interface RoadGeometryStopLine {
  road_id: number;
  sign_id: number;
  points: [number, number][];
}

/**
 * GET .../road-geometry response. `signs`/`stop_lines` are optional: the
 * backend omits them for scenarios with no signage/stop-line data, and older
 * responses may not carry them at all.
 */
export interface RoadGeometryResponse {
  boundaries: Array<{ road_id: number; type: string; points: [number, number][] }>;
  signs?: RoadGeometrySign[];
  stop_lines?: RoadGeometryStopLine[];
}

// --- Manual drive / controller config ---

export interface ManualDriveConfig {
  input_type: string;
  physics_type: string;
  ffb_enabled: boolean;
  domain: { lateral: string; longitudinal: string };
  sdl2: {
    device_index: number;
    deadzone: number;
    button_mapping: {
      upshift: number;
      downshift: number;
      override: number;
      indicator_left: number;
      indicator_right: number;
      headlight: number;
      high_beam: number;
      fog_light: number;
      hazard: number;
    };
  };
  keyboard: {
    steer_left: string;
    steer_right: string;
    throttle: string;
    brake: string;
    clutch: string;
    upshift: string;
    downshift: string;
    override_key: string;
    indicator_left: string;
    indicator_right: string;
    headlight: string;
    high_beam: string;
    fog_light: string;
    hazard: string;
    steer_rate: number;
    centering_rate: number;
    pedal_press_rate: number;
    pedal_release_rate: number;
  };
  input_network: { transport_type: string; port: number; level: string };
  physics_network: { transport_type: string; host: string; cmd_port: number; state_port: number };
  ffb: {
    spring_coefficient: number;
    damper_coefficient: number;
    constant_gain: number;
    max_force: number;
  };
}

export interface ManualDrivePreset {
  name: string;
  builtin: boolean;
  config: ManualDriveConfig;
}

/**
 * AutoLight (F6) environment-driven headlight config — the editable keys of
 * GT_esmini/config/auto_light.json. The GET payload also carries "// ..."
 * comment keys (spec docs); those are not modeled here and are preserved
 * server-side.
 */
export interface AutoLightConfig {
  headlight_enabled: boolean;
  headlight_illuminance_lux_threshold: number;
  headlight_sun_elevation_deg: number;
  headlight_use_time_of_day: boolean;
  headlight_dusk_hour: number;
  headlight_dawn_hour: number;
  headlight_tunnel_enabled: boolean;
  highbeam_enabled: boolean;
  highbeam_range_m: number;
  highbeam_range_hysteresis_m: number;
  highbeam_corridor_half_width_m: number;
  highbeam_on_delay_s: number;
  highbeam_off_delay_s: number;
}

export interface ControllerConfig {
  controller_type: string;
  python?: {
    script: string;
    class: string;
    python_home: string;
    trace_enabled: boolean;
    trace_dir: string;
  };
  manual_drive?: ManualDriveConfig;
}

export interface WindowConfig {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ExecutionDefaults {
  hz: number;
  headless: boolean;
  record: boolean;
  no_realtime: boolean;
  timeout: number;
  osi: { enabled: boolean; ip: string };
  autolight: boolean;
  vehicle_physics: boolean;
  kinematic_mode: boolean;
  route_drive_mode: boolean;
  route_drive_timing?: 'late' | 'normal' | 'early';
  route_drive_gap?: 'wide' | 'normal' | 'tight';
  threads: boolean;
  window: WindowConfig;
}

// --- Simulations ---

/** The `execution` block of a simulation request. */
export interface GtSimExecutionParams {
  /**
   * Run without the native OSG window. REQUIRED field.
   *
   * Unified-UI contract: default is `true` (headless; frames stream over WS to
   * the editor's 3d-viewer). Set to `false` only when the user explicitly opts
   * into the native GT_Sim.exe window (settings). The GT_Sim backend default is
   * `false`, so this MUST always be sent explicitly or a native window opens.
   */
  headless: boolean;
  record: boolean;
  hz: number;
  no_realtime: boolean;
  timeout: number;
  osi: { enabled: boolean; ip: string };
  autolight: boolean;
  /** F6: pass --autolight-headlights (env-driven headlights, overrides config master switch). */
  autolight_headlights: boolean;
  vehicle_physics: boolean;
  kinematic_mode: boolean;
  route_drive_mode: boolean;
  route_drive_timing?: 'late' | 'normal' | 'early';
  route_drive_gap?: 'wide' | 'normal' | 'tight';
  threads: boolean;
  window: WindowConfig;
  extra_args: string[];
  drive_mode?: 'comfort' | 'sport';
}

/**
 * POST /api/simulations request body. Named with a `GtSim` prefix to avoid
 * colliding with the editor's `@osce/shared` `SimulationRequest` (which this
 * package re-exports).
 */
export interface GtSimSimulationRequest {
  scenario_id: string;
  project_id?: string;
  controller: ControllerConfig;
  execution: GtSimExecutionParams;
  param_overrides?: Record<string, string>;
}

/**
 * A simulation job record (status). Prefixed to avoid colliding with the
 * editor's `@osce/shared` `SimulationStatus` (a `'idle'|'running'|...` union).
 * The wire `status` field is a raw string; see `GtSimJobStatus` in
 * `gt-sim-status.ts` for the closed value set and editor mapping.
 */
export interface GtSimSimulationStatus {
  job_id: string;
  scenario_id: string;
  project_id: string | null;
  status: string;
  controller_type: string;
  progress_pct: number;
  pid: number | null;
  exit_code: number | null;
  output_dir: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  options: Record<string, unknown>;
}

/** GET /api/simulations response. */
export interface GtSimJobListResponse {
  jobs: GtSimSimulationStatus[];
  total: number;
}

/** DELETE /api/simulations/{jobId} response. */
export interface GtSimCancelResponse {
  job_id: string;
  status: string;
}

/** PUT /api/simulations/{jobId}/drive_mode response. */
export interface GtSimDriveModeResponse {
  job_id: string;
  mode: string;
}

// --- Results ---

export interface ResultFile {
  name: string;
  size: number;
  type: string;
}

export interface GtSimResultMeta {
  job_id: string;
  scenario_id: string;
  files: ResultFile[];
  metrics: Record<string, unknown> | null;
}

// --- Projects (read-only surface; editor's Fastify owns project.json) ---

export interface GtSimProject {
  project_id: string;
  name: string;
  description: string;
  is_builtin: boolean;
  scenario_count: number;
  road_count: number;
  file_count: number;
  created_at: string;
  updated_at: string;
}

export interface GtSimProjectDetail extends GtSimProject {
  root_path: string;
}

export interface GtSimProjectFile {
  path: string;
  name: string;
  type: string;
  size: number;
  modified: string;
  is_dir: boolean;
}

// --- Parameter presets ---

export interface ParameterPreset {
  preset_id: string;
  name: string;
  description?: string;
  values: Record<string, string>;
}

/** PUT/DELETE preset response. */
export interface GtSimStatusResponse {
  status: string;
}

// --- VirtualDriver verification (replay) ---

export interface VdPreviewPoint {
  x: number;
  y: number;
  v: number;
  t: number;
}

/**
 * Mid/long planner output (Phase 2). Optional on the telemetry frame: emitted
 * once A2's VirtualDriverTelemetryJson.cpp serializes the `midlong` section.
 * Until then it is undefined and the v_target chart / maneuver-marker layers
 * degrade gracefully. Keys/shape must match the C++ serializer — this interface
 * is the single frontend reconciliation point.
 */
export type MidLongConstraintKind = 'curve' | 'junction' | 'speed_limit' | 'stop';

export interface MidLongConstraint {
  /** Route s the constraint applies at [m]. */
  s: number;
  /** World position [m]. */
  x: number;
  /** World position [m]. */
  y: number;
  /** Target speed at the constraint [m/s]. */
  v: number;
  kind: MidLongConstraintKind;
}

export interface MidLongProfile {
  /** (s [m], v_max [m/s]) pairs along the route. */
  v_target_profile: [number, number][];
  /** [A2] labelled constraint points (with XY). */
  constraints?: MidLongConstraint[];
  valid: boolean;
}

/**
 * [A3 / Phase 3] Traffic-policy output. Each enabled policy (lead-vehicle /
 * traffic-light / stop-yield sign) emits PolicyConstraints; the mid/long planner
 * folds them into the v_target ceiling. Shape mirrors the C++ serializer
 * (VirtualDriverTelemetryJson.cpp `policy` block).
 */
export type PolicyConstraintKind =
  | 'none'
  | 'stop_at_s'
  | 'max_speed'
  | 'max_speed_to_s'
  | 'yield'
  | 'wait_until';

export interface PolicyConstraint {
  kind: PolicyConstraintKind;
  /** Route s ahead of the ego the constraint applies at/until [m]. */
  s: number;
  /** Speed [m/s] or time [s] depending on kind. */
  value: number;
  /** "lead_vehicle" | "traffic_light" | "stop_sign" | "yield_sign" | ... */
  source: string;
}

export interface TrafficPolicySnapshot {
  valid: boolean;
  constraints: PolicyConstraint[];
}

export interface VdTelemetryFrame {
  sim_time: number;
  ego: {
    x: number;
    y: number;
    z: number;
    h: number;
    speed: number;
    track?: number;
    lane?: number;
    offset?: number;
    s?: number;
  };
  override: { lateral: boolean; longitudinal: boolean };
  driver: {
    throttle: number;
    brake: number;
    steer: number;
    lateral_error: number;
    heading_error: number;
    speed_error: number;
    lookahead: number;
    valid: boolean;
  };
  indicator: { left: boolean; right: boolean };
  preview: { dt: number; valid: boolean; points: VdPreviewPoint[] };
  /** Phase 2+ (optional; see MidLongProfile). */
  midlong?: MidLongProfile;
  /** Phase 3+ (optional; see TrafficPolicySnapshot). */
  policy?: TrafficPolicySnapshot;
}

export interface VerificationRun {
  id: string;
  meta: Record<string, unknown> & { scenario?: string; frames?: number; sim_duration_s?: number };
  has_compare: boolean;
  has_verdict: boolean;
}

export interface BaselinePoint {
  t: number;
  x: number;
  y: number;
  speed: number;
}

export interface VerdictResult {
  event: string;
  status: 'pass' | 'fail' | 'skip';
  detail?: string;
  reason?: string;
  t?: number;
  idx?: number;
}

/** One recorded OSI scene frame (other traffic + signal phases) for replay. */
export interface SceneFrame {
  sim_time: number;
  objects: Record<string, unknown>[];
  traffic_lights: Record<string, unknown>[];
}

export interface VerificationTelemetry {
  id: string;
  meta: Record<string, unknown> & { project_id?: string | null; scenario_file?: string };
  frames: VdTelemetryFrame[];
  scene: SceneFrame[];
  compare: { xy_rmse_m?: number; speed_rmse_mps?: number; xy_max_dev_m?: number } | null;
  verdict: {
    overall?: string;
    summary?: { pass: number; fail: number; skip: number };
    results?: VerdictResult[];
  } | null;
  baseline_track: BaselinePoint[] | null;
}

/** GET /api/verification/runs response. */
export interface VerificationRunListResponse {
  runs: VerificationRun[];
}

// --- VirtualDriver verification (annotation) ---

export type AnnotationLabel = 'pass' | 'fail' | 'needs-discussion';

/** A run from the verification_runs registry, joined with its human annotation. */
export interface AnnotationRun {
  run_id: string;
  source: 'toplevel' | 'batch' | 'gui';
  batch_id: string | null;
  scenario: string | null;
  scenario_stem: string | null;
  project_id: string | null;
  scenario_file: string | null;
  frames: number | null;
  sim_duration_s: number | null;
  /** pass|fail|needs-review|error (auto). */
  verdict_overall: string | null;
  verdict_summary: { pass: number; fail: number; skip: number } | null;
  has_compare: boolean;
  has_verdict: boolean;
  /** Human label. */
  label: AnnotationLabel | null;
  comment: string | null;
  labeled: boolean;
  updated_at: string | null;
}

export interface Annotation {
  run_id: string;
  label: AnnotationLabel;
  comment: string;
  labeler: string;
  scenario?: string | null;
  scenario_stem?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AnnotationInput {
  label: AnnotationLabel;
  comment?: string;
  labeler?: string;
}

export interface MatchResult {
  run_id: string;
  label: AnnotationLabel;
  comment: string;
  score: number;
  reasons: string[];
}

export interface AnnotationRunFilters {
  status?: string;
  batch_id?: string;
  labeled?: boolean;
  source?: string;
}

/** POST /api/verification/match response. */
export interface MatchResultResponse {
  target: { run_id: string; scenario_stem: string | null };
  matches: MatchResult[];
}

/** GET /api/verification/runs2 response. */
export interface AnnotationRunListResponse {
  runs: AnnotationRun[];
}

// --- Config / system ---

/** GET/PUT /api/config/projects-root response. */
export interface GtSimProjectsRootResponse {
  projects_root: string | null;
  effective_dir: string;
  /** Present on GET only. */
  is_custom?: boolean;
}

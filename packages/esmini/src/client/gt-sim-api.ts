/**
 * `GtSimApi` — the frozen signature surface of the GT_Sim REST client
 * (implementation: WP1). Every method's JSDoc names its HTTP method + path.
 *
 * Adoption (see appendix D / migration plan §7): of the 59 functions in the
 * fork's `api/client.ts`, this contract adopts 37 and excludes 22:
 *  - Project-structure WRITES (risk R2 — the editor's Fastify owns
 *    project.json): createProject, updateProject, deleteProject, uploadProject,
 *    uploadProjectFile, deleteProjectFile.
 *  - Project-management shell only (cluster A is not ported; the editor
 *    provides these): getProjectTemplateUrl, openProjectFolder.
 *  - Legacy scenarios API (superseded by project scenarios): getScenarios,
 *    getScenario.
 *  - Unused per appendix D with no ported consumer: getScenarioParams,
 *    getRunDetail, getAnnotation, scanRegistry, getScripts, getControllerPresets,
 *    getControllerConfig, updateControllerConfig, getTimeseries,
 *    saveManualDrivePreset, deleteManualDrivePreset.
 *  - Already covered by the editor's existing 7-fn client: setSimulationSpeed.
 *
 * The base URL is injected into the implementation (constructor), so paths here
 * are backend-relative. `progress_pct`/status are raw wire values — adapt via
 * `gt-sim-status.ts`.
 */

import type {
  AnnotationInput,
  AnnotationRunFilters,
  AnnotationRunListResponse,
  AutoLightConfig,
  ExecutionDefaults,
  GtSimCancelResponse,
  GtSimDriveModeResponse,
  GtSimJobListResponse,
  GtSimProject,
  GtSimProjectDetail,
  GtSimProjectFile,
  GtSimProjectsRootResponse,
  GtSimResultMeta,
  GtSimSimulationRequest,
  GtSimSimulationStatus,
  GtSimStatusResponse,
  ManualDriveConfig,
  ManualDrivePreset,
  MatchResultResponse,
  OdrMetadata,
  ParameterPreset,
  RoadGeometryResponse,
  ScenarioInfo,
  VerificationRunListResponse,
  VerificationTelemetry,
  Annotation,
} from './gt-sim-api-types.js';

export interface GtSimApi {
  // --- Projects (read-only; project writes excluded per risk R2) ---

  /** GET /api/projects */
  getProjects(): Promise<GtSimProject[]>;

  /** GET /api/projects/{projectId} */
  getProject(projectId: string): Promise<GtSimProjectDetail>;

  /** GET /api/projects/{projectId}/files */
  getProjectFiles(projectId: string): Promise<GtSimProjectFile[]>;

  /**
   * GET /api/projects/{projectId}/files/{filePath} — returns the absolute
   * download URL (built from the injected base URL); performs no request.
   */
  downloadProjectFileUrl(projectId: string, filePath: string): string;

  /** GET /api/projects/{projectId}/scenarios */
  getProjectScenarios(projectId: string): Promise<ScenarioInfo[]>;

  // --- Scenario metadata ---

  /** GET /api/projects/{projectId}/scenarios/{scenarioFile}/road-geometry */
  getRoadGeometry(projectId: string, scenarioFile: string): Promise<RoadGeometryResponse>;

  /** GET /api/projects/{projectId}/scenarios/{scenarioFile}/odr-metadata */
  getOdrMetadata(projectId: string, scenarioFile: string): Promise<OdrMetadata>;

  /**
   * GET /api/projects/{projectId}/scenarios/{scenarioFile}/docs
   * Resolves to `null` for 204/404 (no docs).
   */
  getScenarioDocs(projectId: string, scenarioFile: string): Promise<string | null>;

  // --- Parameter presets (GT_Sim owns presets per role split R2) ---

  /** GET /api/projects/{projectId}/scenarios/{scenarioFile}/presets */
  getPresets(projectId: string, scenarioFile: string): Promise<ParameterPreset[]>;

  /** POST /api/projects/{projectId}/scenarios/{scenarioFile}/presets */
  createPreset(
    projectId: string,
    scenarioFile: string,
    name: string,
    values: Record<string, string>,
  ): Promise<ParameterPreset>;

  /** PUT /api/projects/{projectId}/scenarios/{scenarioFile}/presets/{presetId} */
  updatePreset(
    projectId: string,
    scenarioFile: string,
    presetId: string,
    data: { name?: string; values?: Record<string, string> },
  ): Promise<GtSimStatusResponse>;

  /** DELETE /api/projects/{projectId}/scenarios/{scenarioFile}/presets/{presetId} */
  deletePreset(
    projectId: string,
    scenarioFile: string,
    presetId: string,
  ): Promise<GtSimStatusResponse>;

  // --- VirtualDriver verification (replay) ---

  /** GET /api/verification/runs */
  getVerificationRuns(): Promise<VerificationRunListResponse>;

  /** GET /api/verification/runs/{runId}/telemetry */
  getVerificationTelemetry(runId: string): Promise<VerificationTelemetry>;

  /** POST /api/verification/runs/{runId}/baseline-compare */
  runBaselineCompare(runId: string): Promise<Record<string, unknown>>;

  /** POST /api/verification/runs/{runId}/assert */
  runAssertions(runId: string): Promise<Record<string, unknown>>;

  // --- VirtualDriver verification (annotation) ---

  /** GET /api/verification/runs2 */
  getAnnotationRuns(params?: AnnotationRunFilters): Promise<AnnotationRunListResponse>;

  /** POST /api/verification/annotation/{runId} */
  setAnnotation(runId: string, body: AnnotationInput): Promise<Annotation>;

  /** POST /api/verification/match */
  matchAnnotations(runId: string, k?: number): Promise<MatchResultResponse>;

  // --- Execution defaults (GT_Sim config) ---

  /** GET /api/config/execution-defaults */
  getExecutionDefaults(): Promise<ExecutionDefaults>;

  /** PUT /api/config/execution-defaults */
  updateExecutionDefaults(params: ExecutionDefaults): Promise<ExecutionDefaults>;

  // --- Simulations ---

  /** POST /api/simulations */
  createSimulation(req: GtSimSimulationRequest): Promise<GtSimSimulationStatus>;

  /** GET /api/simulations */
  getSimulations(params?: {
    status?: string;
    limit?: number;
    offset?: number;
    projectId?: string;
    scenarioId?: string;
  }): Promise<GtSimJobListResponse>;

  /** GET /api/simulations/{jobId} */
  getSimulation(jobId: string): Promise<GtSimSimulationStatus>;

  /** DELETE /api/simulations/{jobId} */
  cancelSimulation(jobId: string): Promise<GtSimCancelResponse>;

  /** PUT /api/simulations/{jobId}/drive_mode */
  setDriveMode(jobId: string, mode: 'comfort' | 'sport'): Promise<GtSimDriveModeResponse>;

  // --- Results ---

  /** GET /api/results/{jobId} */
  getResultMeta(jobId: string): Promise<GtSimResultMeta>;

  /** GET /api/results/{jobId}/metrics */
  getMetrics(jobId: string): Promise<Record<string, unknown>>;

  // --- Manual drive config (GT_Sim config) ---

  /** GET /api/manual-drive/config */
  getManualDriveConfig(): Promise<ManualDriveConfig>;

  /** PUT /api/manual-drive/config */
  updateManualDriveConfig(config: ManualDriveConfig): Promise<ManualDriveConfig>;

  /** GET /api/manual-drive/presets */
  getManualDrivePresets(): Promise<ManualDrivePreset[]>;

  // --- AutoLight (F6) config ---

  /** GET /api/auto-light/config */
  getAutoLightConfig(): Promise<AutoLightConfig>;

  /** PUT /api/auto-light/config */
  updateAutoLightConfig(config: Partial<AutoLightConfig>): Promise<AutoLightConfig>;

  /** GET /api/auto-light/defaults */
  getAutoLightDefaults(): Promise<AutoLightConfig>;

  // --- Config / system ---

  /** GET /api/config/projects-root */
  getProjectsRoot(): Promise<GtSimProjectsRootResponse>;

  /** PUT /api/config/projects-root */
  setProjectsRoot(projectsRoot: string | null): Promise<GtSimProjectsRootResponse>;

  /** GET /api/config/system */
  getSystemInfo(): Promise<Record<string, unknown>>;
}

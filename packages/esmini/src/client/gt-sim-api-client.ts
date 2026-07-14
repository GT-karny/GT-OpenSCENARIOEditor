/**
 * `GtSimApiClient` — fetch-based implementation of the frozen `GtSimApi`
 * contract (`gt-sim-api.ts`). WP1.
 *
 * Differences from the fork's `api/client.ts`:
 *  - The base URL is INJECTED via the constructor (the fork hard-coded
 *    `BASE = ''` / same-origin). Every path is backend-relative; the client
 *    prefixes the injected absolute base URL.
 *  - Errors surface as `GtSimApiError` (non-2xx) / `GtSimNetworkError`
 *    (transport/timeout), consistent with the rest of `@osce/esmini`.
 *  - Wire types (`snake_case`) come from `gt-sim-api-types.ts`. Status/progress
 *    adaptation is NOT done here — use `gt-sim-status.ts` / `gt-sim-adapters.ts`.
 */

import type {
  Annotation,
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
} from './gt-sim-api-types.js';
import type { GtSimApi } from './gt-sim-api.js';
import { gtSimFetch } from './http-transport.js';

/** Options for `GtSimApiClient`. */
export interface GtSimApiClientOptions {
  /**
   * Absolute REST base URL of the GT_Sim backend, e.g.
   * `http://127.0.0.1:8000`. Trailing slashes are trimmed. REQUIRED —
   * there is no same-origin fallback (unlike the fork).
   */
  baseUrl: string;
  /** Per-request timeout in ms (default 30000). */
  timeout?: number;
  /**
   * `fetch` implementation to use (default: global `fetch`). Injectable for
   * tests / non-browser hosts.
   */
  fetchImpl?: typeof fetch;
}

type FetchOptions = {
  method?: string;
  body?: string;
  contentType?: string;
};

export class GtSimApiClient implements GtSimApi {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: GtSimApiClientOptions) {
    if (!options.baseUrl) {
      throw new Error('GtSimApiClient requires an absolute baseUrl');
    }
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.timeout = options.timeout ?? 30_000;
    // Bind so the global fetch keeps its `this` (undefined receiver otherwise).
    const impl = options.fetchImpl ?? globalThis.fetch;
    this.fetchImpl = impl.bind(globalThis);
  }

  // --- Projects (read-only) ---

  getProjects(): Promise<GtSimProject[]> {
    return this.getJson('/api/projects');
  }

  getProject(projectId: string): Promise<GtSimProjectDetail> {
    return this.getJson(`/api/projects/${enc(projectId)}`);
  }

  getProjectFiles(projectId: string): Promise<GtSimProjectFile[]> {
    return this.getJson(`/api/projects/${enc(projectId)}/files`);
  }

  downloadProjectFileUrl(projectId: string, filePath: string): string {
    // filePath may contain '/' segments; encode each segment, keep separators.
    const encodedPath = filePath
      .split('/')
      .map((seg) => enc(seg))
      .join('/');
    return `${this.baseUrl}/api/projects/${enc(projectId)}/files/${encodedPath}`;
  }

  getProjectScenarios(projectId: string): Promise<ScenarioInfo[]> {
    return this.getJson(`/api/projects/${enc(projectId)}/scenarios`);
  }

  // --- Scenario metadata ---

  getRoadGeometry(projectId: string, scenarioFile: string): Promise<RoadGeometryResponse> {
    return this.getJson(
      `/api/projects/${enc(projectId)}/scenarios/${enc(scenarioFile)}/road-geometry`,
    );
  }

  getOdrMetadata(projectId: string, scenarioFile: string): Promise<OdrMetadata> {
    return this.getJson(
      `/api/projects/${enc(projectId)}/scenarios/${enc(scenarioFile)}/odr-metadata`,
    );
  }

  async getScenarioDocs(projectId: string, scenarioFile: string): Promise<string | null> {
    const path = `/api/projects/${enc(projectId)}/scenarios/${enc(scenarioFile)}/docs`;
    const response = await this.rawFetch('GET', path, { allowStatuses: [204, 404] });
    if (response.status === 204 || response.status === 404) return null;
    const text = await response.text();
    return text || null;
  }

  // --- Parameter presets ---

  getPresets(projectId: string, scenarioFile: string): Promise<ParameterPreset[]> {
    return this.getJson(
      `/api/projects/${enc(projectId)}/scenarios/${enc(scenarioFile)}/presets`,
    );
  }

  createPreset(
    projectId: string,
    scenarioFile: string,
    name: string,
    values: Record<string, string>,
  ): Promise<ParameterPreset> {
    return this.sendJson(
      'POST',
      `/api/projects/${enc(projectId)}/scenarios/${enc(scenarioFile)}/presets`,
      { name, values },
    );
  }

  updatePreset(
    projectId: string,
    scenarioFile: string,
    presetId: string,
    data: { name?: string; values?: Record<string, string> },
  ): Promise<GtSimStatusResponse> {
    return this.sendJson(
      'PUT',
      `/api/projects/${enc(projectId)}/scenarios/${enc(scenarioFile)}/presets/${enc(presetId)}`,
      data,
    );
  }

  deletePreset(
    projectId: string,
    scenarioFile: string,
    presetId: string,
  ): Promise<GtSimStatusResponse> {
    return this.sendJson(
      'DELETE',
      `/api/projects/${enc(projectId)}/scenarios/${enc(scenarioFile)}/presets/${enc(presetId)}`,
    );
  }

  // --- VirtualDriver verification (replay) ---

  getVerificationRuns(): Promise<VerificationRunListResponse> {
    return this.getJson('/api/verification/runs');
  }

  getVerificationTelemetry(runId: string): Promise<VerificationTelemetry> {
    return this.getJson(`/api/verification/runs/${enc(runId)}/telemetry`);
  }

  runBaselineCompare(runId: string): Promise<Record<string, unknown>> {
    return this.sendJson('POST', `/api/verification/runs/${enc(runId)}/baseline-compare`);
  }

  runAssertions(runId: string): Promise<Record<string, unknown>> {
    return this.sendJson('POST', `/api/verification/runs/${enc(runId)}/assert`);
  }

  // --- VirtualDriver verification (annotation) ---

  getAnnotationRuns(params?: AnnotationRunFilters): Promise<AnnotationRunListResponse> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.batch_id) q.set('batch_id', params.batch_id);
    if (params?.source) q.set('source', params.source);
    if (params?.labeled != null) q.set('labeled', String(params.labeled));
    const qs = q.toString();
    return this.getJson(`/api/verification/runs2${qs ? `?${qs}` : ''}`);
  }

  setAnnotation(runId: string, body: AnnotationInput): Promise<Annotation> {
    return this.sendJson('POST', `/api/verification/annotation/${enc(runId)}`, body);
  }

  matchAnnotations(runId: string, k = 5): Promise<MatchResultResponse> {
    return this.sendJson('POST', '/api/verification/match', { run_id: runId, k });
  }

  // --- Execution defaults ---

  getExecutionDefaults(): Promise<ExecutionDefaults> {
    return this.getJson('/api/config/execution-defaults');
  }

  updateExecutionDefaults(params: ExecutionDefaults): Promise<ExecutionDefaults> {
    return this.sendJson('PUT', '/api/config/execution-defaults', params);
  }

  // --- Simulations ---

  createSimulation(req: GtSimSimulationRequest): Promise<GtSimSimulationStatus> {
    return this.sendJson('POST', '/api/simulations', req);
  }

  getSimulations(params?: {
    status?: string;
    limit?: number;
    offset?: number;
    projectId?: string;
    scenarioId?: string;
  }): Promise<GtSimJobListResponse> {
    const q = new URLSearchParams();
    q.set('limit', String(params?.limit ?? 20));
    q.set('offset', String(params?.offset ?? 0));
    if (params?.status) q.set('status', params.status);
    if (params?.projectId) q.set('project_id', params.projectId);
    if (params?.scenarioId) q.set('scenario_id', params.scenarioId);
    return this.getJson(`/api/simulations?${q.toString()}`);
  }

  getSimulation(jobId: string): Promise<GtSimSimulationStatus> {
    return this.getJson(`/api/simulations/${enc(jobId)}`);
  }

  cancelSimulation(jobId: string): Promise<GtSimCancelResponse> {
    return this.sendJson('DELETE', `/api/simulations/${enc(jobId)}`);
  }

  setDriveMode(jobId: string, mode: 'comfort' | 'sport'): Promise<GtSimDriveModeResponse> {
    return this.sendJson('PUT', `/api/simulations/${enc(jobId)}/drive_mode`, { mode });
  }

  // --- Results ---

  getResultMeta(jobId: string): Promise<GtSimResultMeta> {
    return this.getJson(`/api/results/${enc(jobId)}`);
  }

  getMetrics(jobId: string): Promise<Record<string, unknown>> {
    return this.getJson(`/api/results/${enc(jobId)}/metrics`);
  }

  // --- Manual drive config ---

  getManualDriveConfig(): Promise<ManualDriveConfig> {
    return this.getJson('/api/manual-drive/config');
  }

  updateManualDriveConfig(config: ManualDriveConfig): Promise<ManualDriveConfig> {
    return this.sendJson('PUT', '/api/manual-drive/config', config);
  }

  getManualDrivePresets(): Promise<ManualDrivePreset[]> {
    return this.getJson('/api/manual-drive/presets');
  }

  // --- AutoLight (F6) config ---

  getAutoLightConfig(): Promise<AutoLightConfig> {
    return this.getJson('/api/auto-light/config');
  }

  updateAutoLightConfig(config: Partial<AutoLightConfig>): Promise<AutoLightConfig> {
    return this.sendJson('PUT', '/api/auto-light/config', config);
  }

  getAutoLightDefaults(): Promise<AutoLightConfig> {
    return this.getJson('/api/auto-light/defaults');
  }

  // --- Config / system ---

  getProjectsRoot(): Promise<GtSimProjectsRootResponse> {
    return this.getJson('/api/config/projects-root');
  }

  setProjectsRoot(projectsRoot: string | null): Promise<GtSimProjectsRootResponse> {
    return this.sendJson('PUT', '/api/config/projects-root', { projects_root: projectsRoot });
  }

  getSystemInfo(): Promise<Record<string, unknown>> {
    return this.getJson('/api/config/system');
  }

  // --- Internal helpers ---

  private async getJson<T>(path: string): Promise<T> {
    const response = await this.rawFetch('GET', path);
    return response.json() as Promise<T>;
  }

  private async sendJson<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.rawFetch(method, path, {
      body: body === undefined ? undefined : JSON.stringify(body),
      contentType: 'application/json',
    });
    return response.json() as Promise<T>;
  }

  private rawFetch(
    method: string,
    path: string,
    options?: FetchOptions & { allowStatuses?: number[] },
  ): Promise<Response> {
    return gtSimFetch(this.fetchImpl, this.baseUrl, method, path, this.timeout, options);
  }
}

/** encodeURIComponent shorthand. */
function enc(value: string): string {
  return encodeURIComponent(value);
}

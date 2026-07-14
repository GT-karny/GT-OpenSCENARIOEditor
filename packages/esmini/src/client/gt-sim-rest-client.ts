import type {
  GtSimConfig,
  ScenarioUploadResponse,
  CreateSimulationResponse,
  SimulationStatusResponse,
  SimulationResultsResponse,
} from './types.js';
import { gtSimFetch } from './http-transport.js';

/**
 * HTTP client for GT_Sim REST API.
 * Uses Node.js built-in fetch.
 */
export class GtSimRestClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: GtSimConfig) {
    this.baseUrl = config.restBaseUrl.replace(/\/+$/, '');
    this.timeout = config.timeout ?? 30_000;
  }

  /** GET /api/health — Health check. */
  async healthCheck(): Promise<{ status: string }> {
    return this.fetchJson('GET', '/api/health');
  }

  /** POST /api/scenarios/upload — Upload scenario XML, get scenario_id. */
  async uploadScenario(scenarioXml: string): Promise<ScenarioUploadResponse> {
    return this.fetchJson('POST', '/api/scenarios/upload', {
      body: scenarioXml,
      contentType: 'text/xml',
    });
  }

  /** POST /api/simulations — Start simulation with OSI enabled. */
  async createSimulation(scenarioId: string): Promise<CreateSimulationResponse> {
    return this.fetchJson('POST', '/api/simulations', {
      body: JSON.stringify({
        scenario_id: scenarioId,
        execution: { osi: { enabled: true } },
      }),
      contentType: 'application/json',
    });
  }

  /** GET /api/simulations/{jobId} — Get simulation status. */
  async getSimulationStatus(jobId: string): Promise<SimulationStatusResponse> {
    return this.fetchJson('GET', `/api/simulations/${encodeURIComponent(jobId)}`);
  }

  /** DELETE /api/simulations/{jobId} — Cancel/stop simulation. */
  async deleteSimulation(jobId: string): Promise<void> {
    await this.fetchRaw('DELETE', `/api/simulations/${encodeURIComponent(jobId)}`);
  }

  /** PUT /api/simulations/{jobId}/speed — Set simulation speed factor. */
  async setSpeed(jobId: string, speedFactor: number): Promise<void> {
    await this.fetchRaw('PUT', `/api/simulations/${encodeURIComponent(jobId)}/speed`, {
      body: JSON.stringify({ speed_factor: speedFactor }),
      contentType: 'application/json',
    });
  }

  /** GET /api/results/{jobId} — Get simulation results metadata. */
  async getResults(jobId: string): Promise<SimulationResultsResponse> {
    return this.fetchJson('GET', `/api/results/${encodeURIComponent(jobId)}`);
  }

  // --- Internal helpers ---

  private async fetchJson<T>(
    method: string,
    path: string,
    options?: { body?: string; contentType?: string },
  ): Promise<T> {
    const response = await this.fetchRaw(method, path, options);
    return response.json() as Promise<T>;
  }

  private fetchRaw(
    method: string,
    path: string,
    options?: { body?: string; contentType?: string },
  ): Promise<Response> {
    // Resolve the global fetch at call time (tests stub it after construction);
    // bind so it keeps its expected receiver.
    return gtSimFetch(
      globalThis.fetch.bind(globalThis),
      this.baseUrl,
      method,
      path,
      this.timeout,
      options,
    );
  }
}

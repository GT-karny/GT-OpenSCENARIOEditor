import type {
  GtSimConfig,
  ScenarioUploadResponse,
  CreateSimulationResponse,
  SimulationStatusResponse,
  SimulationResultsResponse,
} from './types.js';
import { GtSimApiError, GtSimNetworkError } from '../errors.js';

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

  private async fetchRaw(
    method: string,
    path: string,
    options?: { body?: string; contentType?: string },
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {};
      if (options?.contentType) {
        headers['Content-Type'] = options.contentType;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: options?.body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => undefined);
        throw new GtSimApiError(
          `GT_Sim API error: ${method} ${path} returned ${response.status}`,
          response.status,
          body,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof GtSimApiError) throw error;

      const message =
        error instanceof Error && error.name === 'AbortError'
          ? `GT_Sim API timeout: ${method} ${path} (${this.timeout}ms)`
          : `GT_Sim API network error: ${method} ${path}`;

      throw new GtSimNetworkError(
        message,
        error instanceof Error ? error : undefined,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

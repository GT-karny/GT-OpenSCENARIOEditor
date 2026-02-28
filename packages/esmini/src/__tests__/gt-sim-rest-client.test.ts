import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GtSimRestClient } from '../client/gt-sim-rest-client.js';
import { GtSimApiError, GtSimNetworkError } from '../errors.js';
import type { GtSimConfig } from '../client/types.js';

const config: GtSimConfig = {
  restBaseUrl: 'http://127.0.0.1:8000',
  grpcHost: '127.0.0.1:50051',
  timeout: 5000,
};

function mockFetchResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

describe('GtSimRestClient', () => {
  let client: GtSimRestClient;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new GtSimRestClient(config);
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('uploadScenario', () => {
    it('should POST XML to /api/scenarios/upload', async () => {
      const responseBody = {
        scenario_id: 'tmp_abc123',
        entities: [{ name: 'Ego', model: 'car_white' }],
        road_file: '../xodr/straight.xodr',
        expires_at: '2026-02-28T12:00:00Z',
      };
      fetchSpy.mockResolvedValue(mockFetchResponse(201, responseBody));

      const result = await client.uploadScenario('<OpenSCENARIO/>');

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://127.0.0.1:8000/api/scenarios/upload');
      expect(opts.method).toBe('POST');
      expect(opts.headers['Content-Type']).toBe('text/xml');
      expect(opts.body).toBe('<OpenSCENARIO/>');
      expect(result.scenario_id).toBe('tmp_abc123');
    });

    it('should throw GtSimApiError on 4xx', async () => {
      fetchSpy.mockResolvedValue(mockFetchResponse(400, { error: 'invalid XML' }));

      await expect(client.uploadScenario('bad xml')).rejects.toThrow(GtSimApiError);
    });
  });

  describe('createSimulation', () => {
    it('should POST to /api/simulations with scenario_id and osi enabled', async () => {
      const responseBody = { job_id: 'job_001', status: 'starting' };
      fetchSpy.mockResolvedValue(mockFetchResponse(200, responseBody));

      const result = await client.createSimulation('tmp_abc123');

      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://127.0.0.1:8000/api/simulations');
      expect(opts.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body.scenario_id).toBe('tmp_abc123');
      expect(body.execution.osi.enabled).toBe(true);
      expect(result.job_id).toBe('job_001');
    });
  });

  describe('getSimulationStatus', () => {
    it('should GET /api/simulations/{jobId}', async () => {
      const responseBody = { job_id: 'job_001', status: 'running', progress: 0.5 };
      fetchSpy.mockResolvedValue(mockFetchResponse(200, responseBody));

      const result = await client.getSimulationStatus('job_001');

      const [url] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://127.0.0.1:8000/api/simulations/job_001');
      expect(result.status).toBe('running');
    });
  });

  describe('deleteSimulation', () => {
    it('should DELETE /api/simulations/{jobId}', async () => {
      fetchSpy.mockResolvedValue(mockFetchResponse(204, null));

      await client.deleteSimulation('job_001');

      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://127.0.0.1:8000/api/simulations/job_001');
      expect(opts.method).toBe('DELETE');
    });
  });

  describe('setSpeed', () => {
    it('should PUT /api/simulations/{jobId}/speed', async () => {
      fetchSpy.mockResolvedValue(mockFetchResponse(200, { speed_factor: 2.0 }));

      await client.setSpeed('job_001', 2.0);

      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://127.0.0.1:8000/api/simulations/job_001/speed');
      expect(opts.method).toBe('PUT');
      const body = JSON.parse(opts.body);
      expect(body.speed_factor).toBe(2.0);
    });
  });

  describe('error handling', () => {
    it('should throw GtSimApiError on 500', async () => {
      fetchSpy.mockResolvedValue(mockFetchResponse(500, { error: 'internal' }));

      await expect(client.healthCheck()).rejects.toThrow(GtSimApiError);
      try {
        await client.healthCheck();
      } catch (err) {
        expect(err).toBeInstanceOf(GtSimApiError);
        expect((err as GtSimApiError).statusCode).toBe(500);
      }
    });

    it('should throw GtSimNetworkError on fetch failure', async () => {
      fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(client.healthCheck()).rejects.toThrow(GtSimNetworkError);
    });

    it('should throw GtSimNetworkError on timeout', async () => {
      fetchSpy.mockImplementation(
        () =>
          new Promise((_, reject) => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            setTimeout(() => reject(err), 10);
          }),
      );

      await expect(client.healthCheck()).rejects.toThrow(GtSimNetworkError);
    });
  });
});

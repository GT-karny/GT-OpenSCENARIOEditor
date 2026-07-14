import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GtSimApiClient } from '../client/gt-sim-api-client.js';
import { GtSimApiError, GtSimNetworkError } from '../errors.js';

const BASE = 'http://127.0.0.1:8123';

function mockResponse(status: number, body: unknown, text?: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(text ?? JSON.stringify(body)),
  } as Response;
}

describe('GtSimApiClient', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let client: GtSimApiClient;

  beforeEach(() => {
    fetchSpy = vi.fn();
    client = new GtSimApiClient({
      baseUrl: `${BASE}/`, // trailing slash must be trimmed
      timeout: 5000,
      fetchImpl: fetchSpy as unknown as typeof fetch,
    });
  });

  it('requires a baseUrl', () => {
    expect(() => new GtSimApiClient({ baseUrl: '' })).toThrow(/baseUrl/);
  });

  describe('URL construction (injected absolute base)', () => {
    it('GET /api/projects', async () => {
      fetchSpy.mockResolvedValue(mockResponse(200, []));
      await client.getProjects();
      expect(fetchSpy.mock.calls[0][0]).toBe(`${BASE}/api/projects`);
      expect(fetchSpy.mock.calls[0][1].method).toBe('GET');
    });

    it('encodes path parameters', async () => {
      fetchSpy.mockResolvedValue(mockResponse(200, []));
      await client.getPresets('prj 1', 'scn/a.xosc');
      expect(fetchSpy.mock.calls[0][0]).toBe(
        `${BASE}/api/projects/prj%201/scenarios/scn%2Fa.xosc/presets`,
      );
    });

    it('builds absolute download URLs without fetching', () => {
      const url = client.downloadProjectFileUrl('prj1', 'sub dir/file.xosc');
      expect(url).toBe(`${BASE}/api/projects/prj1/files/sub%20dir/file.xosc`);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('getSimulations builds the query string', async () => {
      fetchSpy.mockResolvedValue(mockResponse(200, { jobs: [], total: 0 }));
      await client.getSimulations({
        status: 'running',
        limit: 5,
        offset: 10,
        projectId: 'p1',
        scenarioId: 's1',
      });
      const url = new URL(fetchSpy.mock.calls[0][0] as string);
      expect(url.pathname).toBe('/api/simulations');
      expect(url.searchParams.get('limit')).toBe('5');
      expect(url.searchParams.get('offset')).toBe('10');
      expect(url.searchParams.get('status')).toBe('running');
      expect(url.searchParams.get('project_id')).toBe('p1');
      expect(url.searchParams.get('scenario_id')).toBe('s1');
    });

    it('getSimulations defaults limit/offset', async () => {
      fetchSpy.mockResolvedValue(mockResponse(200, { jobs: [], total: 0 }));
      await client.getSimulations();
      const url = new URL(fetchSpy.mock.calls[0][0] as string);
      expect(url.searchParams.get('limit')).toBe('20');
      expect(url.searchParams.get('offset')).toBe('0');
      expect(url.searchParams.has('status')).toBe(false);
    });

    it('getAnnotationRuns serializes filters including labeled=false', async () => {
      fetchSpy.mockResolvedValue(mockResponse(200, { runs: [] }));
      await client.getAnnotationRuns({ status: 'ok', labeled: false });
      const url = new URL(fetchSpy.mock.calls[0][0] as string);
      expect(url.pathname).toBe('/api/verification/runs2');
      expect(url.searchParams.get('status')).toBe('ok');
      expect(url.searchParams.get('labeled')).toBe('false');
    });
  });

  describe('request bodies and methods', () => {
    it('createSimulation POSTs the request body as JSON', async () => {
      fetchSpy.mockResolvedValue(mockResponse(200, { job_id: 'j1', status: 'queued' }));
      const req = {
        scenario_id: 's1',
        controller: { controller_type: 'virtual_driver' },
        execution: { headless: true } as never,
      };
      await client.createSimulation(req as never);
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe(`${BASE}/api/simulations`);
      expect(opts.method).toBe('POST');
      expect(opts.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(opts.body).execution.headless).toBe(true);
    });

    it('cancelSimulation DELETEs', async () => {
      fetchSpy.mockResolvedValue(mockResponse(200, { job_id: 'j1', status: 'cancelled' }));
      const res = await client.cancelSimulation('j1');
      expect(fetchSpy.mock.calls[0][0]).toBe(`${BASE}/api/simulations/j1`);
      expect(fetchSpy.mock.calls[0][1].method).toBe('DELETE');
      expect(res.status).toBe('cancelled');
    });

    it('setDriveMode PUTs the mode', async () => {
      fetchSpy.mockResolvedValue(mockResponse(200, { job_id: 'j1', mode: 'sport' }));
      await client.setDriveMode('j1', 'sport');
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe(`${BASE}/api/simulations/j1/drive_mode`);
      expect(opts.method).toBe('PUT');
      expect(JSON.parse(opts.body)).toEqual({ mode: 'sport' });
    });

    it('setProjectsRoot PUTs snake_case body (null allowed)', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse(200, { projects_root: null, effective_dir: '/x' }),
      );
      await client.setProjectsRoot(null);
      const [, opts] = fetchSpy.mock.calls[0];
      expect(JSON.parse(opts.body)).toEqual({ projects_root: null });
    });

    it('matchAnnotations defaults k=5', async () => {
      fetchSpy.mockResolvedValue(mockResponse(200, { target: {}, matches: [] }));
      await client.matchAnnotations('run1');
      expect(JSON.parse(fetchSpy.mock.calls[0][1].body)).toEqual({ run_id: 'run1', k: 5 });
    });

    it('createPreset POSTs name+values', async () => {
      fetchSpy.mockResolvedValue(mockResponse(200, { preset_id: 'p', name: 'n', values: {} }));
      await client.createPreset('prj', 'scn', 'fast', { speed: '30' });
      expect(JSON.parse(fetchSpy.mock.calls[0][1].body)).toEqual({
        name: 'fast',
        values: { speed: '30' },
      });
    });
  });

  describe('getScenarioDocs', () => {
    it('returns text on 200', async () => {
      fetchSpy.mockResolvedValue(mockResponse(200, null, '# docs'));
      expect(await client.getScenarioDocs('p', 's')).toBe('# docs');
    });

    it('returns null on 204/404 and empty body', async () => {
      fetchSpy.mockResolvedValue(mockResponse(204, null, ''));
      expect(await client.getScenarioDocs('p', 's')).toBeNull();
      fetchSpy.mockResolvedValue(mockResponse(404, null, ''));
      expect(await client.getScenarioDocs('p', 's')).toBeNull();
      fetchSpy.mockResolvedValue(mockResponse(200, null, ''));
      expect(await client.getScenarioDocs('p', 's')).toBeNull();
    });

    it('still throws on 500', async () => {
      fetchSpy.mockResolvedValue(mockResponse(500, { error: 'boom' }));
      await expect(client.getScenarioDocs('p', 's')).rejects.toThrow(GtSimApiError);
    });
  });

  describe('error handling', () => {
    it('throws GtSimApiError with status code and body on non-2xx', async () => {
      fetchSpy.mockResolvedValue(mockResponse(422, { detail: 'bad' }));
      try {
        await client.getProjects();
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(GtSimApiError);
        expect((err as GtSimApiError).statusCode).toBe(422);
        expect((err as GtSimApiError).responseBody).toContain('bad');
      }
    });

    it('throws GtSimNetworkError on transport failure', async () => {
      fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'));
      await expect(client.getProjects()).rejects.toThrow(GtSimNetworkError);
    });

    it('throws GtSimNetworkError on abort/timeout', async () => {
      fetchSpy.mockImplementation(() => {
        const err = new Error('aborted');
        err.name = 'AbortError';
        return Promise.reject(err);
      });
      await expect(client.getProjects()).rejects.toThrow(/timeout/);
    });
  });
});

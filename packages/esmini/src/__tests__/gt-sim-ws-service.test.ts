import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GtSimWsService } from '../service/gt-sim-ws-service.js';
import { SimulationStateError } from '../errors.js';
import type { GtSimApi } from '../client/gt-sim-api.js';
import type { GtSimSimulationStatus } from '../client/gt-sim-api-types.js';
import type { SimulationFrame, SimulationResult } from '@osce/shared';
import { FakeWebSocket, fakeWsFactory, lastFakeWs } from './helpers/fake-websocket.js';

const WS_BASE = 'ws://127.0.0.1:8000';

function makeJob(overrides: Partial<GtSimSimulationStatus> = {}): GtSimSimulationStatus {
  return {
    job_id: 'job_1',
    scenario_id: 'scn_1',
    project_id: 'prj_1',
    status: 'running',
    controller_type: 'virtual_driver',
    progress_pct: 0,
    pid: 1,
    exit_code: null,
    output_dir: null,
    started_at: null,
    completed_at: null,
    error_message: null,
    options: {},
    ...overrides,
  };
}

function makeApi(overrides: Partial<GtSimApi> = {}): GtSimApi {
  return {
    createSimulation: vi.fn().mockResolvedValue(makeJob({ status: 'queued' })),
    getSimulation: vi.fn().mockResolvedValue(makeJob({ status: 'running' })),
    cancelSimulation: vi.fn().mockResolvedValue({ job_id: 'job_1', status: 'cancelled' }),
    ...overrides,
  } as unknown as GtSimApi;
}

function gtMessage(simTime: number) {
  return {
    type: 'ground_truth',
    sim_time: simTime,
    objects: [
      {
        id: 0,
        name: 'Ego',
        x: 1,
        y: 2,
        z: 0,
        h: 0,
        speed: 10,
        head_light: 'on',
        indicator: 'left',
        brake_light: 'off',
        obj_type: 'vehicle',
        vehicle_class: 'medium_car',
        length: 4,
        width: 2,
      },
    ],
    traffic_lights: [
      { id: 5, x: 0, y: 0, z: 0, h: 0, color: 'red', mode: 'constant', icon: 0 },
    ],
  };
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('GtSimWsService', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function makeService(api: GtSimApi, extra: Partial<ConstructorParameters<typeof GtSimWsService>[0]> = {}) {
    return new GtSimWsService({
      api,
      wsBaseUrl: WS_BASE,
      projectId: 'prj_1',
      scenarioId: 'scn_1',
      webSocketFactory: fakeWsFactory,
      pollIntervalMs: 60_000, // effectively off unless a test advances timers
      ...extra,
    });
  }

  it('startSimulation creates the job with explicit headless:true and osi enabled', async () => {
    const api = makeApi();
    const service = makeService(api);
    await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });

    expect(api.createSimulation).toHaveBeenCalledOnce();
    const body = (api.createSimulation as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.scenario_id).toBe('scn_1');
    expect(body.project_id).toBe('prj_1');
    expect(body.execution.headless).toBe(true);
    expect(body.execution.osi.enabled).toBe(true);
    expect(service.getStatus()).toBe('running');
    expect(service.jobId).toBe('job_1');
    expect(lastFakeWs().url).toBe(`${WS_BASE}/ws/osi/job_1`);
    service.dispose();
  });

  it('honours a native-window opt-in but still forces OSI on', async () => {
    const api = makeApi();
    const service = makeService(api, { execution: { headless: false, osi: { enabled: false } } });
    await service.startSimulation({ scenarioXml: '' });
    const body = (api.createSimulation as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.execution.headless).toBe(false);
    expect(body.execution.osi.enabled).toBe(true);
    service.dispose();
  });

  it('uses buildRequest when provided', async () => {
    const api = makeApi();
    const buildRequest = vi.fn().mockReturnValue({
      scenario_id: 'custom',
      controller: { controller_type: 'manual_drive' },
      execution: { headless: true, osi: { enabled: false, ip: '1.2.3.4' } },
    });
    const service = makeService(api, { buildRequest, scenarioId: undefined });
    const editorRequest = { scenarioXml: '<x/>' };
    await service.startSimulation(editorRequest);
    expect(buildRequest).toHaveBeenCalledWith(editorRequest);
    const body = (api.createSimulation as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.scenario_id).toBe('custom');
    expect(body.execution.osi.enabled).toBe(true); // forced
    expect(body.execution.osi.ip).toBe('1.2.3.4');
    service.dispose();
  });

  it('rejects start without scenarioId or buildRequest', async () => {
    const service = makeService(makeApi(), { scenarioId: undefined });
    await expect(service.startSimulation({ scenarioXml: '' })).rejects.toThrow(
      SimulationStateError,
    );
    expect(service.getStatus()).toBe('idle');
  });

  it('stays idle and rethrows when job creation fails', async () => {
    const api = makeApi({
      createSimulation: vi.fn().mockRejectedValue(new Error('backend down')),
    } as Partial<GtSimApi>);
    const service = makeService(api);
    await expect(service.startSimulation({ scenarioXml: '' })).rejects.toThrow('backend down');
    expect(service.getStatus()).toBe('idle');
    expect(service.getResult()).toBeNull();
  });

  it('start while running stops the current run first (WASM-service parity)', async () => {
    const api = makeApi({
      createSimulation: vi
        .fn()
        .mockResolvedValueOnce(makeJob({ job_id: 'job_1', status: 'queued' }))
        .mockResolvedValueOnce(makeJob({ job_id: 'job_2', status: 'queued' })),
    } as Partial<GtSimApi>);
    const service = makeService(api);
    const results: SimulationResult[] = [];
    service.onComplete((r) => results.push(r));

    await service.startSimulation({ scenarioXml: '' });
    const firstWs = lastFakeWs();
    firstWs.open();

    await service.startSimulation({ scenarioXml: '' });

    // First run was cancelled + completed; second run is live on a new socket.
    expect(api.cancelSimulation).toHaveBeenCalledWith('job_1');
    expect(results).toHaveLength(1);
    expect(firstWs.closed).toBe(true);
    expect(service.getStatus()).toBe('running');
    expect(service.jobId).toBe('job_2');
    expect(lastFakeWs().url).toBe(`${WS_BASE}/ws/osi/job_2`);
    service.dispose();
  });

  it('converts ground_truth frames (with lights) and dispatches onFrame', async () => {
    const service = makeService(makeApi());
    const frames: SimulationFrame[] = [];
    service.onFrame((f) => frames.push(f));
    await service.startSimulation({ scenarioXml: '' });

    lastFakeWs().open();
    lastFakeWs().message(gtMessage(0.1));

    expect(frames).toHaveLength(1);
    expect(frames[0].time).toBe(0.1);
    expect(frames[0].objects[0].name).toBe('Ego');
    expect(frames[0].vehicleLightStates?.[0]).toEqual({
      name: 'Ego',
      indicator: 'left',
      headLight: true,
      highBeam: false,
      brakeLight: false,
    });
    expect(frames[0].trafficLightStates).toEqual([{ signalId: 5, state: 'red' }]);
    service.dispose();
  });

  it('holds the last traffic-light state across frames that omit it', async () => {
    const service = makeService(makeApi());
    const frames: SimulationFrame[] = [];
    service.onFrame((f) => frames.push(f));
    await service.startSimulation({ scenarioXml: '' });
    lastFakeWs().open();

    lastFakeWs().message(gtMessage(0.1));
    const noLights = { ...gtMessage(0.2) } as Record<string, unknown>;
    delete noLights.traffic_lights;
    lastFakeWs().message(noLights);

    expect(frames[1].trafficLightStates).toEqual([{ signalId: 5, state: 'red' }]);
    service.dispose();
  });

  it('completes via the WS end sentinel + final REST status', async () => {
    const api = makeApi({
      getSimulation: vi.fn().mockResolvedValue(makeJob({ status: 'completed' })),
    } as Partial<GtSimApi>);
    const service = makeService(api);
    const results: SimulationResult[] = [];
    service.onComplete((r) => results.push(r));
    await service.startSimulation({ scenarioXml: '' });

    lastFakeWs().open();
    lastFakeWs().message(gtMessage(1.0));
    lastFakeWs().message(gtMessage(3.0));
    lastFakeWs().message({ type: 'end' });
    await flush();

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('completed');
    expect(results[0].frames).toHaveLength(2);
    expect(results[0].duration).toBeCloseTo(2.0, 10);
    expect(service.getStatus()).toBe('completed');
    service.dispose();
  });

  it('maps terminal failure statuses to error with error_message preserved', async () => {
    const api = makeApi({
      getSimulation: vi
        .fn()
        .mockResolvedValue(makeJob({ status: 'failed', error_message: 'crashed' })),
    } as Partial<GtSimApi>);
    const service = makeService(api);
    const results: SimulationResult[] = [];
    service.onComplete((r) => results.push(r));
    await service.startSimulation({ scenarioXml: '' });

    lastFakeWs().open();
    lastFakeWs().message({ type: 'end' });
    await flush();

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('error');
    expect(results[0].error).toBe('crashed');
    service.dispose();
  });

  it('detects terminal status via REST polling when the WS never delivers', async () => {
    vi.useFakeTimers();
    const api = makeApi({
      getSimulation: vi.fn().mockResolvedValue(makeJob({ status: 'timeout' })),
    } as Partial<GtSimApi>);
    const service = makeService(api, { pollIntervalMs: 100 });
    const results: SimulationResult[] = [];
    service.onComplete((r) => results.push(r));
    await service.startSimulation({ scenarioXml: '' });

    await vi.advanceTimersByTimeAsync(120);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('error');
    expect(service.getStatus()).toBe('error');
    service.dispose();
  });

  it('dispatches onComplete exactly once when both channels detect the end', async () => {
    vi.useFakeTimers();
    const api = makeApi({
      getSimulation: vi.fn().mockResolvedValue(makeJob({ status: 'completed' })),
    } as Partial<GtSimApi>);
    const service = makeService(api, { pollIntervalMs: 100 });
    const results: SimulationResult[] = [];
    service.onComplete((r) => results.push(r));
    await service.startSimulation({ scenarioXml: '' });

    lastFakeWs().open();
    lastFakeWs().message({ type: 'end' });
    await vi.advanceTimersByTimeAsync(500);

    expect(results).toHaveLength(1);
    service.dispose();
  });

  it('forwards WS stream errors to onError subscribers', async () => {
    const service = makeService(makeApi());
    const errors: Error[] = [];
    service.onError((e) => errors.push(e));
    await service.startSimulation({ scenarioXml: '' });

    lastFakeWs().open();
    lastFakeWs().message({ error: 'stream exploded' });

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('stream exploded');
    service.dispose();
  });

  it('stopSimulation cancels the job and completes', async () => {
    const api = makeApi();
    const service = makeService(api);
    const results: SimulationResult[] = [];
    service.onComplete((r) => results.push(r));
    await service.startSimulation({ scenarioXml: '' });
    lastFakeWs().open();

    await service.stopSimulation();

    expect(api.cancelSimulation).toHaveBeenCalledWith('job_1');
    expect(service.getStatus()).toBe('completed');
    expect(results).toHaveLength(1);
    expect(lastFakeWs().closed).toBe(true);
    service.dispose();
  });

  it('stopSimulation is a no-op when nothing is running (WASM-service parity)', async () => {
    const api = makeApi();
    const service = makeService(api);
    const results: SimulationResult[] = [];
    service.onComplete((r) => results.push(r));
    await expect(service.stopSimulation()).resolves.toBeUndefined();
    expect(api.cancelSimulation).not.toHaveBeenCalled();
    expect(results).toHaveLength(0);
    expect(service.getStatus()).toBe('idle');
  });

  it('reconnects the OSI stream after a transient WS drop while the job is live', async () => {
    vi.useFakeTimers();
    const api = makeApi(); // getSimulation stays 'running' (non-terminal)
    const service = makeService(api);
    const frames: SimulationFrame[] = [];
    const results: SimulationResult[] = [];
    service.onFrame((f) => frames.push(f));
    service.onComplete((r) => results.push(r));
    await service.startSimulation({ scenarioXml: '' });

    const firstWs = lastFakeWs();
    firstWs.open();
    firstWs.message(gtMessage(0.1));

    // Transient drop (no 'end' sentinel): must not finish the run...
    firstWs.serverClose();
    await vi.advanceTimersByTimeAsync(600); // > initial 500ms backoff
    expect(results).toHaveLength(0);
    expect(service.getStatus()).toBe('running');

    // ...and a new socket resumes the frame flow.
    const secondWs = lastFakeWs();
    expect(secondWs).not.toBe(firstWs);
    secondWs.open();
    secondWs.message(gtMessage(0.2));
    expect(frames).toHaveLength(2);
    service.dispose();
  });

  it('unsubscribe functions work', async () => {
    const service = makeService(makeApi());
    const frames: SimulationFrame[] = [];
    const unsub = service.onFrame((f) => frames.push(f));
    await service.startSimulation({ scenarioXml: '' });
    lastFakeWs().open();
    unsub();
    lastFakeWs().message(gtMessage(0.1));
    expect(frames).toHaveLength(0);
    service.dispose();
  });
});

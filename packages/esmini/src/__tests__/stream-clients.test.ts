import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GtSimOsiClient } from '../streaming/osi-client.js';
import { GtSimVdClient } from '../streaming/vd-client.js';
import { GtSimSvClient } from '../streaming/sv-client.js';
import { GtSimPresetsClient } from '../streaming/presets-client.js';
import { GtSimInputClient } from '../streaming/input-client.js';
import { GT_SIM_INPUT_BUTTONS, GT_SIM_INPUT_SEND_HZ } from '../streaming/types.js';
import { FakeWebSocket, fakeWsFactory, lastFakeWs } from './helpers/fake-websocket.js';

const WS_BASE = 'ws://127.0.0.1:8000';
const opts = { wsBaseUrl: WS_BASE, webSocketFactory: fakeWsFactory };

beforeEach(() => {
  FakeWebSocket.instances = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GtSimOsiClient', () => {
  it('connects to /ws/osi/{jobId} on the injected host', () => {
    const client = new GtSimOsiClient({ ...opts, jobId: 'job1' });
    client.connect();
    expect(lastFakeWs().url).toBe(`${WS_BASE}/ws/osi/job1`);
  });

  it('routes ground_truth and host_vehicle_data to their subscriptions', () => {
    const client = new GtSimOsiClient({ ...opts, jobId: 'job1' });
    const gts: unknown[] = [];
    const hvds: unknown[] = [];
    const all: unknown[] = [];
    client.onGroundTruth((m) => gts.push(m));
    client.onHostVehicleData((m) => hvds.push(m));
    client.onMessage((m) => all.push(m));
    client.connect();
    lastFakeWs().open();

    lastFakeWs().message({ type: 'ground_truth', sim_time: 1, objects: [] });
    lastFakeWs().message({ type: 'host_vehicle_data', sim_time: 1, speed: 5 });
    lastFakeWs().message({ type: 'something_else' });

    expect(gts).toHaveLength(1);
    expect(hvds).toHaveLength(1);
    expect(all).toHaveLength(2);
  });
});

describe('GtSimVdClient', () => {
  it('connects to /ws/vd/{jobId} and emits telemetry frames only', () => {
    const client = new GtSimVdClient({ ...opts, jobId: 'j2' });
    const frames: unknown[] = [];
    client.onTelemetry((f) => frames.push(f));
    client.connect();
    expect(lastFakeWs().url).toBe(`${WS_BASE}/ws/vd/j2`);
    lastFakeWs().open();
    lastFakeWs().message({ type: 'virtual_driver_telemetry', sim_time: 0.1 });
    lastFakeWs().message({ type: 'ground_truth', sim_time: 0.1, objects: [] });
    expect(frames).toHaveLength(1);
  });
});

describe('GtSimSvClient', () => {
  it('connects to /ws/sv/{jobId} and emits scenario_variables', () => {
    const client = new GtSimSvClient({ ...opts, jobId: 'j3' });
    const snaps: unknown[] = [];
    client.onVariables((m) => snaps.push(m));
    client.connect();
    expect(lastFakeWs().url).toBe(`${WS_BASE}/ws/sv/j3`);
    lastFakeWs().open();
    lastFakeWs().message({ type: 'scenario_variables', variables: { a: 1 }, sim_time: 2 });
    expect(snaps).toEqual([{ type: 'scenario_variables', variables: { a: 1 }, sim_time: 2 }]);
  });
});

describe('GtSimPresetsClient', () => {
  it('connects to /ws/presets/{projectId} and emits presets_changed', () => {
    const client = new GtSimPresetsClient({ ...opts, projectId: 'prj' });
    const notices: unknown[] = [];
    client.onPresetsChanged((m) => notices.push(m));
    client.connect();
    expect(lastFakeWs().url).toBe(`${WS_BASE}/ws/presets/prj`);
    lastFakeWs().open();
    lastFakeWs().message({ type: 'presets_changed', scenario_stem: 'cutin' });
    expect(notices).toEqual([{ type: 'presets_changed', scenario_stem: 'cutin' }]);
  });
});

describe('GtSimInputClient', () => {
  it('connects to /ws/input/{jobId} and sends commands', () => {
    const client = new GtSimInputClient({ ...opts, jobId: 'j4' });
    client.connect();
    expect(lastFakeWs().url).toBe(`${WS_BASE}/ws/input/j4`);
    lastFakeWs().open();
    client.sendCommand({
      steering: -0.25,
      throttle: 0.5,
      brake: 0,
      buttons: GT_SIM_INPUT_BUTTONS.OVERRIDE | GT_SIM_INPUT_BUTTONS.INDICATOR_LEFT,
    });
    expect(JSON.parse(lastFakeWs().sent[0])).toEqual({
      steering: -0.25,
      throttle: 0.5,
      brake: 0,
      buttons: 3,
    });
  });

  it('startSending polls getCommand at GT_SIM_INPUT_SEND_HZ', () => {
    vi.useFakeTimers();
    const client = new GtSimInputClient({ ...opts, jobId: 'j4' });
    client.connect();
    lastFakeWs().open();

    let steering = 0;
    const stop = client.startSending(() => ({ steering, throttle: 0, brake: 0, buttons: 0 }));

    vi.advanceTimersByTime(1000 / GT_SIM_INPUT_SEND_HZ + 1);
    steering = 1;
    vi.advanceTimersByTime(1000 / GT_SIM_INPUT_SEND_HZ);
    expect(lastFakeWs().sent).toHaveLength(2);
    expect(JSON.parse(lastFakeWs().sent[0]).steering).toBe(0);
    expect(JSON.parse(lastFakeWs().sent[1]).steering).toBe(1);

    stop();
    vi.advanceTimersByTime(1000);
    expect(lastFakeWs().sent).toHaveLength(2);
  });

  it('close() stops the periodic sender', () => {
    vi.useFakeTimers();
    const client = new GtSimInputClient({ ...opts, jobId: 'j4' });
    client.connect();
    lastFakeWs().open();
    client.startSending(() => ({ steering: 0, throttle: 0, brake: 0, buttons: 0 }));
    client.close();
    vi.advanceTimersByTime(1000);
    expect(lastFakeWs().sent).toHaveLength(0);
  });
});

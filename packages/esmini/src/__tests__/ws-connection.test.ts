import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GtSimWsConnection } from '../streaming/ws-connection.js';
import {
  gtSimOsiWsUrl,
  gtSimVdWsUrl,
  gtSimSvWsUrl,
  gtSimPresetsWsUrl,
  gtSimInputWsUrl,
} from '../streaming/types.js';
import { FakeWebSocket, fakeWsFactory, lastFakeWs } from './helpers/fake-websocket.js';

const factory = fakeWsFactory;
const lastWs = lastFakeWs;

beforeEach(() => {
  FakeWebSocket.instances = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe('gtSim*WsUrl builders (frozen contract)', () => {
  it('builds injected-host URLs with encoded ids', () => {
    expect(gtSimOsiWsUrl('ws://10.0.0.2:8000', 'job 1')).toBe('ws://10.0.0.2:8000/ws/osi/job%201');
    expect(gtSimVdWsUrl('ws://h:1/', 'j')).toBe('ws://h:1/ws/vd/j');
    expect(gtSimSvWsUrl('ws://h:1', 'j')).toBe('ws://h:1/ws/sv/j');
    expect(gtSimPresetsWsUrl('ws://h:1', 'p')).toBe('ws://h:1/ws/presets/p');
    expect(gtSimInputWsUrl('ws://h:1', 'j')).toBe('ws://h:1/ws/input/j');
  });
});

describe('GtSimWsConnection', () => {
  it('transitions connecting -> connected on open', () => {
    const conn = new GtSimWsConnection({ url: 'ws://h/ws/osi/j', webSocketFactory: factory });
    const states: string[] = [];
    conn.onStateChange((s) => states.push(s));

    conn.connect();
    expect(conn.state).toBe('connecting');
    lastWs().open();
    expect(conn.state).toBe('connected');
    expect(states).toEqual(['connecting', 'connected']);
  });

  it('dispatches parsed JSON messages to subscribers', () => {
    const conn = new GtSimWsConnection({ url: 'ws://h/x', webSocketFactory: factory });
    const received: unknown[] = [];
    conn.onMessage((m) => received.push(m));
    conn.connect();
    lastWs().open();
    lastWs().message({ type: 'ground_truth', sim_time: 1.5, objects: [] });
    expect(received).toEqual([{ type: 'ground_truth', sim_time: 1.5, objects: [] }]);
  });

  it('ignores malformed frames', () => {
    const conn = new GtSimWsConnection({ url: 'ws://h/x', webSocketFactory: factory });
    const received: unknown[] = [];
    conn.onMessage((m) => received.push(m));
    conn.connect();
    lastWs().open();
    lastWs().message('not json{');
    expect(received).toEqual([]);
    expect(conn.state).toBe('connected');
  });

  it('handles the end sentinel: disconnected, socket closed, no message dispatch', () => {
    const conn = new GtSimWsConnection({ url: 'ws://h/x', webSocketFactory: factory });
    const received: unknown[] = [];
    conn.onMessage((m) => received.push(m));
    conn.connect();
    const ws = lastWs();
    ws.open();
    ws.message({ type: 'end' });
    expect(conn.state).toBe('disconnected');
    expect(ws.closed).toBe(true);
    expect(received).toEqual([]);
  });

  it('handles stream-level error envelopes: error state + onError', () => {
    const conn = new GtSimWsConnection({ url: 'ws://h/x', webSocketFactory: factory });
    const errors: Error[] = [];
    conn.onError((e) => errors.push(e));
    conn.connect();
    lastWs().open();
    lastWs().message({ error: 'job not found' });
    expect(conn.state).toBe('error');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('job not found');
  });

  it('reports transport errors via onError', () => {
    const conn = new GtSimWsConnection({ url: 'ws://h/x', webSocketFactory: factory });
    const errors: Error[] = [];
    conn.onError((e) => errors.push(e));
    conn.connect();
    lastWs().fail();
    expect(conn.state).toBe('error');
    expect(errors).toHaveLength(1);
  });

  it('close() disconnects and never reconnects', () => {
    const conn = new GtSimWsConnection({
      url: 'ws://h/x',
      webSocketFactory: factory,
      autoReconnect: true,
    });
    conn.connect();
    lastWs().open();
    conn.close();
    expect(conn.state).toBe('disconnected');
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it('does not reconnect by default on unexpected close', () => {
    const conn = new GtSimWsConnection({ url: 'ws://h/x', webSocketFactory: factory });
    conn.connect();
    lastWs().open();
    lastWs().serverClose();
    expect(conn.state).toBe('disconnected');
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it('auto-reconnects with backoff when enabled', () => {
    vi.useFakeTimers();
    const conn = new GtSimWsConnection({
      url: 'ws://h/x',
      webSocketFactory: factory,
      autoReconnect: true,
      reconnectDelayMs: 100,
    });
    conn.connect();
    lastWs().open();
    lastWs().serverClose();
    expect(conn.state).toBe('connecting');
    expect(FakeWebSocket.instances).toHaveLength(1);

    vi.advanceTimersByTime(100);
    expect(FakeWebSocket.instances).toHaveLength(2);
    lastWs().open();
    expect(conn.state).toBe('connected');

    // Second drop backs off exponentially (attempt counter reset on open)
    lastWs().serverClose();
    vi.advanceTimersByTime(100);
    expect(FakeWebSocket.instances).toHaveLength(3);
  });

  it('does not reconnect after a backend end even with autoReconnect', () => {
    vi.useFakeTimers();
    const conn = new GtSimWsConnection({
      url: 'ws://h/x',
      webSocketFactory: factory,
      autoReconnect: true,
      reconnectDelayMs: 10,
    });
    conn.connect();
    lastWs().open();
    lastWs().message({ type: 'end' });
    vi.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(conn.state).toBe('disconnected');
  });

  it('connect() during a reconnect backoff cancels the pending timer (no double socket)', () => {
    vi.useFakeTimers();
    const conn = new GtSimWsConnection({
      url: 'ws://h/x',
      webSocketFactory: factory,
      autoReconnect: true,
      reconnectDelayMs: 100,
    });
    conn.connect();
    lastWs().open();
    lastWs().serverClose(); // schedules reconnect in 100ms (backoff)
    expect(FakeWebSocket.instances).toHaveLength(1);

    conn.connect(); // explicit reconnect while the timer is pending
    expect(FakeWebSocket.instances).toHaveLength(2);

    // The stale timer must not fire a third socket.
    vi.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(conn.state).toBe('connecting');
  });

  it('send() forwards strings and JSON-stringifies objects while connected', () => {
    const conn = new GtSimWsConnection({ url: 'ws://h/x', webSocketFactory: factory });
    conn.connect();
    conn.send({ dropped: true }); // not connected yet -> no-op
    lastWs().open();
    conn.send('raw');
    conn.send({ steering: 0.5 });
    expect(lastWs().sent).toEqual(['raw', '{"steering":0.5}']);
  });

  it('unsubscribe functions detach listeners', () => {
    const conn = new GtSimWsConnection({ url: 'ws://h/x', webSocketFactory: factory });
    const received: unknown[] = [];
    const unsub = conn.onMessage((m) => received.push(m));
    conn.connect();
    lastWs().open();
    unsub();
    lastWs().message({ type: 'x' });
    expect(received).toEqual([]);
  });
});

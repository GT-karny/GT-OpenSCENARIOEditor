/**
 * Live VirtualDriver telemetry subscription (`/ws/vd/{jobId}`).
 *
 * Rewritten from the fork's `hooks/useVdStream.ts`, which wrapped the fork's
 * own `useWebSocketStream` (same-origin `window.location.host`, not usable in
 * the editor's Electron/renderer setup). This version wraps `GtSimVdClient`
 * from `@osce/esmini` (host injected via `useGtSimWsBaseUrl()`, per
 * `features/gt-sim/lib/README.md`). The emitted `VdTelemetryFrame` shape is
 * identical to the fork's, so the same overlay/chart components drive both
 * live and recorded replay.
 */
import { useEffect, useRef, useState } from 'react';
import { GtSimVdClient } from '@osce/esmini';
import type { GtSimWsConnectionState, VdTelemetryFrame } from '@osce/esmini';
import { useGtSimWsBaseUrl } from '../../lib';

export type VdConnectionStatus = GtSimWsConnectionState;

interface VdStreamResult {
  status: VdConnectionStatus;
  /** Latest telemetry frame (throttled for rendering). */
  frame: VdTelemetryFrame | null;
  /** Rolling history of received frames (for time-series charts). */
  history: VdTelemetryFrame[];
  frameCount: number;
}

const THROTTLE_MS = 50; // ~20 Hz render cap
const MAX_HISTORY = 2000; // ~100 s @ 20 Hz

export function useVdStream(jobId: string | null): VdStreamResult {
  const wsBaseUrl = useGtSimWsBaseUrl();
  const [frame, setFrame] = useState<VdTelemetryFrame | null>(null);
  const [history, setHistory] = useState<VdTelemetryFrame[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  const [status, setStatus] = useState<VdConnectionStatus>('disconnected');
  const lastRenderRef = useRef(0);
  const historyRef = useRef<VdTelemetryFrame[]>([]);

  useEffect(() => {
    historyRef.current = [];
    lastRenderRef.current = 0;
    setFrame(null);
    setHistory([]);
    setFrameCount(0);

    if (!wsBaseUrl || !jobId) {
      setStatus('disconnected');
      return;
    }

    const client = new GtSimVdClient({ wsBaseUrl, jobId });
    setStatus(client.state);
    const unsubState = client.onStateChange(setStatus);
    const unsubTelemetry = client.onTelemetry((tel) => {
      historyRef.current.push(tel);
      if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
      setFrameCount((c) => c + 1);

      const now = performance.now();
      if (now - lastRenderRef.current >= THROTTLE_MS) {
        setFrame(tel);
        setHistory(historyRef.current.slice());
        lastRenderRef.current = now;
      }
    });
    client.connect();

    return () => {
      unsubState();
      unsubTelemetry();
      client.dispose();
    };
  }, [wsBaseUrl, jobId]);

  return { status, frame, history, frameCount };
}

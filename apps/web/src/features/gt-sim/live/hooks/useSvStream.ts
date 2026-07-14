/**
 * `useSvStream` — React wrapper around `@osce/esmini`'s `GtSimSvClient`
 * (`/ws/sv/{jobId}`, scenario-variables snapshots).
 *
 * Rewritten from the fork's `hooks/useSvStream.ts` (raw `WebSocket` via the
 * not-ported `useWebSocketStream`). Same 10Hz throttle behavior.
 */
import { useEffect, useRef, useState } from 'react';
import { GtSimSvClient } from '@osce/esmini';
import type { GtSimWsConnectionState } from '@osce/esmini';
import { useGtSimWsBaseUrl } from '../../lib';

export type SvConnectionStatus = GtSimWsConnectionState;

interface SvStreamResult {
  status: SvConnectionStatus;
  variables: Record<string, unknown>;
  simTime: number;
}

const THROTTLE_MS = 100; // 10 Hz max

export function useSvStream(jobId: string | null): SvStreamResult {
  const wsBaseUrl = useGtSimWsBaseUrl();
  const [status, setStatus] = useState<SvConnectionStatus>('disconnected');
  const [variables, setVariables] = useState<Record<string, unknown>>({});
  const [simTime, setSimTime] = useState(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    setVariables({});
    setSimTime(0);
    lastUpdateRef.current = 0;

    if (!jobId || !wsBaseUrl) {
      setStatus('disconnected');
      return;
    }

    const client = new GtSimSvClient({ wsBaseUrl, jobId });
    const offState = client.onStateChange(setStatus);
    const offVars = client.onVariables((msg) => {
      const now = performance.now();
      if (now - lastUpdateRef.current >= THROTTLE_MS) {
        setVariables(msg.variables ?? {});
        setSimTime(msg.sim_time ?? 0);
        lastUpdateRef.current = now;
      }
    });
    client.connect();

    return () => {
      offState();
      offVars();
      client.dispose();
    };
  }, [jobId, wsBaseUrl]);

  return { status, variables, simTime };
}

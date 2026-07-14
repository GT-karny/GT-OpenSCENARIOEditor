/**
 * Watch `/ws/presets/{projectId}` for external preset-file changes.
 *
 * Ported from the GT_Sim fork's `hooks/usePresetWatcher.ts`, which opened a
 * raw `WebSocket` against `window.location.host` with hand-rolled
 * reconnect/backoff. This version uses the `@osce/esmini` `GtSimPresetsClient`
 * (host injected via `useGtSimWsBaseUrl()`, built-in `autoReconnect`) instead
 * of re-implementing the transport.
 *
 * `wsConnected` is exposed so the caller (`ParameterPanel`) can fall back to
 * polling the presets query when the stream is unavailable (design
 * instruction #5: presets WS must degrade gracefully, not crash).
 */
import { useEffect, useRef, useState } from 'react';
import { GtSimPresetsClient } from '@osce/esmini';
import { useGtSimWsBaseUrl } from '../../lib';

interface UsePresetWatcherOptions {
  projectId: string;
  scenarioFile: string;
}

interface UsePresetWatcherResult {
  /** True once an external preset change notice has arrived (unread). */
  externalChangePending: boolean;
  /** True while the presets WS stream is connected. */
  wsConnected: boolean;
  /** Acknowledge the pending change (call after reloading). */
  clearPending: () => void;
}

function scenarioStem(scenarioFile: string): string {
  if (!scenarioFile) return '';
  const base = scenarioFile.split(/[\\/]/).pop() ?? scenarioFile;
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(0, dot) : base;
}

export function usePresetWatcher({
  projectId,
  scenarioFile,
}: UsePresetWatcherOptions): UsePresetWatcherResult {
  const wsBaseUrl = useGtSimWsBaseUrl();
  const [externalChangePending, setExternalChangePending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Read inside the message handler without retriggering the connect effect.
  const stemRef = useRef(scenarioStem(scenarioFile));
  useEffect(() => {
    stemRef.current = scenarioStem(scenarioFile);
  }, [scenarioFile]);

  useEffect(() => {
    setWsConnected(false);
    if (!wsBaseUrl || !projectId) return;

    const client = new GtSimPresetsClient({ wsBaseUrl, projectId, autoReconnect: true });
    const offState = client.onStateChange((state) => setWsConnected(state === 'connected'));
    const offMessage = client.onPresetsChanged((msg) => {
      if (msg.scenario_stem && msg.scenario_stem !== stemRef.current) {
        // Change targets a different scenario in this project.
        return;
      }
      setExternalChangePending(true);
    });
    // Swallow stream-level errors — connection-state tracking above already
    // reflects the disconnect; the caller's polling fallback takes over.
    const offError = client.onError(() => setWsConnected(false));
    client.connect();

    return () => {
      offState();
      offMessage();
      offError();
      client.dispose();
    };
  }, [wsBaseUrl, projectId]);

  return {
    externalChangePending,
    wsConnected,
    clearPending: () => setExternalChangePending(false),
  };
}

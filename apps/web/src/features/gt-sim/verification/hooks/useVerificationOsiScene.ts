/**
 * Minimal OSI GroundTruth subscription for `LiveVdPanel`'s scene overlay
 * (other traffic + signal phases), scoped to what the VD verification
 * cluster needs: `objects` + `trafficLights` fed into `scene-view-adapter`.
 *
 * Cluster E (`features/gt-sim/live/`) owns the canonical `useOsiStream` (full
 * rAF-coalesced live-rendering hook with host-vehicle-data + frame counters,
 * ported from the fork's `hooks/useOsiStream.ts`). This cluster must not
 * import `../live/*` (see `scene-view-adapter.tsx`), so this is a
 * deliberately smaller, independent subscription built directly on
 * `GtSimOsiClient` (`@osce/esmini`) rather than a copy of that hook's
 * internals.
 *
 * TODO(integration): once cluster E lands, trunk may choose to consolidate
 * this with `useOsiStream` — the wire contract (`GtSimOsiObject` /
 * `GtSimOsiTrafficLight`) is already shared, so no data-shape change needed.
 */
import { useEffect, useRef, useState } from 'react';
import { GtSimOsiClient } from '@osce/esmini';
import type { GtSimOsiObject, GtSimOsiTrafficLight, GtSimWsConnectionState } from '@osce/esmini';
import { useGtSimWsBaseUrl } from '../../lib';

export type OsiSceneStatus = GtSimWsConnectionState;

interface VerificationOsiSceneResult {
  status: OsiSceneStatus;
  objects: GtSimOsiObject[];
  trafficLights: GtSimOsiTrafficLight[];
}

const EMPTY_OBJECTS: GtSimOsiObject[] = [];
const EMPTY_LIGHTS: GtSimOsiTrafficLight[] = [];

export function useVerificationOsiScene(jobId: string | null): VerificationOsiSceneResult {
  const wsBaseUrl = useGtSimWsBaseUrl();
  const [status, setStatus] = useState<OsiSceneStatus>('disconnected');
  const [objects, setObjects] = useState<GtSimOsiObject[]>(EMPTY_OBJECTS);
  const [trafficLights, setTrafficLights] = useState<GtSimOsiTrafficLight[]>(EMPTY_LIGHTS);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ objects: GtSimOsiObject[]; trafficLights: GtSimOsiTrafficLight[] | null } | null>(
    null,
  );

  useEffect(() => {
    setObjects(EMPTY_OBJECTS);
    setTrafficLights(EMPTY_LIGHTS);
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingRef.current = null;

    if (!wsBaseUrl || !jobId) {
      setStatus('disconnected');
      return;
    }

    const client = new GtSimOsiClient({ wsBaseUrl, jobId });
    setStatus(client.state);
    const unsubState = client.onStateChange(setStatus);

    const flush = () => {
      rafRef.current = null;
      const p = pendingRef.current;
      if (!p) return;
      pendingRef.current = null;
      setObjects(p.objects);
      // Only replace lights when the frame actually carried them, so
      // scenarios that briefly omit the field don't flicker the overlay off.
      if (p.trafficLights !== null) setTrafficLights(p.trafficLights);
    };

    const unsubGt = client.onGroundTruth((msg) => {
      pendingRef.current = {
        objects: msg.objects ?? [],
        trafficLights: msg.traffic_lights ?? null,
      };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(flush);
      }
    });
    client.connect();

    return () => {
      unsubState();
      unsubGt();
      client.dispose();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [wsBaseUrl, jobId]);

  return { status, objects, trafficLights };
}

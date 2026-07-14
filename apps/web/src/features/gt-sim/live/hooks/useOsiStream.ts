/**
 * `useOsiStream` — React wrapper around `@osce/esmini`'s `GtSimOsiClient`
 * (`/ws/osi/{jobId}`).
 *
 * Rewritten from the fork's `hooks/useOsiStream.ts`, which built its own raw
 * `WebSocket` via the (not-ported, per the trunk brief) `useWebSocketStream`
 * hook. Behavior is preserved: rAF-coalesced GroundTruth updates (GT can
 * arrive faster than the display refresh rate) and a 10Hz throttle on
 * HostVehicleData updates. `GtSimWsConnectionState` is structurally identical
 * to the fork's `WebSocketConnectionStatus` (`connecting|connected|
 * disconnected|error`), so `OsiConnectionStatus` is a direct alias.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { GtSimOsiClient } from '@osce/esmini';
import type { GtSimOsiObject, GtSimOsiTrafficLight, GtSimWsConnectionState } from '@osce/esmini';
import { useGtSimWsBaseUrl } from '../../lib';

export type OsiObject = GtSimOsiObject;
export type TrafficLight = GtSimOsiTrafficLight;

export interface HvdData {
  sim_time: number;
  throttle: number;
  brake: number;
  steering_angle: number;
  gear: number;
  rpm: number;
  torque: number;
  speed: number;
}

export type OsiConnectionStatus = GtSimWsConnectionState;

interface OsiStreamResult {
  status: OsiConnectionStatus;
  objects: OsiObject[];
  simTime: number;
  hvdData: HvdData | null;
  trafficLights: TrafficLight[];
  frameCount: number;
}

const HVD_THROTTLE_MS = 100; // 10Hz max for HVD updates

/** Subscribes to the OSI GroundTruth + HostVehicleData stream for `jobId`. */
export function useOsiStream(jobId: string | null): OsiStreamResult {
  const wsBaseUrl = useGtSimWsBaseUrl();
  const [status, setStatus] = useState<OsiConnectionStatus>('disconnected');
  const [objects, setObjects] = useState<OsiObject[]>([]);
  const [simTime, setSimTime] = useState(0);
  const [hvdData, setHvdData] = useState<HvdData | null>(null);
  const [trafficLights, setTrafficLights] = useState<TrafficLight[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  const lastHvdUpdateRef = useRef(0);

  // rAF coalescing: GroundTruth can arrive at up to ~100Hz, but the DOM can
  // only paint at the display refresh rate. Buffer the latest frame and flush
  // at most once per animation frame so React commits <= refresh rate instead
  // of once per incoming message.
  const pendingGtRef = useRef<{
    objects: OsiObject[];
    simTime: number;
    frames: number;
    trafficLights: TrafficLight[] | null;
  } | null>(null);
  const recvCountRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const flushGt = useCallback(() => {
    rafRef.current = null;
    const p = pendingGtRef.current;
    if (!p) return;
    pendingGtRef.current = null;
    setObjects(p.objects);
    setSimTime(p.simTime);
    setFrameCount(p.frames);
    // Only replace lights when the frame actually carried them, so scenarios
    // that briefly omit the field don't flicker the overlay off.
    if (p.trafficLights !== null) setTrafficLights(p.trafficLights);
  }, []);

  useEffect(() => {
    // Reset visible state for the new target (jobId or backend endpoint change).
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    recvCountRef.current = 0;
    pendingGtRef.current = null;
    lastHvdUpdateRef.current = 0;
    setObjects([]);
    setSimTime(0);
    setHvdData(null);
    setTrafficLights([]);
    setFrameCount(0);

    if (!jobId || !wsBaseUrl) {
      setStatus('disconnected');
      return;
    }

    const client = new GtSimOsiClient({ wsBaseUrl, jobId });
    const offState = client.onStateChange(setStatus);
    const offGt = client.onGroundTruth((msg) => {
      recvCountRef.current += 1;
      pendingGtRef.current = {
        objects: msg.objects ?? [],
        simTime: msg.sim_time ?? 0,
        frames: recvCountRef.current,
        trafficLights: msg.traffic_lights ?? null,
      };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(flushGt);
      }
    });
    const offHvd = client.onHostVehicleData((msg) => {
      const now = performance.now();
      if (now - lastHvdUpdateRef.current >= HVD_THROTTLE_MS) {
        setHvdData({
          sim_time: msg.sim_time,
          throttle: msg.throttle,
          brake: msg.brake,
          steering_angle: msg.steering_angle,
          gear: msg.gear,
          rpm: msg.rpm,
          torque: msg.torque,
          speed: msg.speed,
        });
        lastHvdUpdateRef.current = now;
      }
    });
    client.connect();

    return () => {
      offState();
      offGt();
      offHvd();
      client.dispose();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [jobId, wsBaseUrl, flushGt]);

  return { status, objects, simTime, hvdData, trafficLights, frameCount };
}

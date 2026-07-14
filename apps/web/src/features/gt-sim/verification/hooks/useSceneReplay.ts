/**
 * Builds `scene-view-adapter` inputs from a recorded run: fetches static road
 * geometry, picks the nearest recorded OSI scene frame (via
 * `lib/replay.findNearestByTime`), and synthesizes the ego marker when no
 * scene was recorded. Also detects start/stop/lane/override event markers
 * (via `lib/replay.buildEventMarkers`).
 *
 * Ported from the fork's `components/verification/replayHooks.ts`
 * `useSceneReplay`, retargeted at `useGtSimApi()`/`@osce/esmini` types instead
 * of the fork's same-origin `api/client.ts`.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  GtSimOsiObject,
  GtSimOsiTrafficLight,
  RoadGeometryResponse,
  SceneFrame,
  VdTelemetryFrame,
  VerificationTelemetry,
} from '@osce/esmini';
import { useGtSimApi } from '../../lib';
import { buildEventMarkers, findNearestByTime, type EventMarker } from '../lib/replay';

export interface SceneReplay {
  roadGeometry: RoadGeometryResponse | null;
  currentScene: SceneFrame | null;
  sceneTrafficLights: GtSimOsiTrafficLight[];
  /** ego (+ recorded traffic) at the current frame, WITHOUT any ghost overlay. */
  baseEgoObjects: GtSimOsiObject[];
  events: EventMarker[];
}

function syntheticEgo(frame: VdTelemetryFrame): GtSimOsiObject {
  return {
    id: 0,
    name: 'ego',
    x: frame.ego.x,
    y: frame.ego.y,
    z: frame.ego.z,
    h: frame.ego.h,
    speed: frame.ego.speed,
    head_light: 'off',
    indicator: frame.indicator.left ? 'left' : frame.indicator.right ? 'right' : 'off',
    brake_light: frame.driver.brake > 0.05 ? 'normal' : 'off',
    obj_type: 'vehicle',
    vehicle_class: 'medium_car',
    length: 5,
    width: 2,
  };
}

export function useSceneReplay(
  telemetry: VerificationTelemetry | undefined,
  frames: VdTelemetryFrame[],
  frame: VdTelemetryFrame | null,
): SceneReplay {
  const api = useGtSimApi();
  const scene = useMemo(() => telemetry?.scene ?? [], [telemetry]);

  const pid = telemetry?.meta?.project_id ?? undefined;
  const sfile = telemetry?.meta?.scenario_file;
  const { data: roadGeometryData } = useQuery({
    queryKey: ['road-geometry', pid, sfile],
    queryFn: () => api!.getRoadGeometry(pid!, sfile!),
    enabled: api !== null && !!pid && !!sfile,
    retry: false, // road overlay is optional
  });
  const roadGeometry = roadGeometryData ?? null;

  const currentScene = useMemo(() => {
    if (!frame) return null;
    return findNearestByTime(scene, frame.sim_time);
  }, [scene, frame]);

  const sceneTrafficLights = useMemo(
    () => (currentScene?.traffic_lights ?? []) as unknown as GtSimOsiTrafficLight[],
    [currentScene],
  );

  const baseEgoObjects: GtSimOsiObject[] = useMemo(() => {
    if (!frame) return [];
    return currentScene
      ? ((currentScene.objects as unknown as GtSimOsiObject[]).slice())
      : [syntheticEgo(frame)];
  }, [frame, currentScene]);

  const events = useMemo<EventMarker[]>(() => buildEventMarkers(frames), [frames]);

  return { roadGeometry, currentScene, sceneTrafficLights, baseEgoObjects, events };
}

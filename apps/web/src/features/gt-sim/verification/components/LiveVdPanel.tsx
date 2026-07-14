/**
 * Live VirtualDriver telemetry view. Renders the full scene (road geometry,
 * other traffic, signals via the OSI stream — through `scene-view-adapter`
 * until cluster E lands) and overlays the VirtualDriver short-horizon preview
 * + driver readouts (VD telemetry stream). Shared by the "run a scenario"
 * mode of the Replay tab and the standalone Live tab (`LiveView`, replacing
 * the fork's `VdLivePage` route/window).
 *
 * `jobId` may be the literal `"current"`: the panel then resolves the active
 * running simulation, so the Live tab can be opened *before* a run and
 * auto-populate once a VirtualDriver simulation starts. The rich scene (other
 * cars / signals) requires the run to have OSI streaming enabled.
 *
 * Ported from the fork's `components/verification/LiveVdPanel.tsx`,
 * retargeted at `useGtSimApi()` / local `useVdStream` /
 * `useVerificationOsiScene` instead of the fork's same-origin API + hooks,
 * and `scene-view-adapter` instead of `LiveSceneView`.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import type { GtSimOsiObject } from '@osce/esmini';
import { useGtSimApi } from '../../lib';
import { SceneViewAdapter } from '../scene-view-adapter';
import { ErrorChart, TelemetryInfoRows } from './TelemetryPanels';
import { VTargetProfileChart } from './VTargetProfileChart';
import { PolicyTimelinePanel } from './PolicyTimelinePanel';
import { ActivePolicyPanel } from './ActivePolicyPanel';
import { VdManualOverridePanel } from './VdManualOverridePanel';
import { useVdStream } from '../hooks/useVdStream';
import { useVerificationOsiScene } from '../hooks/useVerificationOsiScene';

export function LiveVdPanel({
  jobId,
  projectId,
  scenarioFile,
  showOverride = false,
}: {
  jobId: string | null;
  projectId?: string;
  scenarioFile?: string;
  showOverride?: boolean;
}) {
  const { t } = useTranslation('common');
  const api = useGtSimApi();

  // Resolve "current" to the active running job (single-instance enforced).
  const isCurrent = jobId === 'current';
  const { data: simsData } = useQuery({
    queryKey: ['vd-active-sim'],
    queryFn: () => api!.getSimulations({ status: 'running', limit: 1 }),
    enabled: api !== null && isCurrent,
    refetchInterval: 2000,
  });
  const activeSim = isCurrent ? (simsData?.jobs?.[0] ?? null) : null;

  const effectiveJobId = isCurrent ? (activeSim?.job_id ?? null) : jobId;
  const effectiveProjectId = projectId ?? activeSim?.project_id ?? undefined;

  // VD telemetry (preview overlay + driver readouts) and OSI scene (cars/signals).
  const { frame, history, status: vdStatus, frameCount } = useVdStream(effectiveJobId);
  const { objects: osiObjects, trafficLights } = useVerificationOsiScene(effectiveJobId);

  // Road geometry (road network + signs + stop lines). Optional — needs the
  // scenario filename, which the launcher passes through.
  const { data: roadGeometryData } = useQuery({
    queryKey: ['road-geometry', effectiveProjectId, scenarioFile],
    queryFn: () => api!.getRoadGeometry(effectiveProjectId!, scenarioFile!),
    enabled: api !== null && !!effectiveProjectId && !!scenarioFile,
    retry: false, // road overlay is optional
  });
  const roadGeometry = roadGeometryData ?? null;

  // Prefer the OSI objects (all traffic incl. ego). Until OSI streams (or if
  // it is disabled for the run), fall back to a single ego marker from VD
  // telemetry so the preview still has context.
  const sceneObjects: GtSimOsiObject[] = useMemo(() => {
    if (osiObjects.length > 0) return osiObjects;
    if (!frame) return [];
    const e = frame.ego;
    return [
      {
        id: 0,
        name: 'ego',
        x: e.x,
        y: e.y,
        z: e.z,
        h: e.h,
        speed: e.speed,
        head_light: 'off',
        indicator: frame.indicator.left ? 'left' : frame.indicator.right ? 'right' : 'off',
        brake_light: frame.driver.brake > 0.05 ? 'normal' : 'off',
        obj_type: 'vehicle',
        vehicle_class: 'medium_car',
        length: 5,
        width: 2,
      },
    ];
  }, [osiObjects, frame]);

  const statusColor =
    vdStatus === 'connected'
      ? 'text-[var(--color-success)]'
      : vdStatus === 'error'
        ? 'text-[var(--color-destructive)]'
        : 'text-[var(--color-warning)]';

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      <div className="flex items-center gap-3 text-xs">
        <span className="font-medium text-sm text-[var(--color-text-primary)]">{t('gtSim.vd.live.title')}</span>
        <span className={statusColor}>● {vdStatus}</span>
        <span className="text-[var(--color-text-tertiary)] font-mono">
          {t('gtSim.vd.live.frameCount', { count: frameCount })}
        </span>
        {frame && <span className="text-[var(--color-text-tertiary)] font-mono">t = {frame.sim_time.toFixed(2)}s</span>}
        {isCurrent && !effectiveJobId && (
          <span className="text-[var(--color-text-tertiary)]">{t('gtSim.vd.live.waitingForRun')}</span>
        )}
      </div>

      <div className="flex-1 min-h-0 flex gap-3">
        <SceneViewAdapter
          objects={sceneObjects}
          roadGeometry={roadGeometry}
          trafficLights={trafficLights}
          vdTelemetry={frame}
          midlong={frame?.midlong ?? null}
          className="rounded-none overflow-hidden"
        />

        <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">
          {frame ? (
            <>
              <TelemetryInfoRows frame={frame} />
              <ErrorChart frames={history} idx={history.length - 1} />
              <VTargetProfileChart frames={history} idx={history.length - 1} midlong={frame.midlong} />
              <ActivePolicyPanel frames={history} />
              <PolicyTimelinePanel frames={history} idx={history.length - 1} />
            </>
          ) : (
            <div className="border border-[var(--color-glass-edge)] p-3 text-xs text-[var(--color-text-tertiary)]">
              {t('gtSim.vd.live.waitingForTelemetry')}
            </div>
          )}
          {showOverride && effectiveJobId && <VdManualOverridePanel jobId={effectiveJobId} />}
        </div>
      </div>
    </div>
  );
}

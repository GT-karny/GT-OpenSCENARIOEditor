/**
 * `LiveMonitorPanel` — the `main` slot panel: 2D live scene + HVD overlay +
 * drive-mode toggle + running-job picker.
 *
 * Rewritten from the fork's `components/project/LiveMonitorPanel.tsx`. The
 * fork received `jobId`/`projectId`/`scenarioFile` as route-driven props
 * (`/live/vd/:jobId` or a project/scenario detail page); this lane has no
 * router and execution-mode panels are self-contained (`ExecutionPanelComponent`
 * takes no props, see `panel-registry.ts`). Per the trunk brief §1, cluster
 * D→E job-list navigation is a WP5 wiring task — until then this panel owns a
 * "watch a running job" picker (`live-view-store`) so the live view is usable
 * standalone.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { useQuery } from '@tanstack/react-query';
import { useGtSimApi } from '../../lib';
import { useLiveViewStore } from '../stores/live-view-store';
import { useOsiStream, type HvdData } from '../hooks/useOsiStream';
import { useFps } from '../hooks/useFps';
import { LiveSceneView } from './LiveSceneView';
import { SelectInput } from '../../ui';

type DriveMode = 'comfort' | 'sport';

interface EgoLights {
  head: string; // 'on' | 'off'
  indicator: string; // 'left' | 'right' | 'warning' | 'off'
  brake: string; // 'normal' | 'strong' | 'off'
}

const STATUS_DOT: Record<string, string> = {
  connecting: 'bg-[var(--color-warning)]',
  connected: 'bg-[var(--color-success)]',
  disconnected: 'bg-[var(--color-text-tertiary)]',
  error: 'bg-[var(--color-destructive)]',
};

/** "Watch a running job" picker — polls the running-job list every 3s. */
function JobPicker() {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const watchedJobId = useLiveViewStore((s) => s.watchedJobId);
  const setWatchedJobId = useLiveViewStore((s) => s.setWatchedJobId);

  const { data } = useQuery({
    queryKey: ['jobs', 'running'],
    queryFn: () => api!.getSimulations({ status: 'running', limit: 50 }),
    enabled: api !== null,
    refetchInterval: 3000,
  });
  const jobs = data?.jobs ?? [];

  // Drop a watched job that is no longer running (completed/cancelled elsewhere).
  useEffect(() => {
    if (watchedJobId && data && !data.jobs.some((j) => j.job_id === watchedJobId)) {
      setWatchedJobId(null);
    }
  }, [watchedJobId, data, setWatchedJobId]);

  return (
    <SelectInput
      wrapperClassName="w-56"
      value={watchedJobId ?? ''}
      onChange={(e) => setWatchedJobId(e.target.value || null)}
      aria-label={t('gtSim.live.jobPicker.label')}
    >
      <option value="">
        {jobs.length === 0 ? t('gtSim.live.jobPicker.empty') : t('gtSim.live.jobPicker.placeholder')}
      </option>
      {jobs.map((job) => (
        <option key={job.job_id} value={job.job_id}>
          {job.scenario_id} ({job.job_id.slice(0, 8)})
        </option>
      ))}
    </SelectInput>
  );
}

export function LiveMonitorPanel() {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const jobId = useLiveViewStore((s) => s.watchedJobId);

  const { data: jobDetail } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api!.getSimulation(jobId!),
    enabled: api !== null && jobId !== null,
  });
  const projectId = jobDetail?.project_id ?? undefined;
  const scenarioFile = jobDetail?.scenario_id;

  const { status, objects, simTime, hvdData, trafficLights, frameCount } = useOsiStream(jobId);

  // Render/data FPS meter for tuning scene performance. Shown automatically in
  // dev, and opt-in for packaged builds via `?fps` in the URL or
  // localStorage.gt_show_fps='1' (so it can be measured on a real distribution).
  const { renderFps, dataFps } = useFps(frameCount);
  const showFpsMeter = useMemo(() => {
    if (import.meta.env.DEV) return true;
    if (typeof window === 'undefined') return false;
    try {
      if (new URLSearchParams(window.location.search).has('fps')) return true;
      return window.localStorage.getItem('gt_show_fps') === '1';
    } catch {
      return false;
    }
  }, []);

  // Ego lights come from OSI stream (objects[0]); HVD doesn't carry light fields.
  const egoLights = useMemo<EgoLights | null>(() => {
    if (objects.length === 0) return null;
    const o = objects[0];
    return { head: o.head_light, indicator: o.indicator, brake: o.brake_light };
  }, [objects]);

  // Fetch road geometry once when the watched job's project/scenario is known.
  // `RoadGeometryResponse` (packages/esmini) models `boundaries` plus the
  // optional `signs`/`stop_lines` fields the backend sends and the scene
  // renders — no widening cast needed.
  const { data: roadGeometry } = useQuery({
    queryKey: ['road-geometry', projectId, scenarioFile],
    queryFn: () => api!.getRoadGeometry(projectId!, scenarioFile!),
    enabled: api !== null && !!projectId && !!scenarioFile,
    staleTime: Infinity,
  });

  const dotClass = STATUS_DOT[status] ?? STATUS_DOT.connecting;
  const statusLabel = t(`gtSim.live.status.${status}`, status);

  return (
    <div className="h-full overflow-y-auto p-3 flex flex-col">
      {/* Status bar */}
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
          <span className="text-[var(--color-text-secondary)]">{statusLabel}</span>
          {frameCount > 0 && (
            <span className="text-[var(--color-text-tertiary)]">
              {t('gtSim.live.monitor.frameCount', { count: frameCount })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <JobPicker />
          {jobId && <DriveModeToggle jobId={jobId} />}
          <span className="text-xs font-mono text-[var(--color-text-secondary)]">
            {t('gtSim.live.monitor.simTime', { time: simTime.toFixed(1) })}
          </span>
        </div>
      </div>

      {/* Progress bar placeholder */}
      <div className="w-full h-1 bg-[var(--color-glass-1)] mb-3 overflow-hidden">
        <div
          className="h-full bg-[var(--color-primary)] animate-pulse"
          style={{ width: status === 'connected' ? '100%' : '0%' }}
        />
      </div>

      {/* 2D scene view + HVD overlay */}
      <div className="flex-1 min-h-0 relative">
        <LiveSceneView objects={objects} roadGeometry={roadGeometry} trafficLights={trafficLights} className="h-full" />

        {showFpsMeter && (
          <div className="absolute top-2 right-2 pointer-events-none z-20 bg-[var(--color-glass-2)]/80 backdrop-blur-sm px-2 py-1 font-mono text-[10px] text-[var(--color-text-secondary)] leading-tight">
            <div>{t('gtSim.live.monitor.fps.render', { fps: renderFps })}</div>
            <div>{t('gtSim.live.monitor.fps.data', { fps: dataFps })}</div>
          </div>
        )}

        {hvdData && (
          <div className="absolute top-2 left-2 pointer-events-none">
            <HvdOverlay hvd={hvdData} lights={egoLights} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Drive Mode Toggle ---------- */

function DriveModeToggle({ jobId }: { jobId: string }) {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const [mode, setMode] = useState<DriveMode>('comfort');
  const [pending, setPending] = useState<DriveMode | null>(null);

  // Seed from the simulation's startup config so this toggle reflects the
  // mode that was actually selected on the RUN panel.
  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api.getSimulation(jobId).then(
      (sim) => {
        if (cancelled) return;
        const exec = (sim.options as { execution?: { drive_mode?: string } } | undefined)?.execution;
        const initial = exec?.drive_mode;
        if (initial === 'comfort' || initial === 'sport') {
          setMode(initial);
        }
      },
      () => {
        /* fall back to default 'comfort' */
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, jobId]);

  const apply = async (next: DriveMode) => {
    if (next === mode || pending || !api) return;
    setPending(next);
    try {
      await api.setDriveMode(jobId, next);
      setMode(next);
    } catch (e) {
      console.error('setDriveMode failed', e);
    } finally {
      setPending(null);
    }
  };

  const baseBtn = 'px-2 py-0.5 text-[10px] font-medium rounded-none transition-colors';
  const activeCls = 'bg-[var(--color-accent-vivid)] text-[var(--color-bg-void)]';
  const inactiveCls = 'bg-[var(--color-glass-1)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)]';

  return (
    <div className="inline-flex items-center gap-0.5 border border-[var(--color-glass-edge)] p-0.5">
      {(['comfort', 'sport'] as DriveMode[]).map((m) => (
        <button
          key={m}
          type="button"
          disabled={pending !== null}
          onClick={() => apply(m)}
          className={`${baseBtn} ${mode === m ? activeCls : inactiveCls} ${pending === m ? 'opacity-60' : ''}`}
        >
          {t(`gtSim.live.monitor.driveMode.${m}`)}
        </button>
      ))}
    </div>
  );
}

/* ---------- Steering Wheel SVG ---------- */

function SteeringWheel({ angle }: { angle: number }) {
  // angle in radians; positive = left per OSI convention
  const deg = -(angle * 180) / Math.PI;
  const clampedDeg = Math.max(-540, Math.min(540, deg));

  return (
    <svg width="64" height="64" viewBox="-36 -36 72 72">
      {/* Fixed 12-o'clock marker */}
      <circle cx="0" cy="-33" r="2.5" fill="var(--color-accent-bright)" />

      {/* Rotating wheel group */}
      <g
        style={{
          transform: `rotate(${clampedDeg}deg)`,
          transition: 'transform 150ms ease-out',
          transformOrigin: '0 0',
        }}
      >
        {/* Rim */}
        <circle r="28" fill="none" stroke="var(--color-text-secondary)" strokeWidth="4" />
        {/* 3 spokes at 0°, 120°, 240° */}
        <line x1="0" y1="0" x2="0" y2="-24" stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="0" y1="0" x2="20.8" y2="12" stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="0" y1="0" x2="-20.8" y2="12" stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Hub */}
        <circle r="5" fill="var(--color-text-secondary)" />
      </g>
    </svg>
  );
}

/* ---------- HVD Overlay ---------- */

function HvdOverlay({ hvd, lights }: { hvd: HvdData; lights: EgoLights | null }) {
  const { t } = useTranslation('common');
  const speedKmh = hvd.speed * 3.6;
  const steeringDeg = (hvd.steering_angle * 180) / Math.PI;
  const gear = hvd.gear < 0 ? 'R' : hvd.gear === 0 ? 'N' : String(hvd.gear);

  return (
    <div className="flex flex-col items-center gap-1 bg-[var(--color-glass-2)]/80 backdrop-blur-sm p-2">
      {/* Steering wheel */}
      <SteeringWheel angle={hvd.steering_angle} />
      <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">{steeringDeg.toFixed(1)}&deg;</span>

      {/* Speed + Gear */}
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-sm font-mono font-bold text-[var(--color-text-primary)] leading-none">
          {speedKmh.toFixed(0)}
        </span>
        <span className="text-[10px] text-[var(--color-text-tertiary)]">{t('gtSim.live.hvd.unitKmh')}</span>
        <span className="text-xs font-mono font-bold text-[var(--color-text-primary)] ml-1">{gear}</span>
      </div>

      {/* RPM */}
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className="text-xs font-mono text-[var(--color-text-primary)] leading-none">{hvd.rpm.toFixed(0)}</span>
        <span className="text-[9px] text-[var(--color-text-tertiary)]">{t('gtSim.live.hvd.unitRpm')}</span>
      </div>

      {/* Throttle / Brake mini bars */}
      <div className="flex gap-2 mt-0.5">
        <MiniBar label="T" ratio={hvd.throttle} colorVar="var(--color-success)" />
        <MiniBar label="B" ratio={hvd.brake} colorVar="var(--color-destructive)" />
      </div>

      {/* Light indicators */}
      {lights && <LightRow lights={lights} />}
    </div>
  );
}

/* ---------- Light Indicators ---------- */

function LightRow({ lights }: { lights: EgoLights }) {
  const { t } = useTranslation('common');
  const headOn = lights.head === 'on';
  const blinkLeft = lights.indicator === 'left' || lights.indicator === 'warning';
  const blinkRight = lights.indicator === 'right' || lights.indicator === 'warning';
  const brakeStrong = lights.brake === 'strong';
  const brakeNormal = lights.brake === 'normal';

  return (
    <div className="flex gap-1.5 mt-0.5" aria-label={t('gtSim.live.hvd.lights.label')}>
      <LightDot label="H" active={headOn} activeFill="rgb(250 220 130)" />
      <LightDot label="L" active={blinkLeft} activeFill="rgb(255 170 50)" blink />
      <LightDot label="R" active={blinkRight} activeFill="rgb(255 170 50)" blink />
      <LightDot label="B" active={brakeStrong || brakeNormal} activeFill={brakeStrong ? 'rgb(220 40 40)' : 'rgb(200 80 80)'} />
    </div>
  );
}

function LightDot({
  label,
  active,
  activeFill,
  blink = false,
}: {
  label: string;
  active: boolean;
  activeFill: string;
  blink?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width="14" height="14" viewBox="-7 -7 14 14">
        {active ? (
          <circle cx="0" cy="0" r="5" fill={activeFill}>
            {blink && <animate attributeName="opacity" values="1;0.2;1" dur="0.7s" repeatCount="indefinite" />}
          </circle>
        ) : (
          <circle cx="0" cy="0" r="5" fill="none" stroke="rgb(120 120 120)" strokeWidth="1" />
        )}
      </svg>
      <span className="text-[8px] text-[var(--color-text-tertiary)] leading-none">{label}</span>
    </div>
  );
}

function MiniBar({ label, ratio, colorVar }: { label: string; ratio: number; colorVar: string }) {
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-[var(--color-text-tertiary)] w-2">{label}</span>
      <div className="w-10 h-1.5 bg-[var(--color-glass-1)] overflow-hidden rounded-full">
        <div
          className="h-full transition-all duration-150 rounded-full"
          style={{ width: `${clamped * 100}%`, background: colorVar }}
        />
      </div>
    </div>
  );
}

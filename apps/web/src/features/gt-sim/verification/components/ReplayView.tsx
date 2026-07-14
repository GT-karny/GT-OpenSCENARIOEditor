/**
 * Replays a recorded VirtualDriver run: drives the scene overlay (short-horizon
 * preview) from telemetry plus a driver-error chart and verdict/compare
 * summary. Also supports launching a fresh run ("run a scenario" mode) and
 * watching it live via `LiveVdPanel`, then auto-switching to replaying the
 * just-finished recording. Transport/scene/timeline machinery is shared with
 * `AnnotateView` (see `../hooks/useReplayTransport`, `../hooks/useSceneReplay`).
 *
 * Ported from the fork's `pages/VerificationReplayPage.tsx`. Route-derived
 * state (none — the fork used none here, only local `useState`) stays local
 * `useState`, matching the fork.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import type { GtSimOsiObject } from '@osce/esmini';
import { useGtSimApi } from '../../lib';
import { Button } from '../../ui';
import { SceneViewAdapter } from '../scene-view-adapter';
import { ErrorChart, TelemetryInfoRows } from './TelemetryPanels';
import { VTargetProfileChart } from './VTargetProfileChart';
import { PolicyTimelinePanel } from './PolicyTimelinePanel';
import { LiveVdPanel } from './LiveVdPanel';
import { VdRunLauncher } from './VdRunLauncher';
import { ReplayControls, Timeline } from './ReplayTransport';
import { useReplayTransport } from '../hooks/useReplayTransport';
import { useSceneReplay } from '../hooks/useSceneReplay';

export function ReplayView() {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const queryClient = useQueryClient();
  const { data: runsData } = useQuery({
    queryKey: ['verification-runs'],
    queryFn: () => api!.getVerificationRuns(),
    enabled: api !== null,
    refetchInterval: 5000,
  });
  const runs = useMemo(() => runsData?.runs ?? [], [runsData]);

  // Effective run = explicit selection, else the most recent one (derived, no effect).
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const runId = selectedRunId ?? (runs.length > 0 ? runs[runs.length - 1].id : null);

  const { data: telemetry } = useQuery({
    queryKey: ['verification-telemetry', runId],
    queryFn: () => api!.getVerificationTelemetry(runId!),
    enabled: api !== null && !!runId,
  });
  const frames = useMemo(() => telemetry?.frames ?? [], [telemetry]);

  // On-demand verification pipeline (writes compare.json / verdict.json into the
  // run dir; refetching telemetry then lights up the existing ghost / verdict UI).
  const refetchRun = () => queryClient.invalidateQueries({ queryKey: ['verification-telemetry', runId] });
  const compareMut = useMutation({
    mutationFn: () => api!.runBaselineCompare(runId!),
    onSuccess: refetchRun,
  });
  const assertMut = useMutation({
    mutationFn: () => api!.runAssertions(runId!),
    onSuccess: refetchRun,
  });

  // --- playback (shared transport hook) ---
  const r = useReplayTransport(frames);
  const [compareOn, setCompareOn] = useState(false);
  const failCursorRef = useRef(0);

  const selectRun = (id: string | null) => {
    setSelectedRunId(id);
    r.setIdx(0);
    r.setPlaying(false);
  };

  // --- run-a-scenario mode: launch a VirtualDriver run, watch it live, then
  // auto-switch to replaying the just-finished recording. ---
  const [mode, setMode] = useState<'replay' | 'run'>('replay');
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [runOverride, setRunOverride] = useState(false);
  const [runProject, setRunProject] = useState<string | undefined>(undefined);
  const [runScenario, setRunScenario] = useState<string | undefined>(undefined);

  const { data: runningSim } = useQuery({
    queryKey: ['vd-job-status', runningJobId],
    queryFn: () => api!.getSimulation(runningJobId!),
    enabled: api !== null && !!runningJobId,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'running' || s === 'queued' ? 1000 : false;
    },
  });

  // Deliberate: this syncs UI state to an external event (job completion
  // observed via polling). The query cache invalidation is a side effect that
  // must not run during render, and react-query v5 useQuery has no completion
  // callback, so an effect is the supported place for this transition.
  useEffect(() => {
    if (!runningJobId || !runningSim) return;
    if (['completed', 'failed', 'timeout', 'cancelled'].includes(runningSim.status)) {
      const finished = runningJobId;
      setRunningJobId(null);
      setMode('replay');
      queryClient.invalidateQueries({ queryKey: ['verification-runs'] });
      selectRun(finished); // load the just-finished run as a replay
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningJobId, runningSim]);

  const frame = r.frame;

  const verdict = telemetry?.verdict ?? null;
  const compare = telemetry?.compare ?? null;
  const baselineTrack = telemetry?.baseline_track ?? null;

  // Shared scene-building (road geometry + recorded OSI scene + event markers).
  const { roadGeometry, sceneTrafficLights, baseEgoObjects, events } = useSceneReplay(telemetry, frames, frame);

  // --- fail markers from the verdict ---
  const failMarkers = useMemo(
    () =>
      (verdict?.results ?? [])
        .filter((x) => x.status === 'fail' && typeof x.idx === 'number')
        .map((x) => ({ idx: x.idx as number, t: x.t, event: x.event, reason: x.reason })),
    [verdict],
  );

  const jumpToFail = () => {
    if (failMarkers.length === 0) return;
    const c = failCursorRef.current % failMarkers.length;
    r.setIdx(failMarkers[c].idx);
    r.setPlaying(false);
    failCursorRef.current = c + 1;
  };

  // --- baseline ghost (Default) at the current frame ---
  const ghost = compareOn && baselineTrack && baselineTrack[r.idx] ? baselineTrack[r.idx] : null;
  const ghostHeading = useMemo(() => {
    if (!ghost || !baselineTrack) return 0;
    const nxt = baselineTrack[Math.min(r.idx + 1, baselineTrack.length - 1)];
    return Math.atan2(nxt.y - ghost.y, nxt.x - ghost.x) || 0;
  }, [ghost, baselineTrack, r.idx]);
  const ghostPathPts = useMemo<[number, number][] | null>(
    () => (compareOn && baselineTrack ? baselineTrack.map((p) => [p.x, p.y]) : null),
    [compareOn, baselineTrack],
  );

  const egoObjects: GtSimOsiObject[] = useMemo(() => {
    const objs = baseEgoObjects.slice();
    if (ghost) {
      objs.push({
        id: -1,
        name: 'Default',
        x: ghost.x,
        y: ghost.y,
        z: 0,
        h: ghostHeading,
        speed: ghost.speed,
        head_light: 'off',
        indicator: 'off',
        brake_light: 'off',
        obj_type: 'vehicle',
        vehicle_class: 'medium_car',
        length: 5,
        width: 2,
      });
    }
    return objs;
  }, [baseEgoObjects, ghost, ghostHeading]);

  const ghostDelta = ghost && frame ? Math.hypot(frame.ego.x - ghost.x, frame.ego.y - ghost.y) : null;

  return (
    <div className="h-full flex flex-col p-3 gap-3">
      {/* Header / controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Mode: replay a past run vs run a scenario now */}
        <div className="inline-flex border border-[var(--color-glass-edge)] p-0.5 text-xs">
          {(['replay', 'run'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              disabled={!!runningJobId}
              className={`px-2 py-1 rounded-none cursor-pointer disabled:opacity-40 ${
                mode === m
                  ? 'bg-[var(--color-accent-vivid)]/80 text-[var(--color-bg-void)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)]'
              }`}
            >
              {m === 'replay' ? t('gtSim.vd.replay.modeReplay') : t('gtSim.vd.replay.modeRun')}
            </button>
          ))}
        </div>

        {runningJobId ? (
          <span className="inline-flex items-center gap-2 text-xs">
            <span className="text-[var(--color-warning)]">
              ● {t('gtSim.vd.replay.running', { status: runningSim?.status ?? 'starting' })}
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                api?.cancelSimulation(runningJobId).catch(() => {});
              }}
            >
              {t('gtSim.vd.replay.stop')}
            </Button>
          </span>
        ) : mode === 'run' ? (
          <VdRunLauncher
            onStarted={(jid, { override, projectId, scenarioFile }) => {
              setRunningJobId(jid);
              setRunOverride(override);
              setRunProject(projectId);
              setRunScenario(scenarioFile);
            }}
          />
        ) : (
          <>
            <select
              value={runId ?? ''}
              onChange={(e) => selectRun(e.target.value || null)}
              className="rounded-none bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] px-2 py-1 text-sm text-[var(--color-text-primary)]"
            >
              <option value="" disabled>
                {t('gtSim.vd.replay.selectRun')}
              </option>
              {runs.map((rr) => (
                <option key={rr.id} value={rr.id}>
                  {rr.id}
                  {typeof rr.meta.frames === 'number' ? ` (${rr.meta.frames}f)` : ''}
                </option>
              ))}
            </select>
            {runs.length === 0 && (
              <span className="text-xs text-[var(--color-text-tertiary)]">{t('gtSim.vd.replay.noRunsYet')}</span>
            )}

            {runId && (
              <div className="inline-flex gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => compareMut.mutate()}
                  disabled={compareMut.isPending}
                  title={t('gtSim.vd.replay.compareTitle')}
                >
                  {compareMut.isPending ? t('gtSim.vd.replay.comparing') : t('gtSim.vd.replay.compareVsDefault')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => assertMut.mutate()}
                  disabled={assertMut.isPending}
                  title={t('gtSim.vd.replay.assertTitle')}
                >
                  {assertMut.isPending ? t('gtSim.vd.replay.asserting') : t('gtSim.vd.replay.runAssertions')}
                </Button>
              </div>
            )}
            {(compareMut.error || assertMut.error) && (
              <span className="text-xs text-[var(--color-destructive)]">
                {String((compareMut.error || assertMut.error) as Error)}
              </span>
            )}

            {frames.length > 0 && (
              <>
                <ReplayControls r={r} frames={frames} />

                {failMarkers.length > 0 && (
                  <Button variant="danger" size="sm" onClick={jumpToFail} title={t('gtSim.vd.replay.jumpToFailTitle')}>
                    {t('gtSim.vd.replay.jumpToFail', { count: failMarkers.length })}
                  </Button>
                )}
                {baselineTrack && baselineTrack.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCompareOn((v) => !v)}
                    className={`px-2 py-1 rounded-none text-xs font-medium border border-[var(--color-glass-edge)] cursor-pointer ${
                      compareOn
                        ? 'bg-[var(--color-accent-vivid)]/30 text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)]'
                    }`}
                    title={t('gtSim.vd.replay.compareOverlayTitle')}
                  >
                    {t('gtSim.vd.replay.compare')}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Live view while a launched run is in progress */}
      {runningJobId ? (
        <div className="flex-1 min-h-0">
          <LiveVdPanel jobId={runningJobId} projectId={runProject} scenarioFile={runScenario} showOverride={runOverride} />
        </div>
      ) : (
        <>
          {/* Body: scene + side panel */}
          <div className="flex-1 min-h-0 flex gap-3">
            <SceneViewAdapter
              objects={egoObjects}
              roadGeometry={roadGeometry}
              trafficLights={sceneTrafficLights}
              vdTelemetry={frame}
              midlong={frame?.midlong ?? null}
              ghostPath={ghostPathPts}
              className="rounded-none overflow-hidden"
            />

            <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">
              {(verdict || compare) && (
                <div className="border border-[var(--color-glass-edge)] p-3 text-xs space-y-1">
                  <div className="font-medium text-[var(--color-text-primary)] mb-1">{t('gtSim.vd.replay.verdictTitle')}</div>
                  {verdict?.overall && (
                    <div>
                      {t('gtSim.vd.replay.overall')}:{' '}
                      <span
                        className={
                          verdict.overall === 'pass'
                            ? 'text-[var(--color-success)]'
                            : verdict.overall === 'fail'
                              ? 'text-[var(--color-destructive)]'
                              : 'text-[var(--color-warning)]'
                        }
                      >
                        {verdict.overall}
                      </span>
                      {verdict.summary && (
                        <span className="text-[var(--color-text-tertiary)]">
                          {' '}
                          ({verdict.summary.pass}P/{verdict.summary.fail}F/{verdict.summary.skip}S)
                        </span>
                      )}
                    </div>
                  )}
                  {compare?.xy_rmse_m != null && (
                    <div className="text-[var(--color-text-secondary)]">
                      XY RMSE {compare.xy_rmse_m}m · speed RMSE {compare.speed_rmse_mps}m/s · max {compare.xy_max_dev_m}m
                    </div>
                  )}
                  {compareOn && ghostDelta != null && (
                    <div className="text-[var(--color-text-secondary)]">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                        style={{ background: 'rgba(230,200,120,0.9)' }}
                      />
                      {t('gtSim.vd.replay.deltaToDefault', { value: ghostDelta.toFixed(2) })}
                    </div>
                  )}
                </div>
              )}

              {frame && <TelemetryInfoRows frame={frame} />}
              {frames.length > 0 && <ErrorChart frames={frames} idx={r.idx} />}
              {frames.length > 0 && <VTargetProfileChart frames={frames} idx={r.idx} midlong={frame?.midlong} />}
              {frames.length > 0 && <PolicyTimelinePanel frames={frames} idx={r.idx} />}
            </div>
          </div>

          {/* Scrub bar with event + fail markers */}
          {frames.length > 0 && (
            <Timeline
              frames={frames}
              idx={r.idx}
              events={events}
              fails={failMarkers}
              onSeek={(i) => {
                r.setIdx(i);
                r.setPlaying(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

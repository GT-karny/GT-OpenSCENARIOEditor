/**
 * Human annotation view — the regression-judgment base for VirtualDriver's
 * decision behaviors. Lists recorded verification runs (top-level + batch-
 * nested), replays one with the shared transport, and lets a human label it
 * pass / fail / needs-discussion.
 *
 * Top priority is labeling speed: keyboard shortcuts (P/F/D label + save +
 * auto-advance, J/K navigate, Space play, ,/. step, C comment) and an
 * optimistic list so the next unlabeled run is one keypress away.
 *
 * Ported from the fork's `pages/VerificationAnnotatePage.tsx`. Filter/search/
 * next-unlabeled/summary logic is extracted to `../lib/annotation.ts` for
 * unit testing. The fork's `OdrMetadataPanel` sidebar (cluster G, not yet
 * built) is intentionally omitted — see the cluster F final report for the
 * integration note.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import { buildGtSimSimulationRequest } from '@osce/esmini';
import type { AnnotationLabel, AnnotationRun, MatchResult } from '@osce/esmini';
import { useGtSimApi } from '../../lib';
import { useVdViewStore } from '../store/vd-view-store';
import { Button } from '../../ui';
import { SceneViewAdapter } from '../scene-view-adapter';
import { TelemetryInfoRows } from './TelemetryPanels';
import { ReplayControls, Timeline } from './ReplayTransport';
import { useReplayTransport } from '../hooks/useReplayTransport';
import { useSceneReplay } from '../hooks/useSceneReplay';
import { RunListPanel } from './RunListPanel';
import { AnnotationLabelBar } from './AnnotationLabelBar';
import {
  filterAnnotationRuns,
  findNextUnlabeled,
  formatMatchScore,
  summarizeAnnotationBatches,
  summarizeAnnotationRuns,
  type RunFilter,
} from '../lib/annotation';

const VERDICT_TEXT: Record<string, string> = {
  pass: 'text-[var(--color-success)]',
  fail: 'text-[var(--color-destructive)]',
  'needs-review': 'text-[var(--color-warning)]',
  error: 'text-[var(--color-destructive)]',
};

export function AnnotateView() {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const queryClient = useQueryClient();
  // The panel keeps all tabs mounted (forceMount); global shortcuts must only
  // fire while this tab is the visible one.
  const isActiveTab = useVdViewStore((s) => s.activeTab) === 'annotate';
  const [filter, setFilter] = useState<RunFilter>('unlabeled');
  const [search, setSearch] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement | null>(null);

  // All runs (client-side filter/search so switching is instant and counts are exact).
  const { data: runsData } = useQuery({
    queryKey: ['annotation-runs'],
    queryFn: () => api!.getAnnotationRuns(),
    enabled: api !== null,
    refetchInterval: 8000,
  });
  const allRuns = useMemo(() => runsData?.runs ?? [], [runsData]);

  const filtered = useMemo(() => filterAnnotationRuns(allRuns, filter, search), [allRuns, filter, search]);

  // Effective selection: explicit, else first of the filtered list.
  const effectiveId = selectedRunId ?? (filtered.length > 0 ? filtered[0].run_id : null);
  const selected = useMemo(() => allRuns.find((x) => x.run_id === effectiveId) ?? null, [allRuns, effectiveId]);

  // Reset comment editor when the active run changes (render-time adjustment —
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  const [prevRunId, setPrevRunId] = useState(effectiveId);
  if (prevRunId !== effectiveId) {
    setPrevRunId(effectiveId);
    setComment(selected?.comment ?? '');
    setSaved(false);
  }

  // --- telemetry + replay (shared transport) ---
  const { data: telemetry } = useQuery({
    queryKey: ['verification-telemetry', effectiveId],
    queryFn: () => api!.getVerificationTelemetry(effectiveId!),
    enabled: api !== null && !!effectiveId,
  });
  const frames = useMemo(() => telemetry?.frames ?? [], [telemetry]);
  const r = useReplayTransport(frames);
  const frame = r.frame;
  // The fork's AnnotatePage does not overlay road geometry on this scene view
  // (only Replay/Live do); road geometry is fetched but intentionally unused here.
  const { sceneTrafficLights, baseEgoObjects, events } = useSceneReplay(telemetry, frames, frame);

  const verdict = telemetry?.verdict ?? null;
  const failMarkers = useMemo(
    () =>
      (verdict?.results ?? [])
        .filter((x) => x.status === 'fail' && typeof x.idx === 'number')
        .map((x) => ({ idx: x.idx as number, t: x.t, event: x.event, reason: x.reason })),
    [verdict],
  );

  // --- selection helpers ---
  const selectRun = (id: string) => {
    setSelectedRunId(id);
    r.setIdx(0);
    r.setPlaying(false);
  };
  const moveSelection = (delta: number) => {
    if (filtered.length === 0) return;
    const i = filtered.findIndex((x) => x.run_id === effectiveId);
    const next = Math.max(0, Math.min(filtered.length - 1, (i < 0 ? 0 : i) + delta));
    selectRun(filtered[next].run_id);
  };
  const advanceToNextUnlabeled = (justLabeled: string) => {
    const next = findNextUnlabeled(filtered, justLabeled);
    if (next) selectRun(next);
  };

  // --- label mutation (optimistic) ---
  const labelMut = useMutation({
    mutationFn: ({ runId, label }: { runId: string; label: AnnotationLabel }) =>
      api!.setAnnotation(runId, { label, comment }),
    onMutate: async ({ runId, label }) => {
      await queryClient.cancelQueries({ queryKey: ['annotation-runs'] });
      const prev = queryClient.getQueryData<{ runs: AnnotationRun[] }>(['annotation-runs']);
      queryClient.setQueryData<{ runs: AnnotationRun[] }>(['annotation-runs'], (old) =>
        old
          ? { runs: old.runs.map((x) => (x.run_id === runId ? { ...x, label, labeled: true, comment } : x)) }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['annotation-runs'], ctx.prev);
    },
    onSuccess: (_data, { runId }) => {
      setSaved(true);
      if (autoAdvance) advanceToNextUnlabeled(runId);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['annotation-runs'] }),
  });

  const applyLabel = (label: AnnotationLabel) => {
    if (!effectiveId) return;
    setSaved(false);
    labelMut.mutate({ runId: effectiveId, label });
  };

  // --- "watch driver-seat view": re-run the scenario with VirtualDriver +
  // esmini's native driver (first-person) camera in a 3D window. Behavior is
  // deterministic so the re-run matches the recorded run. Needs
  // project_id + scenario_file (batch runs lack project_id). ---
  const canDriverView = !!(selected?.project_id && selected?.scenario_file);
  const driverViewMut = useMutation({
    mutationFn: () => {
      const req = buildGtSimSimulationRequest({
        scenarioId: selected!.scenario_file!,
        projectId: selected!.project_id!,
        controllerType: 'virtual_driver',
        execution: {
          headless: false, // show the native 3D window
          no_realtime: false, // real-time so it's watchable
          threads: true,
          window: { x: 80, y: 80 },
          extra_args: ['--camera_mode', 'driver'],
        },
      });
      return api!.createSimulation(req);
    },
  });

  // --- "Suggested from history" (rule-based match) ---
  const { data: matchData } = useQuery({
    queryKey: ['annotation-match', effectiveId],
    queryFn: () => api!.matchAnnotations(effectiveId!, 5),
    enabled: api !== null && !!effectiveId,
    retry: false,
  });

  // --- keyboard shortcuts (only while this tab is visible) ---
  useEffect(() => {
    if (!isActiveTab) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
      if (typing) {
        if (e.key === 'Escape') el.blur();
        return;
      }
      switch (e.key.toLowerCase()) {
        case 'p':
          e.preventDefault();
          applyLabel('pass');
          break;
        case 'f':
          e.preventDefault();
          applyLabel('fail');
          break;
        case 'd':
          e.preventDefault();
          applyLabel('needs-discussion');
          break;
        case 'c':
          e.preventDefault();
          commentRef.current?.focus();
          break;
        case 'j':
          e.preventDefault();
          moveSelection(1);
          break;
        case 'k':
          e.preventDefault();
          moveSelection(-1);
          break;
        case 'arrowdown':
          e.preventDefault();
          moveSelection(1);
          break;
        case 'arrowup':
          e.preventDefault();
          moveSelection(-1);
          break;
        case ' ':
          e.preventDefault();
          r.togglePlay();
          break;
        case ',':
          e.preventDefault();
          r.stepBy(-1);
          break;
        case '.':
          e.preventDefault();
          r.stepBy(1);
          break;
        case 'enter':
          e.preventDefault();
          if (effectiveId) advanceToNextUnlabeled(effectiveId);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="h-full flex flex-col p-3 gap-3">
      <SummaryCard runs={allRuns} />

      <div className="flex-1 min-h-0 flex gap-3">
        {/* Left rail */}
        <div className="w-64 shrink-0">
          <RunListPanel
            runs={filtered}
            allRuns={allRuns}
            selectedId={effectiveId}
            onSelect={selectRun}
            filter={filter}
            onFilter={setFilter}
            search={search}
            onSearch={setSearch}
          />
        </div>

        {/* Center: scene + transport + timeline */}
        <div className="flex-1 min-h-0 flex flex-col gap-2">
          {selected ? (
            <>
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <span className="text-[var(--color-text-primary)]">{selected.scenario_stem ?? selected.run_id}</span>
                <span className={`text-xs ${VERDICT_TEXT[selected.verdict_overall ?? ''] ?? 'text-[var(--color-text-tertiary)]'}`}>
                  {t('gtSim.vd.annotate.verdictLabel')}: {selected.verdict_overall ?? 'n/a'}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => driverViewMut.mutate()}
                  disabled={!canDriverView || driverViewMut.isPending}
                  title={canDriverView ? t('gtSim.vd.annotate.driverViewTitle') : t('gtSim.vd.annotate.driverViewDisabledTitle')}
                >
                  {driverViewMut.isPending ? t('gtSim.vd.annotate.driverViewStarting') : t('gtSim.vd.annotate.driverView')}
                </Button>
                {driverViewMut.error != null && (
                  <span className="text-xs text-[var(--color-destructive)]">
                    {/409/.test(String(driverViewMut.error))
                      ? t('gtSim.vd.annotate.driverViewBusy')
                      : String(driverViewMut.error as Error)}
                  </span>
                )}
                {frames.length > 0 && <ReplayControls r={r} frames={frames} />}
              </div>

              <SceneViewAdapter
                objects={baseEgoObjects}
                trafficLights={sceneTrafficLights}
                vdTelemetry={frame}
                midlong={frame?.midlong ?? null}
                className="rounded-none overflow-hidden"
              />

              {frames.length > 0 ? (
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
              ) : (
                <div className="text-xs text-[var(--color-text-tertiary)]">{t('gtSim.vd.annotate.loadingTelemetry')}</div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--color-text-tertiary)]">
              {allRuns.length === 0 ? t('gtSim.vd.annotate.noRunsRegistered') : t('gtSim.vd.annotate.allLabeled')}
            </div>
          )}
        </div>

        {/* Right rail: label + telemetry + suggestions */}
        <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">
          {selected && (
            <AnnotationLabelBar
              ref={commentRef}
              current={selected.label}
              comment={comment}
              onLabel={applyLabel}
              onComment={(txt) => {
                setComment(txt);
                setSaved(false);
              }}
              onCommentBlur={() => {
                // Persist a comment edit against the existing label (if any).
                if (selected.label && comment !== (selected.comment ?? ''))
                  labelMut.mutate({ runId: selected.run_id, label: selected.label });
              }}
              saved={saved}
              saving={labelMut.isPending}
              error={labelMut.error ? String(labelMut.error as Error) : null}
              autoAdvance={autoAdvance}
              onToggleAutoAdvance={() => setAutoAdvance((v) => !v)}
            />
          )}

          {frame && <TelemetryInfoRows frame={frame} />}

          {matchData && matchData.matches.length > 0 && <MatchPanel matches={matchData.matches} onSelect={selectRun} />}
        </div>
      </div>
    </div>
  );
}

/* ---------- batch dashboard summary ---------- */

function SummaryCard({ runs }: { runs: AnnotationRun[] }) {
  const { t } = useTranslation('common');
  const [byBatch, setByBatch] = useState(false);
  const agg = useMemo(() => summarizeAnnotationRuns(runs), [runs]);
  const batches = useMemo(() => summarizeAnnotationBatches(runs), [runs]);
  const pct = agg.total > 0 ? Math.round((agg.labeled / agg.total) * 100) : 0;

  return (
    <div className="border border-[var(--color-glass-edge)] p-3 text-xs flex flex-col gap-2">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-[var(--color-text-primary)] font-medium">{t('gtSim.vd.annotate.summaryTotal', { count: agg.total })}</span>
        <span className="text-[var(--color-success)]">✓ {t('gtSim.vd.annotate.summaryPass', { count: agg.pass })}</span>
        <span className="text-[var(--color-destructive)]">✗ {t('gtSim.vd.annotate.summaryFail', { count: agg.fail })}</span>
        <span className="text-[var(--color-warning)]">⚠ {t('gtSim.vd.annotate.summaryReview', { count: agg['needs-review'] })}</span>
        {agg.error > 0 && (
          <span className="text-[var(--color-destructive)]">! {t('gtSim.vd.annotate.summaryError', { count: agg.error })}</span>
        )}
        <span className="text-[var(--color-text-secondary)] ml-auto">
          {t('gtSim.vd.annotate.summaryLabeled', { labeled: agg.labeled, total: agg.total })}
        </span>
        <button
          type="button"
          onClick={() => setByBatch((v) => !v)}
          className={`px-2 py-0.5 rounded-none border text-[11px] cursor-pointer ${
            byBatch
              ? 'bg-[var(--color-accent-vivid)]/30 text-[var(--color-text-primary)] border-[var(--color-glass-edge)]'
              : 'border-[var(--color-glass-edge)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)]'
          }`}
        >
          {t('gtSim.vd.annotate.groupByBatch')}
        </button>
      </div>
      <div className="h-1.5 rounded-none bg-[var(--color-glass-1)] overflow-hidden">
        <div className="h-full bg-[var(--color-accent-vivid)]" style={{ width: `${pct}%` }} />
      </div>
      {byBatch && (
        <div className="flex flex-col gap-0.5 pt-1">
          {batches.map((b) => (
            <div key={b.id} className="flex items-center gap-3 text-[11px] text-[var(--color-text-secondary)]">
              <span className="text-[var(--color-text-primary)] truncate flex-1">{b.id}</span>
              <span className="text-[var(--color-success)]">✓{b.pass}</span>
              <span className="text-[var(--color-destructive)]">✗{b.fail}</span>
              <span>
                {t('gtSim.vd.annotate.summaryLabeled', { labeled: b.labeled, total: b.total })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- suggested-from-history match list ---------- */

function MatchPanel({ matches, onSelect }: { matches: MatchResult[]; onSelect: (id: string) => void }) {
  const { t } = useTranslation('common');
  return (
    <div className="border border-[var(--color-glass-edge)] p-3 text-xs flex flex-col gap-1.5">
      <div className="font-medium text-[var(--color-text-primary)]">{t('gtSim.vd.annotate.suggestedFromHistory')}</div>
      {matches.map((m) => (
        <button
          key={m.run_id}
          type="button"
          onClick={() => onSelect(m.run_id)}
          className="text-left rounded-none px-2 py-1 hover:bg-[var(--color-glass-hover)] cursor-pointer"
          title={m.reasons.join(' · ')}
        >
          <div className="flex items-center gap-2">
            <span
              className={
                m.label === 'pass'
                  ? 'text-[var(--color-success)]'
                  : m.label === 'fail'
                    ? 'text-[var(--color-destructive)]'
                    : 'text-[var(--color-warning)]'
              }
            >
              {m.label}
            </span>
            <span className="text-[var(--color-text-tertiary)] ml-auto">{formatMatchScore(m.score)}</span>
          </div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">{m.reasons[0] ?? m.run_id}</div>
          {m.comment && <div className="text-[10px] text-[var(--color-text-secondary)] truncate">"{m.comment}"</div>}
        </button>
      ))}
    </div>
  );
}

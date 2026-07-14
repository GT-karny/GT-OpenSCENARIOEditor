/**
 * Replay transport UI: the transport button cluster (`ReplayControls`) and
 * the `Timeline` scrubber with event + fail markers. Ported from the fork's
 * `components/verification/ReplayTransport.tsx`, restyled with APEX
 * `var(--color-*)` tokens (`rounded-none`) instead of the fork's bare
 * Tailwind color names. Playback/scene-building hooks live in
 * `../hooks/useReplayTransport.ts` / `../hooks/useSceneReplay.ts`.
 */
import { type ReactNode } from 'react';
import { useTranslation } from '@osce/i18n';
import type { VdTelemetryFrame } from '@osce/esmini';
import type { ReplayState } from '../hooks/useReplayTransport';
import type { EventMarker } from '../lib/replay';

/* ---------- transport controls (button cluster) ---------- */

export function ReplayControls({ r, frames }: { r: ReplayState; frames: VdTelemetryFrame[] }) {
  const { t } = useTranslation('common');
  if (frames.length === 0) return null;
  return (
    <>
      <div className="inline-flex items-center gap-0.5 border border-[var(--color-glass-edge)] p-0.5">
        <IconButton title={t('gtSim.vd.transport.jumpToStart')} onClick={r.reset} disabled={r.idx === 0}>
          <SkipStartIcon />
        </IconButton>
        <IconButton title={t('gtSim.vd.transport.stepBack')} onClick={() => r.stepBy(-1)} disabled={r.idx === 0}>
          <StepBackIcon />
        </IconButton>
        <IconButton
          title={r.playing ? t('gtSim.vd.transport.pause') : t('gtSim.vd.transport.play')}
          onClick={r.togglePlay}
          primary
        >
          {r.playing ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        <IconButton title={t('gtSim.vd.transport.stepForward')} onClick={() => r.stepBy(1)} disabled={r.atEnd}>
          <StepForwardIcon />
        </IconButton>
        <IconButton
          title={t('gtSim.vd.transport.jumpToEnd')}
          onClick={() => r.setIdx(r.lastIdx)}
          disabled={r.atEnd}
        >
          <SkipEndIcon />
        </IconButton>
        <IconButton title={t('gtSim.vd.transport.loop')} onClick={() => r.setLoop((v) => !v)} active={r.loop}>
          <LoopIcon />
        </IconButton>
      </div>
      <div className="inline-flex gap-0.5 border border-[var(--color-glass-edge)] p-0.5">
        {[0.5, 1, 2, 4].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => r.setSpeed(s)}
            className={`px-1.5 py-0.5 text-[11px] rounded-none cursor-pointer ${
              r.speed === s
                ? 'bg-[var(--color-accent-vivid)]/80 text-[var(--color-bg-void)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)]'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
      <span className="text-xs font-mono text-[var(--color-text-secondary)]">
        t = {r.frame?.sim_time.toFixed(2)}s ({r.idx + 1}/{frames.length})
      </span>
    </>
  );
}

/* ---------- Timeline (scrub + markers) ---------- */

export function Timeline({
  frames,
  idx,
  events,
  fails,
  onSeek,
}: {
  frames: VdTelemetryFrame[];
  idx: number;
  events: EventMarker[];
  fails: { idx: number; t?: number; event: string; reason?: string }[];
  onSeek: (i: number) => void;
}) {
  const { t } = useTranslation('common');
  if (frames.length === 0) return null;
  const t0 = frames[0].sim_time;
  const span = Math.max(1e-3, frames[frames.length - 1].sim_time - t0);
  const pct = (time: number) => `${((time - t0) / span) * 100}%`;

  // Markers carry kind + params (lib/replay.ts); labels resolve here via i18n.
  const markerLabel = (m: EventMarker): string => {
    switch (m.kind) {
      case 'start':
        return t('gtSim.vd.transport.legendStart');
      case 'stop':
        return t('gtSim.vd.transport.legendStop');
      case 'lane':
        return t('gtSim.vd.transport.markerLaneChange', { from: m.laneFrom, to: m.laneTo });
      case 'override_on':
        return t('gtSim.vd.transport.markerOverrideOn');
      case 'override_off':
        return t('gtSim.vd.transport.markerOverrideOff');
    }
  };

  return (
    <div className="shrink-0">
      <div className="relative h-4">
        {events.map((m, i) => (
          <button
            key={`ev-${i}`}
            type="button"
            onClick={() => onSeek(m.idx)}
            title={`${markerLabel(m)} @ ${m.t.toFixed(1)}s`}
            className="absolute top-1 -translate-x-1/2 w-1.5 h-3 rounded-none hover:scale-y-125 transition-transform cursor-pointer"
            style={{ left: pct(m.t), background: m.color }}
          />
        ))}
        {fails.map((m, i) => (
          <button
            key={`fl-${i}`}
            type="button"
            onClick={() => onSeek(m.idx)}
            title={`${t('gtSim.vd.transport.failMarkerTitle', { event: m.event })}${m.reason ? ` — ${m.reason}` : ''}`}
            className="absolute -top-0.5 -translate-x-1/2 w-0 h-0 hover:scale-125 transition-transform cursor-pointer"
            style={{
              left: pct(m.t ?? frames[m.idx].sim_time),
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '6px solid var(--color-destructive)',
            }}
          />
        ))}
      </div>
      <input
        type="range"
        min={0}
        max={frames.length - 1}
        value={idx}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="w-full accent-[var(--color-accent-vivid)]"
      />
      <div className="flex gap-3 text-[10px] text-[var(--color-text-tertiary)] mt-1 flex-wrap">
        <Legend color="#4FD18B" label={t('gtSim.vd.transport.legendStart')} />
        <Legend color="#E8884F" label={t('gtSim.vd.transport.legendStop')} />
        <Legend color="#7B88E8" label={t('gtSim.vd.transport.legendLaneChange')} />
        <Legend color="#E8C84F" label={t('gtSim.vd.transport.legendOverride')} />
        {fails.length > 0 && <Legend color="var(--color-destructive)" label={t('gtSim.vd.transport.legendFail')} />}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block w-2 h-2 rounded-none" style={{ background: color }} />
      {label}
    </span>
  );
}

/* ---------- icon button + icons ---------- */

function IconButton({
  title,
  onClick,
  disabled,
  primary,
  active,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-none transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
        primary
          ? 'bg-[var(--color-accent-vivid)]/80 text-[var(--color-bg-void)] hover:bg-[var(--color-accent-vivid)]'
          : active
            ? 'bg-[var(--color-accent-vivid)]/30 text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}

const ICON = 'w-3.5 h-3.5';

const SkipStartIcon = () => (
  <svg className={ICON} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 6h2v12H6zM19 6v12l-9-6z" />
  </svg>
);
const SkipEndIcon = () => (
  <svg className={ICON} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16 6h2v12h-2zM5 6v12l9-6z" />
  </svg>
);
const StepBackIcon = () => (
  <svg
    className={ICON}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 7l-5 5 5 5" />
  </svg>
);
const StepForwardIcon = () => (
  <svg
    className={ICON}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10 7l5 5-5 5" />
  </svg>
);
const PlayIcon = () => (
  <svg className={ICON} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9 6v12l9-6z" />
  </svg>
);
const PauseIcon = () => (
  <svg className={ICON} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
  </svg>
);
const LoopIcon = () => (
  <svg
    className={ICON}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

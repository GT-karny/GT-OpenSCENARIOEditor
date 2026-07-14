/**
 * `HvdGaugePanel` — HostVehicleData gauge cluster (`side` slot, order 21).
 *
 * Rewritten from the fork's `components/HvdGaugePanel.tsx`, which was a pure
 * presentational component composed inside `OsiLivePanel`
 * (`hvd`/`lights` props). Registered panels are prop-less and self-contained
 * (`ExecutionPanelComponent`, `panel-registry.ts`) and the trunk brief
 * registers this as its own `side` panel — so it now subscribes to its own
 * OSI stream via `useOsiStream` (see `OsiLivePanel.tsx` for the resulting
 * multi-connection tradeoff). Gauge rendering logic is unchanged.
 */
import { useMemo } from 'react';
import { useTranslation } from '@osce/i18n';
import { useLiveViewStore } from '../stores/live-view-store';
import { useOsiStream, type HvdData } from '../hooks/useOsiStream';
import { EmptyState } from '../../ui';

interface EgoLights {
  head_light: string;
  indicator: string;
  brake_light: string;
}

/* ---------- SVG arc helpers ---------- */

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/* ---------- VerticalBarGauge ---------- */

function VerticalBarGauge({
  label,
  value,
  fillVar,
  height = 80,
}: {
  label: string;
  value: number;
  fillVar: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  const fillH = clamped * height;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
      <svg width="32" height={height}>
        <rect width="32" height={height} fill="var(--color-glass-1)" />
        <rect y={height - fillH} width="32" height={fillH} fill={fillVar} />
      </svg>
      <span className="text-xs font-mono text-[var(--color-text-primary)]">{(clamped * 100).toFixed(0)}%</span>
    </div>
  );
}

/* ---------- SteeringIndicator ---------- */

function SteeringIndicator({ label, angle }: { label: string; angle: number }) {
  // angle in radians; positive = left per OSI convention
  const deg = -(angle * 180) / Math.PI;
  const clampedDeg = Math.max(-540, Math.min(540, deg));
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
      <svg width="64" height="64" viewBox="-32 -32 64 64">
        <circle r="28" fill="none" stroke="var(--color-glass-edge)" strokeWidth="3" />
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="-24"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${clampedDeg})`}
        />
        <circle r="3" fill="var(--color-text-secondary)" />
      </svg>
      <span className="text-xs font-mono text-[var(--color-text-primary)]">{((angle * 180) / Math.PI).toFixed(1)}&deg;</span>
    </div>
  );
}

/* ---------- SpeedDisplay ---------- */

function SpeedDisplay({ label, unit, speed }: { label: string; unit: string; speed: number }) {
  const kmh = speed * 3.6;
  const barRatio = Math.min(1, kmh / 200);
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
      <div className="text-2xl font-mono font-bold text-[var(--color-text-primary)] leading-none">{kmh.toFixed(1)}</div>
      <div className="text-[10px] text-[var(--color-text-tertiary)]">{unit}</div>
      <div className="w-16 h-1.5 bg-[var(--color-glass-1)] overflow-hidden">
        <div
          className="h-full transition-all duration-150 rounded-full"
          style={{ width: `${barRatio * 100}%`, background: 'var(--color-accent)' }}
        />
      </div>
      <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">{speed.toFixed(1)} m/s</span>
    </div>
  );
}

/* ---------- ArcGauge (RPM) ---------- */

function ArcGauge({
  label,
  value,
  min = 0,
  max = 8000,
  unit = '',
  warningThreshold,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  warningThreshold?: number;
}) {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const startAngle = -135;
  const endAngle = 135;
  const sweepAngle = startAngle + ratio * (endAngle - startAngle);
  const r = 28;

  const bgArc = describeArc(0, 0, r, startAngle, endAngle);
  const fillArc = describeArc(0, 0, r, startAngle, sweepAngle);

  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const nx = r * 0.85 * Math.cos(toRad(sweepAngle));
  const ny = r * 0.85 * Math.sin(toRad(sweepAngle));

  const isWarning = warningThreshold !== undefined && value >= warningThreshold;
  const arcColor = isWarning ? 'var(--color-destructive)' : 'var(--color-warning)';

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
      <svg width="72" height="52" viewBox="-36 -36 72 36">
        <path d={bgArc} fill="none" stroke="var(--color-glass-edge)" strokeWidth="4" strokeLinecap="round" />
        <path d={fillArc} fill="none" stroke={arcColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="0" y1="0" x2={nx} y2={ny} stroke={arcColor} strokeWidth="2" strokeLinecap="round" />
        <circle r="2.5" fill="var(--color-text-secondary)" />
      </svg>
      <span className="text-xs font-mono text-[var(--color-text-primary)]">
        {value.toFixed(0)} {unit}
      </span>
    </div>
  );
}

/* ---------- GearIndicator ---------- */

function GearIndicator({ label, gear }: { label: string; gear: number }) {
  const display = gear < 0 ? 'R' : gear === 0 ? 'N' : String(gear);
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
      <div className="w-10 h-10 flex items-center justify-center bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)]">
        <span className="text-xl font-bold font-mono text-[var(--color-text-primary)]">{display}</span>
      </div>
    </div>
  );
}

/* ---------- LightIndicators ---------- */

function LightDot({ label, active, activeVar }: { label: string; active: boolean; activeVar: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ background: active ? activeVar : 'var(--color-glass-edge)' }}
      />
      <span className={`text-xs ${active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}>{label}</span>
    </div>
  );
}

function LightIndicators({
  lights,
  labels,
}: {
  lights: EgoLights;
  labels: { head: string; turnLeft: string; turnRight: string; brake: string };
}) {
  const headOn = lights.head_light === 'on';
  const leftOn = lights.indicator === 'left' || lights.indicator === 'warning';
  const rightOn = lights.indicator === 'right' || lights.indicator === 'warning';
  const brakeOn = lights.brake_light !== 'off';
  const brakeStrong = lights.brake_light === 'strong';

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <LightDot label={labels.head} active={headOn} activeVar="rgb(250 204 21)" />
      <LightDot label={labels.turnLeft} active={leftOn} activeVar="rgb(245 158 11)" />
      <LightDot label={labels.turnRight} active={rightOn} activeVar="rgb(245 158 11)" />
      <LightDot label={labels.brake} active={brakeOn} activeVar={brakeStrong ? 'rgb(248 113 113)' : 'rgb(220 38 38)'} />
    </div>
  );
}

/* ---------- Main panel ---------- */

function HvdGaugeBody({ hvd, lights }: { hvd: HvdData | null; lights: EgoLights | null }) {
  const { t } = useTranslation('common');
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">{t('gtSim.live.hvd.title')}</h3>
        {hvd && (
          <span className="text-xs text-[var(--color-text-secondary)]">
            {t('gtSim.live.hvd.time', { time: hvd.sim_time.toFixed(2) })}
          </span>
        )}
      </div>

      {hvd && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 justify-items-center mb-4">
          <VerticalBarGauge label={t('gtSim.live.hvd.throttle')} value={hvd.throttle} fillVar="var(--color-success)" />
          <VerticalBarGauge label={t('gtSim.live.hvd.brake')} value={hvd.brake} fillVar="var(--color-destructive)" />
          <SteeringIndicator label={t('gtSim.live.hvd.steering')} angle={hvd.steering_angle} />
          <SpeedDisplay label={t('gtSim.live.hvd.speed')} unit={t('gtSim.live.hvd.unitKmh')} speed={hvd.speed} />
          <ArcGauge label={t('gtSim.live.hvd.rpm')} value={hvd.rpm} min={0} max={8000} unit={t('gtSim.live.hvd.unitRpm')} warningThreshold={6500} />
          <GearIndicator label={t('gtSim.live.hvd.gear')} gear={hvd.gear} />
        </div>
      )}

      {lights && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-secondary)] mr-1">{t('gtSim.live.hvd.lights.label')}</span>
          <LightIndicators
            lights={lights}
            labels={{
              head: t('gtSim.live.hvd.lights.head'),
              turnLeft: t('gtSim.live.hvd.lights.turnLeft'),
              turnRight: t('gtSim.live.hvd.lights.turnRight'),
              brake: t('gtSim.live.hvd.lights.brake'),
            }}
          />
        </div>
      )}
    </div>
  );
}

export function HvdGaugePanel() {
  const { t } = useTranslation('common');
  const jobId = useLiveViewStore((s) => s.watchedJobId);
  const { hvdData, objects } = useOsiStream(jobId);

  const egoLights = useMemo<EgoLights | null>(() => {
    if (objects.length === 0) return null;
    const o = objects[0];
    return { head_light: o.head_light ?? 'off', indicator: o.indicator ?? 'off', brake_light: o.brake_light ?? 'off' };
  }, [objects]);

  return (
    <section className="p-4 border-b border-[var(--color-glass-edge-mid)]">
      {!jobId || (!hvdData && !egoLights) ? (
        <EmptyState message={t('gtSim.live.jobPicker.empty')} />
      ) : (
        <HvdGaugeBody hvd={hvdData} lights={egoLights} />
      )}
    </section>
  );
}

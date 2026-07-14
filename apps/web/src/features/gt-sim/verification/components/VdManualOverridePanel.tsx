/**
 * Live manual-override control for VirtualDriver. Streams pedal/steer/indicator
 * commands to the backend over `/ws/input/{jobId}` via `@osce/esmini`'s
 * `GtSimInputClient` (packs them into the NetworkInputBridge wire format and
 * forwards via UDP to GT_Sim). Requires the run to have been launched with
 * manual override enabled (input_type=network).
 *
 * Ported from the fork's `components/verification/VdManualOverridePanel.tsx`,
 * retargeted at `GtSimInputClient` (host-injected WS base URL) instead of the
 * fork's same-origin raw `WebSocket`, and restyled with APEX tokens. No
 * gamepad dependency in the fork source for this panel (keyboard/mouse
 * sliders only) — nothing to substitute for cluster C's
 * `useGamepadButtonCapture`.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { GT_SIM_INPUT_BUTTONS, GtSimInputClient } from '@osce/esmini';
import type { GtSimInputCommand, GtSimWsConnectionState } from '@osce/esmini';
import { useGtSimWsBaseUrl } from '../../lib';

export function VdManualOverridePanel({ jobId }: { jobId: string }) {
  const { t } = useTranslation('common');
  const wsBaseUrl = useGtSimWsBaseUrl();
  const [steering, setSteering] = useState(0);
  const [throttle, setThrottle] = useState(0);
  const [brake, setBrake] = useState(0);
  const [override, setOverride] = useState(false);
  const [left, setLeft] = useState(false);
  const [right, setRight] = useState(false);
  const [hazard, setHazard] = useState(false);
  const [connState, setConnState] = useState<GtSimWsConnectionState>('disconnected');

  // Latest command, read by the send interval (avoids re-opening the socket).
  const cmdRef = useRef<GtSimInputCommand>({ steering, throttle, brake, buttons: 0 });

  useEffect(() => {
    let buttons = 0;
    if (override) buttons |= GT_SIM_INPUT_BUTTONS.OVERRIDE;
    if (left) buttons |= GT_SIM_INPUT_BUTTONS.INDICATOR_LEFT;
    if (right) buttons |= GT_SIM_INPUT_BUTTONS.INDICATOR_RIGHT;
    if (hazard) buttons |= GT_SIM_INPUT_BUTTONS.HAZARD;
    cmdRef.current = { steering, throttle, brake, buttons };
  }, [steering, throttle, brake, override, left, right, hazard]);

  useEffect(() => {
    if (!wsBaseUrl) {
      setConnState('disconnected');
      return;
    }
    const client = new GtSimInputClient({ wsBaseUrl, jobId });
    setConnState(client.state);
    const unsubState = client.onStateChange(setConnState);
    client.connect();
    const stopSending = client.startSending(() => cmdRef.current);

    return () => {
      stopSending();
      unsubState();
      client.dispose();
    };
  }, [wsBaseUrl, jobId]);

  const connected = connState === 'connected';

  // Indicator buttons are mutually exclusive (like a real stalk).
  const toggleLeft = () => {
    setLeft((v) => !v);
    setRight(false);
  };
  const toggleRight = () => {
    setRight((v) => !v);
    setLeft(false);
  };

  return (
    <div className="border border-[var(--color-glass-edge)] p-3 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-[var(--color-text-primary)]">{t('gtSim.vd.override.title')}</span>
        <span className={connected ? 'text-[var(--color-success)]' : 'text-[var(--color-text-tertiary)]'}>
          ● {connected ? t('gtSim.vd.override.linked') : t('gtSim.vd.override.offline')}
        </span>
      </div>

      <Slider label={t('gtSim.vd.override.steer')} min={-1} max={1} step={0.01} value={steering} onChange={setSteering} fmt={(v) => v.toFixed(2)} />
      <Slider
        label={t('gtSim.vd.override.throttle')}
        min={0}
        max={1}
        step={0.01}
        value={throttle}
        onChange={(v) => {
          setThrottle(v);
          if (v > 0) setBrake(0);
        }}
        fmt={(v) => v.toFixed(2)}
      />
      <Slider
        label={t('gtSim.vd.override.brake')}
        min={0}
        max={1}
        step={0.01}
        value={brake}
        onChange={(v) => {
          setBrake(v);
          if (v > 0) setThrottle(0);
        }}
        fmt={(v) => v.toFixed(2)}
      />

      <div className="flex flex-wrap gap-1.5 pt-1">
        <Toggle label={t('gtSim.vd.override.overrideToggle')} active={override} onClick={() => setOverride((v) => !v)} />
        <Toggle label={t('gtSim.vd.override.left')} active={left} onClick={toggleLeft} />
        <Toggle label={t('gtSim.vd.override.right')} active={right} onClick={toggleRight} />
        <Toggle label={t('gtSim.vd.override.hazard')} active={hazard} onClick={() => setHazard((v) => !v)} />
      </div>

      <button
        type="button"
        onClick={() => {
          setSteering(0);
          setThrottle(0);
          setBrake(0);
        }}
        className="w-full mt-1 px-2 py-1 rounded-none border border-[var(--color-glass-edge)] text-[11px] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)] cursor-pointer"
      >
        {t('gtSim.vd.override.center')}
      </button>
      <p className="text-[10px] text-[var(--color-text-tertiary)] leading-tight">{t('gtSim.vd.override.hint')}</p>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  fmt,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  fmt: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-[var(--color-text-tertiary)]">
        <span>{label}</span>
        <span className="font-mono text-[var(--color-text-primary)]">{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-accent-vivid)]"
      />
    </div>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded-none border border-[var(--color-glass-edge)] text-[11px] cursor-pointer ${
        active
          ? 'bg-[var(--color-accent-vivid)]/70 text-[var(--color-bg-void)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)]'
      }`}
    >
      {label}
    </button>
  );
}

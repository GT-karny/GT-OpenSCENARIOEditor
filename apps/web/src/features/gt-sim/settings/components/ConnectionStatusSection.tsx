/**
 * Backend connection status + endpoint display, plus the "connect mode" form
 * (host/port + Connect button) that drives `gtsim:connect`.
 *
 * The fork has no direct equivalent (its NavBar assumes a single always-on
 * backend); this section surfaces `gt-sim-connection-store` — the same state
 * `GtSimStatusBanner` uses — so the settings panel doubles as a diagnostics
 * view (task brief §3: "may include current backend connection state,
 * read-only, and endpoint display").
 *
 * The connect form is how a double-click ("no env vars") launch escapes a
 * permanent `disconnected` state: the user enters host/port and connects; the
 * main process persists the setting (electron-store) so future launches
 * auto-connect. Only rendered when an Electron bridge is present — plain
 * browser dev has no `gtsim:connect` to call.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { Button, Card, NumberInput, TextInput } from '../../ui';
import {
  hasGtSimBridge,
  useGtSimConnectionStore,
  type GtSimConnectionState,
} from '../../stores/gt-sim-connection-store';

const STATE_DOT_CLASS: Record<GtSimConnectionState, string> = {
  ready: 'bg-[var(--color-success)]',
  starting: 'bg-[var(--color-info)] animate-pulse',
  failed: 'bg-[var(--color-destructive)]',
  crashed: 'bg-[var(--color-destructive)]',
  disconnected: 'bg-[var(--color-text-tertiary)]',
};

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 8000;

function isValidPort(port: number): boolean {
  return Number.isFinite(port) && Number.isInteger(port) && port > 0 && port <= 65535;
}

function ConnectForm() {
  const { t } = useTranslation('common');
  const requestConnect = useGtSimConnectionStore((s) => s.requestConnect);

  const [host, setHost] = useState(DEFAULT_HOST);
  const [port, setPort] = useState(DEFAULT_PORT);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Prime the form from the persisted connect setting (if any) so re-opening
  // the settings panel shows what is actually configured, not just defaults.
  useEffect(() => {
    const getConnectConfig = window.electronAPI?.gtSimGetConnectConfig;
    if (!getConnectConfig) return;
    let cancelled = false;
    void getConnectConfig().then((config) => {
      if (cancelled || !config) return;
      setHost(config.host ?? DEFAULT_HOST);
      setPort(config.port);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const portValid = isValidPort(port);

  const handleConnect = async () => {
    if (!portValid) return;
    setConnectError(null);
    setIsConnecting(true);
    try {
      await requestConnect({ host: host.trim() || undefined, port });
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 border-t border-[var(--color-glass-edge)] pt-3">
      <div className="grid grid-cols-2 gap-2">
        <TextInput
          label={t('gtSim.settings.connection.form.hostLabel')}
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder={DEFAULT_HOST}
        />
        <NumberInput
          label={t('gtSim.settings.connection.form.portLabel')}
          value={port}
          onChange={(e) => setPort(Number(e.target.value))}
        />
      </div>
      {!portValid && (
        <p className="text-xs text-[var(--color-destructive)]">
          {t('gtSim.settings.connection.form.invalidPort')}
        </p>
      )}
      <Button size="sm" onClick={() => void handleConnect()} disabled={isConnecting || !portValid}>
        {isConnecting
          ? t('gtSim.settings.connection.form.connecting')
          : t('gtSim.settings.connection.form.connect')}
      </Button>
      {connectError && (
        <p className="text-xs text-[var(--color-destructive)]">
          {t('gtSim.settings.connection.form.connectError', { message: connectError })}
        </p>
      )}
    </div>
  );
}

export function ConnectionStatusSection() {
  const { t } = useTranslation('common');
  const state = useGtSimConnectionStore((s) => s.state);
  const endpoints = useGtSimConnectionStore((s) => s.endpoints);
  const pid = useGtSimConnectionStore((s) => s.pid);

  const stateLabel = t(`gtSim.settings.connection.state.${state}`);

  return (
    <Card title={t('gtSim.settings.connection.title')}>
      <div className="flex items-center gap-2 text-sm">
        <span className={`inline-block size-2 shrink-0 rounded-full ${STATE_DOT_CLASS[state]}`} aria-hidden="true" />
        <span>{stateLabel}</span>
      </div>
      <dl className="mt-2 grid grid-cols-[100px_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-[var(--color-text-secondary)]">{t('gtSim.settings.connection.endpointLabel')}</dt>
        <dd className="truncate font-mono text-xs" title={endpoints?.restBaseUrl ?? undefined}>
          {endpoints?.restBaseUrl ?? t('gtSim.settings.connection.notAvailable')}
        </dd>
        <dt className="text-[var(--color-text-secondary)]">{t('gtSim.settings.connection.pidLabel')}</dt>
        <dd>{pid ?? t('gtSim.settings.connection.notAvailable')}</dd>
      </dl>

      {hasGtSimBridge ? (
        <ConnectForm />
      ) : (
        <p className="mt-3 border-t border-[var(--color-glass-edge)] pt-3 text-xs text-[var(--color-text-tertiary)]">
          {t('gtSim.settings.connection.form.browserHint')}
        </p>
      )}
    </Card>
  );
}

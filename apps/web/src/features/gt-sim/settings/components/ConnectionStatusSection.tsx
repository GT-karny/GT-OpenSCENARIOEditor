/**
 * Read-only backend connection status + endpoint display.
 *
 * The fork has no direct equivalent (its NavBar assumes a single always-on
 * backend); this section surfaces `gt-sim-connection-store` — the same state
 * `GtSimStatusBanner` uses — so the settings panel doubles as a diagnostics
 * view (task brief §3: "may include current backend connection state,
 * read-only, and endpoint display").
 */
import { useTranslation } from '@osce/i18n';
import { Card } from '../../ui';
import { useGtSimConnectionStore, type GtSimConnectionState } from '../../stores/gt-sim-connection-store';

const STATE_DOT_CLASS: Record<GtSimConnectionState, string> = {
  ready: 'bg-[var(--color-success)]',
  starting: 'bg-[var(--color-info)] animate-pulse',
  failed: 'bg-[var(--color-destructive)]',
  crashed: 'bg-[var(--color-destructive)]',
  disconnected: 'bg-[var(--color-text-tertiary)]',
};

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
    </Card>
  );
}

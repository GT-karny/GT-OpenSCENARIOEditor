/**
 * `SvLivePanel` — scenario-variables live table (`side` slot, order 22).
 *
 * Rewritten from the fork's `components/project/SvLivePanel.tsx`. Self-contained
 * per `panel-registry.ts` (no `jobId` prop) — reads the watched job from
 * `live-view-store`.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { useGtSimApi } from '../../lib';
import { useLiveViewStore } from '../stores/live-view-store';
import { useSvStream } from '../hooks/useSvStream';
import { EmptyState } from '../../ui';

function typeOf(value: unknown): 'bool' | 'int' | 'double' | 'string' | 'unknown' {
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'double';
  if (typeof value === 'string') return 'string';
  return 'unknown';
}

function ValueCell({ value }: { value: unknown }) {
  if (typeof value === 'boolean') {
    return (
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: value ? 'var(--color-success)' : 'var(--color-destructive)' }}
        />
        {value ? 'true' : 'false'}
      </span>
    );
  }
  if (typeof value === 'number') {
    return <>{Number.isInteger(value) ? value : value.toFixed(4)}</>;
  }
  return <>{String(value)}</>;
}

const STATUS_DOT: Record<string, string> = {
  connecting: 'bg-[var(--color-warning)]',
  connected: 'bg-[var(--color-success)]',
  disconnected: 'bg-[var(--color-text-tertiary)]',
  error: 'bg-[var(--color-destructive)]',
};

export function SvLivePanel() {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const jobId = useLiveViewStore((s) => s.watchedJobId);
  const { status, variables, simTime } = useSvStream(jobId);
  const [multicast, setMulticast] = useState<{ group: string; port: number } | null>(null);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api
      .getSystemInfo()
      .then((info) => {
        if (cancelled) return;
        if (info.sv_multicast_group && info.sv_multicast_port) {
          setMulticast({ group: info.sv_multicast_group as string, port: info.sv_multicast_port as number });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [api]);

  const dotClass = STATUS_DOT[status] ?? STATUS_DOT.connecting;
  const statusLabel = t(`gtSim.live.status.${status}`, status);
  const entries = Object.entries(variables);

  return (
    <div className="flex flex-col p-3 overflow-hidden border-b border-[var(--color-glass-edge-mid)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h2 className="text-sm font-medium text-[var(--color-text-secondary)]">{t('gtSim.live.sv.title')}</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
          <span className="text-[var(--color-text-secondary)]">{statusLabel}</span>
          {simTime > 0 && (
            <span className="text-[var(--color-text-tertiary)] ml-2">
              {t('gtSim.live.monitor.simTime', { time: simTime.toFixed(2) })}
            </span>
          )}
        </div>
      </div>

      {!jobId ? (
        <EmptyState message={t('gtSim.live.jobPicker.empty')} />
      ) : (
        <>
          {/* Multicast info */}
          {multicast && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-[var(--color-glass-1)] text-xs text-[var(--color-text-tertiary)] shrink-0">
              <span>{t('gtSim.live.sv.multicast')}:</span>
              <code className="font-mono text-[var(--color-text-secondary)]">
                {multicast.group}:{multicast.port}
              </code>
            </div>
          )}

          {/* Table */}
          {entries.length > 0 ? (
            <div className="min-h-0 overflow-auto">
              <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '40%' }} />
                  <col style={{ width: '72px' }} />
                  <col />
                </colgroup>
                <thead>
                  <tr className="text-left text-[var(--color-text-secondary)] text-xs border-b border-[var(--color-glass-edge)]">
                    <th className="py-1.5 pr-4 truncate">{t('gtSim.live.sv.columns.name')}</th>
                    <th className="py-1.5 pr-4">{t('gtSim.live.sv.columns.type')}</th>
                    <th className="py-1.5">{t('gtSim.live.sv.columns.value')}</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {entries.map(([name, value]) => (
                    <tr key={name} className="border-b border-[var(--color-glass-edge)]/50">
                      <td className="py-1.5 pr-4 text-[var(--color-text-primary)] truncate" title={name}>
                        {name}
                      </td>
                      <td className="py-1.5 pr-4 text-[var(--color-text-tertiary)]">{typeOf(value)}</td>
                      <td className="py-1.5 truncate">
                        <ValueCell value={value} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : status === 'connected' ? (
            <p className="text-[var(--color-text-secondary)] text-sm">{t('gtSim.live.sv.waiting')}</p>
          ) : status === 'error' ? (
            <p className="text-[var(--color-destructive)] text-sm">{t('gtSim.live.sv.error')}</p>
          ) : (
            <p className="text-[var(--color-text-tertiary)] text-sm">{t('gtSim.live.sv.empty')}</p>
          )}
        </>
      )}
    </div>
  );
}

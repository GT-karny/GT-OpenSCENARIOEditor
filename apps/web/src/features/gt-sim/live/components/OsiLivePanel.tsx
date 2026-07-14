/**
 * `OsiLivePanel` — raw OSI GroundTruth table (`side` slot). Registered
 * separately from `HvdGaugePanel` (trunk brief §"パネル構成": side slot,
 * order 20/21/22), so unlike the fork it does not compose `HvdGaugePanel`
 * inline — each registered panel is prop-less and self-contained
 * (`ExecutionPanelComponent`, see `panel-registry.ts`), so `HvdGaugePanel`
 * subscribes to its own OSI stream independently.
 *
 * Known tradeoff (documented in the final report): with all three side panels
 * mounted, `useOsiStream` opens 3 independent `/ws/osi/{jobId}` connections
 * for the same job (this panel, `HvdGaugePanel`, and `LiveMonitorPanel`'s main
 * scene). Acceptable for a local dev backend; a shared-connection cache would
 * be a follow-up optimization, out of this lane's scope.
 */
import { useTranslation } from '@osce/i18n';
import { useLiveViewStore } from '../stores/live-view-store';
import { useOsiStream } from '../hooks/useOsiStream';
import { EmptyState } from '../../ui';

const STATUS_DOT: Record<string, string> = {
  connecting: 'bg-[var(--color-warning)]',
  connected: 'bg-[var(--color-success)]',
  disconnected: 'bg-[var(--color-text-tertiary)]',
  error: 'bg-[var(--color-destructive)]',
};

export function OsiLivePanel() {
  const { t } = useTranslation('common');
  const jobId = useLiveViewStore((s) => s.watchedJobId);
  const { status, objects, simTime, frameCount } = useOsiStream(jobId);

  const dotClass = STATUS_DOT[status] ?? STATUS_DOT.connecting;
  const statusLabel = t(`gtSim.live.status.${status}`, status);

  return (
    <section className="p-4 border-b border-[var(--color-glass-edge-mid)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-[var(--color-text-secondary)]">{t('gtSim.live.osi.title')}</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
          <span className="text-[var(--color-text-secondary)]">{statusLabel}</span>
          {frameCount > 0 && (
            <span className="text-[var(--color-text-tertiary)] ml-2">
              {t('gtSim.live.monitor.frameCount', { count: frameCount })}
            </span>
          )}
        </div>
      </div>

      {!jobId ? (
        <EmptyState message={t('gtSim.live.jobPicker.empty')} />
      ) : objects.length > 0 ? (
        <>
          <div className="text-xs text-[var(--color-text-secondary)] mb-2">
            {t('gtSim.live.osi.summary', { time: simTime.toFixed(2), count: objects.length })}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-text-secondary)] text-xs border-b border-[var(--color-glass-edge)]">
                  <th className="py-1.5 pr-4">{t('gtSim.live.osi.columns.id')}</th>
                  <th className="py-1.5 pr-4">{t('gtSim.live.osi.columns.x')}</th>
                  <th className="py-1.5 pr-4">{t('gtSim.live.osi.columns.y')}</th>
                  <th className="py-1.5 pr-4">{t('gtSim.live.osi.columns.speed')}</th>
                  <th className="py-1.5">{t('gtSim.live.osi.columns.heading')}</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {objects.map((obj) => (
                  <tr key={obj.id} className="border-b border-[var(--color-glass-edge)]/50">
                    <td className="py-1.5 pr-4 text-[var(--color-text-primary)]">{obj.id}</td>
                    <td className="py-1.5 pr-4">{obj.x.toFixed(2)}</td>
                    <td className="py-1.5 pr-4">{obj.y.toFixed(2)}</td>
                    <td className="py-1.5 pr-4">{obj.speed.toFixed(2)}</td>
                    <td className="py-1.5">{obj.h.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : status === 'connected' ? (
        <p className="text-[var(--color-text-secondary)] text-sm">{t('gtSim.live.osi.waiting')}</p>
      ) : status === 'error' ? (
        <p className="text-[var(--color-destructive)] text-sm">{t('gtSim.live.osi.error')}</p>
      ) : null}
    </section>
  );
}

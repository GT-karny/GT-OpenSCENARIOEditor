/**
 * GT_Sim UI primitive — StatusBadge.
 *
 * Ported from the GT_Sim fork's `components/ui/Badge.tsx`. The `status`
 * literal set mirrors `GtSimJobStatus` in `packages/esmini/src/client/gt-sim-status.ts`
 * (queued/running/completed/failed/cancelled/timeout) — re-declared locally
 * rather than imported because `apps/web/package.json` does not depend on
 * `@osce/esmini` (unwired per the migration appendix §E) and this lane may
 * not add the dependency. Keep the two lists in sync if the contract changes.
 */
import { useTranslation } from '@osce/i18n';
import { cn } from '@/lib/utils';

/** Mirrors `packages/esmini` `GtSimJobStatus` — see file header. */
export type GtSimJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';

const STATUS_STYLES: Record<GtSimJobStatus, string> = {
  queued: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)] border-[var(--color-warning)]/30',
  running: 'bg-[var(--color-info)]/20 text-[var(--color-info)] border-[var(--color-info)]/30',
  completed: 'bg-[var(--color-success)]/20 text-[var(--color-success)] border-[var(--color-success)]/30',
  failed: 'bg-[var(--color-destructive)]/20 text-[var(--color-destructive)] border-[var(--color-destructive)]/30',
  cancelled: 'bg-[var(--color-glass-1)] text-[var(--color-text-secondary)] border-[var(--color-glass-edge)]',
  timeout: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)] border-[var(--color-warning)]/30',
};

function isKnownStatus(status: string): status is GtSimJobStatus {
  return Object.prototype.hasOwnProperty.call(STATUS_STYLES, status);
}

export interface StatusBadgeProps {
  /** Raw job status string (fork-compatible — kept as `string`, not narrowed). */
  status: string;
  bordered?: boolean;
  className?: string;
}

export function StatusBadge({ status, bordered = false, className }: StatusBadgeProps) {
  const { t } = useTranslation('common');
  // `isKnownStatus` is checked directly (not via an intermediate boolean) so
  // TypeScript narrows `status` to the `GtSimJobStatus` literal union inside
  // the branch — required for the translated key template to type-check.
  let style = '';
  let label: string = status;
  if (isKnownStatus(status)) {
    style = STATUS_STYLES[status];
    // Unknown statuses render verbatim (fork behavior); known ones are
    // translated with the raw value as the i18next fallback default.
    label = t(`gtSim.ui.statusBadge.${status}`, status);
  }

  return (
    <span className={cn('inline-block rounded-none px-2 py-0.5 text-xs font-medium', style, bordered && 'border', className)}>
      {label}
    </span>
  );
}

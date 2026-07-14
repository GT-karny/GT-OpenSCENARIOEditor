/**
 * GT_Sim backend status banner.
 *
 * Subscribes to `gt-sim-connection-store` and surfaces the backend lifecycle:
 *  - `starting`  → spinner (backend is spawning / waiting for health).
 *  - `failed` / `crashed` → error with restart guidance.
 *  - `disconnected` → backend not started (Electron) or no bridge (browser).
 *  - `ready` → nothing (the panels take over); returns `null`.
 *
 * Contract note (L2): there is no explicit `disabled` state — "no status push
 * ever received + endpoints=null" means the backend was not started / is
 * disabled for this launch; that is the `disconnected` case here.
 *
 * Styling follows the editor glass/theme-apex token vocabulary used across the
 * existing UI (see `--color-*` tokens).
 */
import { useTranslation } from '@osce/i18n';
import { AlertTriangle, Loader2, PlugZap } from 'lucide-react';
import { useGtSimConnectionStore, hasGtSimBridge } from '../stores/gt-sim-connection-store';

type Tone = 'info' | 'progress' | 'error';

const TONE_STYLE: Record<Tone, string> = {
  info: 'text-[var(--color-text-secondary)] border-[var(--color-glass-edge-mid)] bg-[var(--color-glass-2)]',
  progress:
    'text-[var(--color-accent)] border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)]',
  error:
    'text-[var(--color-danger,#ef4444)] border-[color-mix(in_srgb,var(--color-danger,#ef4444)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-danger,#ef4444)_12%,transparent)]',
};

export function GtSimStatusBanner() {
  const { t } = useTranslation('common');
  const state = useGtSimConnectionStore((s) => s.state);
  const message = useGtSimConnectionStore((s) => s.message);

  // Ready: the backend is connected; panels own the surface.
  if (state === 'ready') return null;

  let tone: Tone;
  let icon: React.ReactNode;
  let title: string;
  let detail: string;

  switch (state) {
    case 'starting':
      tone = 'progress';
      icon = <Loader2 className="size-4 animate-spin" />;
      title = t('gtSim.banner.startingTitle');
      detail = t('gtSim.banner.startingDetail');
      break;
    case 'failed':
      tone = 'error';
      icon = <AlertTriangle className="size-4" />;
      title = t('gtSim.banner.failedTitle');
      detail = message ?? t('gtSim.banner.failedDetail');
      break;
    case 'crashed':
      tone = 'error';
      icon = <AlertTriangle className="size-4" />;
      title = t('gtSim.banner.crashedTitle');
      detail = message ?? t('gtSim.banner.crashedDetail');
      break;
    case 'disconnected':
    default:
      tone = 'info';
      icon = <PlugZap className="size-4" />;
      title = t('gtSim.banner.disconnectedTitle');
      detail = hasGtSimBridge
        ? t('gtSim.banner.disconnectedDetailBridge')
        : t('gtSim.banner.disconnectedDetailBrowser');
      break;
  }

  return (
    <div
      role="status"
      className={`flex items-center gap-2.5 px-4 py-2 text-xs border-b ${TONE_STYLE[tone]}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="font-medium">{title}</span>
      <span className="opacity-80">{detail}</span>
    </div>
  );
}

/**
 * Execution-target switcher — WASM (in-browser preview) vs GT_Sim (backend
 * production run). Rendered next to `SimulationButtons` (WP5).
 *
 * GT_Sim is only selectable once `gt-sim-connection-store` reports `ready`
 * (migration instructions: "GT_Sim選択時はバックエンドready必須"); otherwise
 * the option is disabled with a tooltip explaining why. The native-window
 * toggle here only affects GT_Sim runs (`execution.headless: false`) — see
 * `use-gtsim-simulation.ts`.
 *
 * The whole switcher is disabled while a simulation is running: Stop must
 * address the backend the run was started on, so the selection may not change
 * mid-run (review finding — switching targets mid-run would strand the
 * running WASM playback / GT_Sim job behind a no-op Stop). `runningTarget`
 * in the store is the second line of defense for the same hazard.
 */
import { useTranslation } from '@osce/i18n';
import { ChevronDown, Cpu, Monitor, Server } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useSimulationStore } from '@/features/simulation/stores/simulation-store';
import { useGtSimConnectionStore } from '../stores/gt-sim-connection-store';
import { useExecutionTargetStore } from './store';

export function TargetSwitcher({ compact }: { compact?: boolean }) {
  const { t } = useTranslation('common');
  const target = useExecutionTargetStore((s) => s.target);
  const nativeWindow = useExecutionTargetStore((s) => s.nativeWindow);
  const setTarget = useExecutionTargetStore((s) => s.setTarget);
  const setNativeWindow = useExecutionTargetStore((s) => s.setNativeWindow);
  const gtSimReady = useGtSimConnectionStore((s) => s.state === 'ready');
  const isRunning = useSimulationStore((s) => s.status === 'running');

  const label =
    target === 'gt-sim' ? t('gtSim.target.switcher.gtSimLabel') : t('gtSim.target.switcher.wasmLabel');
  const Icon = target === 'gt-sim' ? Server : Cpu;

  return (
    <DropdownMenu>
      {/* A native `title` (not a Radix Tooltip) — this trigger already
          composes one `asChild` layer onto `Button`; stacking a Tooltip's
          own `asChild` on top is fragile (nested Slot merging) for a label
          that's usually visible as plain text anyway. */}
      <DropdownMenuTrigger asChild disabled={isRunning}>
        <Button
          variant="ghost"
          size={compact ? 'icon' : 'sm'}
          className={compact ? 'h-8 w-8' : 'text-xs gap-1'}
          disabled={isRunning}
          aria-label={t('gtSim.target.switcher.triggerLabel')}
          title={
            isRunning
              ? t('gtSim.target.switcher.disabledWhileRunning')
              : t('gtSim.target.switcher.triggerTooltip', { target: label })
          }
        >
          <Icon className="h-3.5 w-3.5" />
          {!compact && label}
          {!compact && <ChevronDown className="h-3 w-3 opacity-60" />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuItem
          onClick={() => setTarget('wasm')}
          className={target === 'wasm' ? 'font-bold' : ''}
        >
          <div className="flex flex-col gap-0.5 py-0.5">
            <span>{t('gtSim.target.switcher.wasmLabel')}</span>
            <span className="text-[10px] font-normal text-[var(--color-text-secondary)]">
              {t('gtSim.target.switcher.wasmDescription')}
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => gtSimReady && setTarget('gt-sim')}
          disabled={!gtSimReady}
          className={target === 'gt-sim' ? 'font-bold' : ''}
          title={gtSimReady ? undefined : t('gtSim.target.switcher.gtSimUnavailable')}
        >
          <div className="flex flex-col gap-0.5 py-0.5">
            <span>{t('gtSim.target.switcher.gtSimLabel')}</span>
            <span className="text-[10px] font-normal text-[var(--color-text-secondary)]">
              {gtSimReady
                ? t('gtSim.target.switcher.gtSimDescription')
                : t('gtSim.target.switcher.gtSimUnavailable')}
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={target !== 'gt-sim'}
          onSelect={(e) => {
            // Keep the menu open so the toggle can be flipped repeatedly.
            e.preventDefault();
            if (target === 'gt-sim') setNativeWindow(!nativeWindow);
          }}
          className="flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5" />
            {t('gtSim.target.switcher.nativeWindowLabel')}
          </span>
          <span
            className={
              nativeWindow
                ? 'text-[10px] font-medium text-[var(--color-accent)]'
                : 'text-[10px] text-[var(--color-text-tertiary)]'
            }
          >
            {nativeWindow ? t('gtSim.target.switcher.on') : t('gtSim.target.switcher.off')}
          </span>
        </DropdownMenuItem>

        {target === 'gt-sim' && (
          <div className="mt-1 border-t border-[var(--color-glass-edge)] px-2 py-1.5 text-[10px] text-[var(--color-text-secondary)]">
            {t('gtSim.target.switcher.noStoryboardNotice')}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

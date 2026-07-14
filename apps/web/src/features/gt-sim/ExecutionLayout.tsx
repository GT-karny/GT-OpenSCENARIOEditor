/**
 * ExecutionLayout — the GT_Sim execution mode surface (editor's third mode).
 *
 * Structure (contract C2 — this file must NOT need per-cluster edits in Phase 2):
 *  - A single `QueryClientProvider` scopes react-query to this feature (D5).
 *  - `initGtSimConnection` wires the backend bridge; `GtSimStatusBanner` shows
 *    the lifecycle state.
 *  - Three panel slots — `main` / `side` / `bottom` — are filled purely from the
 *    `panel-registry`. Cluster lanes (B/C/D/E/F/G) register their panels from
 *    their own directories via `registerExecutionPanel`; this layout never
 *    imports them, so it stays conflict-free as clusters land.
 *
 * Phase 1 ships with no registered panels, so every slot renders its empty
 * state. `default` export so `EditorLayout` can `React.lazy` it and keep
 * react-query out of the scenario/road bundles.
 */
import { useEffect } from 'react';
import { useTranslation } from '@osce/i18n';
import { QueryClientProvider } from '@tanstack/react-query';
import { Boxes } from 'lucide-react';
import './panels';
import { gtSimQueryClient } from './query-client';
import { GtSimStatusBanner } from './components/GtSimStatusBanner';
import { initGtSimConnection } from './stores/gt-sim-connection-store';
import {
  getExecutionPanels,
  getAllExecutionPanels,
  type ExecutionPanelPlacement,
} from './panel-registry';

/** Render the panels registered for a slot, stacked in order. */
function PanelSlot({ placement, className }: { placement: ExecutionPanelPlacement; className?: string }) {
  const panels = getExecutionPanels(placement);
  if (panels.length === 0) return null;
  return (
    <div className={className}>
      {panels.map(({ id, component: Panel }) => (
        <Panel key={id} />
      ))}
    </div>
  );
}

/** Shown when no cluster has registered any panel yet (Phase 1 baseline). */
function ExecutionEmptyState() {
  const { t } = useTranslation('common');
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-6">
      <Boxes className="size-10 text-[var(--color-text-secondary)] opacity-70" />
      <div className="text-sm font-medium text-[var(--color-text-primary)]">
        {t('gtSim.empty.title')}
      </div>
      <p className="max-w-md text-xs text-[var(--color-text-secondary)]">
        {t('gtSim.empty.description')}
      </p>
    </div>
  );
}

export function ExecutionLayout() {
  useEffect(() => initGtSimConnection(), []);

  const hasAnyPanel = getAllExecutionPanels().length > 0;

  return (
    <QueryClientProvider client={gtSimQueryClient}>
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-[var(--color-bg-base,transparent)]">
        <GtSimStatusBanner />

        {hasAnyPanel ? (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* main viewport */}
            <PanelSlot
              placement="main"
              className="flex flex-1 min-w-0 flex-col overflow-hidden"
            />
            {/* right inspector column */}
            <PanelSlot
              placement="side"
              className="flex w-[360px] shrink-0 flex-col overflow-y-auto border-l border-[var(--color-glass-edge-mid)]"
            />
          </div>
        ) : (
          <ExecutionEmptyState />
        )}

        {/* bottom dock strip */}
        <PanelSlot
          placement="bottom"
          className="flex shrink-0 flex-col border-t border-[var(--color-glass-edge-mid)]"
        />
      </div>
    </QueryClientProvider>
  );
}

export default ExecutionLayout;

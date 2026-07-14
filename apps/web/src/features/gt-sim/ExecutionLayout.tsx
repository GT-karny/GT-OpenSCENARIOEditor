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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import './panels';
import { gtSimQueryClient } from './query-client';
import { GtSimStatusBanner } from './components/GtSimStatusBanner';
import { initGtSimConnection } from './stores/gt-sim-connection-store';
import { useMainPanelStore } from './stores/main-panel-store';
import {
  getExecutionPanels,
  getAllExecutionPanels,
  type ExecutionPanelDefinition,
  type ExecutionPanelPlacement,
} from './panel-registry';

/**
 * Translated tab label for a known `main`-slot panel id, falling back to the
 * panel's registered `title` for anything not enumerated here (i18n's typed
 * `t()` rejects dynamic template keys, so this is a static lookup — new
 * `main`-slot panels render with their English `title` until a lane adds a
 * case here).
 */
function useMainTabLabel(): (panel: ExecutionPanelDefinition) => string {
  const { t } = useTranslation('common');
  return (panel) => {
    switch (panel.id) {
      case 'gt-sim-live-monitor':
        return t('gtSim.target.mainTabs.liveMonitor');
      case 'gt-sim-vd-verification':
        return t('gtSim.target.mainTabs.vdVerification');
      default:
        return panel.title;
    }
  };
}

/**
 * The `main` slot: a single panel renders directly; more than one renders as
 * tabs (Radix `Tabs` + `apex-tab`, per `apps/web/CLAUDE.md`'s tab-bar rule) so
 * multiple `main`-placement panels (e.g. Live Monitor + VD Verification, WP4
 * clusters E/F) don't collapse a vertical stack. `forceMount` + CSS-hide
 * keeps inactive panels mounted — both hold live WS subscriptions /
 * in-progress local state that must survive a tab switch (mirrors
 * `verification/VdVerificationPanel.tsx`'s internal tab strip).
 */
function MainPanelSlot({ className }: { className?: string }) {
  const panels = getExecutionPanels('main');
  const activePanelId = useMainPanelStore((s) => s.activePanelId);
  const setActivePanelId = useMainPanelStore((s) => s.setActivePanelId);
  const tabLabel = useMainTabLabel();

  if (panels.length === 0) return null;

  if (panels.length === 1) {
    const { id, component: Panel } = panels[0];
    return (
      <div key={id} className={className}>
        <Panel />
      </div>
    );
  }

  const resolvedActive = panels.some((p) => p.id === activePanelId) ? activePanelId! : panels[0].id;

  return (
    <Tabs value={resolvedActive} onValueChange={setActivePanelId} className={className}>
      <TabsList className="bg-[var(--color-glass-1)] backdrop-blur-[28px] rounded-none p-0 shrink-0">
        {panels.map((panel) => (
          <TabsTrigger key={panel.id} value={panel.id} className="apex-tab flex-1">
            {tabLabel(panel)}
          </TabsTrigger>
        ))}
      </TabsList>
      {panels.map(({ id, component: Panel }) => (
        <TabsContent
          key={id}
          value={id}
          forceMount
          className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <Panel />
        </TabsContent>
      ))}
    </Tabs>
  );
}

/** Render the panels registered for `side`/`bottom` slots, stacked in order. */
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
            <MainPanelSlot className="flex flex-1 min-w-0 flex-col overflow-hidden" />
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

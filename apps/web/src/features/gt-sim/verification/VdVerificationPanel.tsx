/**
 * VD verification panel — cluster F's single `main`-slot panel (see
 * `panel-registry.ts` / `register.ts`). Consolidates the fork's three VD
 * screens (`VerificationReplayPage`, `VerificationAnnotatePage`, and the
 * `VdLivePage` popup window) into one panel with internal tabs, per the
 * migration plan's recommendation for the heaviest cluster (WP4 row 6):
 * "Replay / Annotate / Live" tabs inside a single panel instead of three
 * separate panel registrations.
 *
 * Tab bar follows `apps/web/CLAUDE.md`'s APEX tab-bar rule (Radix `Tabs` +
 * `apex-tab`). Active tab is held in `store/vd-view-store` (D6 — no router).
 */
import { useTranslation } from '@osce/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVdViewStore, type VdVerificationTab } from './store/vd-view-store';
import { ReplayView } from './components/ReplayView';
import { AnnotateView } from './components/AnnotateView';
import { LiveView } from './components/LiveView';

export function VdVerificationPanel() {
  const { t } = useTranslation('common');
  const activeTab = useVdViewStore((s) => s.activeTab);
  const setActiveTab = useVdViewStore((s) => s.setActiveTab);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as VdVerificationTab)}
      className="flex flex-1 min-h-0 flex-col"
    >
      <TabsList className="bg-[var(--color-glass-1)] backdrop-blur-[28px] rounded-none p-0 shrink-0">
        <TabsTrigger value="replay" className="apex-tab flex-1">
          {t('gtSim.vd.tabs.replay')}
        </TabsTrigger>
        <TabsTrigger value="annotate" className="apex-tab flex-1">
          {t('gtSim.vd.tabs.annotate')}
        </TabsTrigger>
        <TabsTrigger value="live" className="apex-tab flex-1">
          {t('gtSim.vd.tabs.live')}
        </TabsTrigger>
      </TabsList>

      {/* forceMount + CSS-hide: tab switches must not unmount the views —
          ReplayView holds the running-job state (mode/runningJobId/…) and the
          embedded LiveVdPanel holds live WS subscriptions; unmounting would
          drop both (the fork's separate live window stayed alive). Pattern
          mirrors ui/SlidePanel.tsx's forceMount usage. */}
      <TabsContent
        value="replay"
        forceMount
        className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
      >
        <ReplayView />
      </TabsContent>
      <TabsContent
        value="annotate"
        forceMount
        className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
      >
        <AnnotateView />
      </TabsContent>
      <TabsContent
        value="live"
        forceMount
        className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
      >
        <LiveView />
      </TabsContent>
    </Tabs>
  );
}

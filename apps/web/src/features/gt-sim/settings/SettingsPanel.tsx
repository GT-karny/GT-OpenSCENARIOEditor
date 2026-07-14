/**
 * Cluster H' — the settings panel registered into the `side` slot (order 90,
 * last in the column since it is the least frequently used surface).
 *
 * Composition root for:
 *  - `ConnectionStatusSection`: read-only backend connection diagnostics.
 *  - `ProjectsRootSection`: projects_root sync (D4) display + manual retry.
 *  - `ExecutionDefaultsSection`: fork's `SettingsForm` port.
 *  - `AutoLightSection`: fork's `AutoLightSection`/`AutoLightForm` port.
 *
 * Unlike the fork's `SettingsPanel` (a `SlidePanel` opened from a NavBar gear
 * icon), this renders inline in the execution mode's side column — the
 * unified UI's `ExecutionLayout` has no NavBar/gear affordance to open a
 * drawer from (migration instruction #1: "App.tsx/NavBar/WindowControls are
 * not ported"), and per the panel-registry contract every `side` panel is
 * self-contained with no open/close props. `useProjectsRootSync` (D4) fires
 * from `ProjectsRootSection` below, which is always mounted as part of this
 * panel — so the sync runs for the whole lifetime of the execution mode, not
 * only while a user is looking at this section.
 */
import { useTranslation } from '@osce/i18n';
import { ConnectionStatusSection } from './components/ConnectionStatusSection';
import { ProjectsRootSection } from './components/ProjectsRootSection';
import { ExecutionDefaultsSection } from './components/ExecutionDefaultsSection';
import { AutoLightSection } from './components/AutoLightSection';

export function SettingsPanel() {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col gap-4 p-3">
      <h2 className="font-display text-sm font-bold tracking-wide text-[var(--color-text-primary)]">
        {t('gtSim.settings.title')}
      </h2>

      <ConnectionStatusSection />
      <ProjectsRootSection />

      <div className="border-b border-[var(--color-glass-edge)]" />
      <ExecutionDefaultsSection />

      <div className="border-b border-[var(--color-glass-edge)]" />
      <AutoLightSection />
    </div>
  );
}

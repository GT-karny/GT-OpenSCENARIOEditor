/**
 * Standalone live VirtualDriver telemetry view (the Live tab). Replaces the
 * fork's `pages/VdLivePage.tsx`, which was a layout-less route intended to be
 * opened in a separate window via `window.open('/live/vd/:jobId?override=1')`
 * (design judgment D6: no separate window in the unified UI — this is a tab
 * of the VD verification panel instead). Job selection + the `override` flag
 * are held in `../store/vd-view-store` (replacing the fork's route param +
 * query string).
 *
 * Defaults to `LIVE_JOB_CURRENT` so the tab is useful before any run is
 * launched — `LiveVdPanel` resolves that to the active running job.
 */
import { useTranslation } from '@osce/i18n';
import { Checkbox, TextInput } from '../../ui';
import { LiveVdPanel } from './LiveVdPanel';
import { LIVE_JOB_CURRENT, useVdViewStore } from '../store/vd-view-store';

export function LiveView() {
  const { t } = useTranslation('common');
  const liveJobId = useVdViewStore((s) => s.liveJobId);
  const setLiveJobId = useVdViewStore((s) => s.setLiveJobId);
  const liveShowOverride = useVdViewStore((s) => s.liveShowOverride);
  const setLiveShowOverride = useVdViewStore((s) => s.setLiveShowOverride);
  const liveProjectId = useVdViewStore((s) => s.liveProjectId);
  const liveScenarioFile = useVdViewStore((s) => s.liveScenarioFile);
  const setLiveScenarioContext = useVdViewStore((s) => s.setLiveScenarioContext);

  return (
    <div className="h-full flex flex-col p-3 gap-3">
      <div className="flex items-center gap-3 flex-wrap text-xs">
        <TextInput
          label={t('gtSim.vd.liveView.jobIdLabel')}
          value={liveJobId}
          onChange={(e) => setLiveJobId(e.target.value || LIVE_JOB_CURRENT)}
          placeholder={LIVE_JOB_CURRENT}
          wrapperClassName="w-56"
        />
        <TextInput
          label={t('gtSim.vd.liveView.projectIdLabel')}
          value={liveProjectId ?? ''}
          onChange={(e) => setLiveScenarioContext(e.target.value || undefined, liveScenarioFile)}
          wrapperClassName="w-40"
        />
        <TextInput
          label={t('gtSim.vd.liveView.scenarioFileLabel')}
          value={liveScenarioFile ?? ''}
          onChange={(e) => setLiveScenarioContext(liveProjectId, e.target.value || undefined)}
          wrapperClassName="w-48"
        />
        <Checkbox
          label={t('gtSim.vd.liveView.showOverride')}
          checked={liveShowOverride}
          onChange={(e) => setLiveShowOverride(e.target.checked)}
        />
      </div>

      <div className="flex-1 min-h-0">
        <LiveVdPanel
          jobId={liveJobId || LIVE_JOB_CURRENT}
          projectId={liveProjectId}
          scenarioFile={liveScenarioFile}
          showOverride={liveShowOverride}
        />
      </div>
    </div>
  );
}

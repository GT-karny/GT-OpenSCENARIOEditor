/**
 * Controller type + Drive Mode + Route Drive lane-change knobs.
 *
 * Ported from the GT_Sim fork's `components/simulation/ControllerSection.tsx`.
 * Restyled with APEX `var(--color-*)` tokens (`rounded-none`, no bare Tailwind
 * color names) and all copy moved to `gtSim.runForm.controller.*` i18n keys —
 * including the fork's hardcoded Japanese `driveModeTooltip`.
 */
import { useTranslation } from '@osce/i18n';
import type { ControllerType, DriveMode, LaneChangeGap, LaneChangeTiming } from '../types';

export interface ControllerSectionProps {
  controllerType: ControllerType;
  setControllerType: (v: ControllerType) => void;
  onOpenManualSettings?: () => void;
  driveMode: DriveMode;
  setDriveMode: (v: DriveMode) => void;
  // RouteDrive lane-change timing knobs — only shown when Route Drive is enabled.
  routeDriveMode?: boolean;
  laneChangeTiming: LaneChangeTiming;
  setLaneChangeTiming: (v: LaneChangeTiming) => void;
  laneChangeGap: LaneChangeGap;
  setLaneChangeGap: (v: LaneChangeGap) => void;
}

const btnBase = 'px-4 py-2 text-sm font-medium transition-colors cursor-pointer rounded-none';
const btnActive = 'bg-[var(--color-accent-vivid)]/80 text-[var(--color-bg-void)] glow-edge';
const btnInactive =
  'bg-[var(--color-glass-1)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)] hover:text-[var(--color-foreground)]';

const modeBtnBase =
  'px-2.5 py-1 text-xs font-medium rounded-none transition-colors cursor-pointer';
const modeBtnActive = 'bg-[var(--color-info)] text-[var(--color-bg-void)]';
const modeBtnInactive =
  'bg-[var(--color-glass-1)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)] hover:text-[var(--color-foreground)]';

export function ControllerSection({
  controllerType,
  setControllerType,
  onOpenManualSettings,
  driveMode,
  setDriveMode,
  routeDriveMode,
  laneChangeTiming,
  setLaneChangeTiming,
  laneChangeGap,
  setLaneChangeGap,
}: ControllerSectionProps) {
  const { t } = useTranslation('common');

  const driveModes: DriveMode[] = ['comfort', 'sport'];
  const timings: LaneChangeTiming[] = ['late', 'normal', 'early'];
  const gaps: LaneChangeGap[] = ['wide', 'normal', 'tight'];

  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <h3 className="text-xs text-[var(--color-text-tertiary)]">
          {t('gtSim.runForm.controller.heading')}
        </h3>
        <div
          className="flex items-center gap-1.5"
          title={t('gtSim.runForm.controller.driveModeTooltip')}
        >
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {t('gtSim.runForm.controller.driveMode')}
          </span>
          <div className="inline-flex items-center gap-0.5 rounded-none border border-[var(--color-glass-edge)] p-0.5">
            {driveModes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDriveMode(m)}
                className={`${modeBtnBase} ${driveMode === m ? modeBtnActive : modeBtnInactive}`}
              >
                {t(`gtSim.runForm.controller.${m}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setControllerType('default')}
          className={`${btnBase} ${controllerType === 'default' ? btnActive : btnInactive}`}
        >
          {t('gtSim.runForm.controller.default')}
        </button>
        <button
          type="button"
          onClick={() => setControllerType('manual')}
          className={`${btnBase} ${controllerType === 'manual' ? btnActive : btnInactive} flex items-center gap-1.5`}
        >
          {t('gtSim.runForm.controller.manual')}
          {controllerType === 'manual' && onOpenManualSettings && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 opacity-70 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onOpenManualSettings();
              }}
            >
              <path
                fillRule="evenodd"
                d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.993 6.993 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={() => setControllerType('virtual_driver')}
          title={t('gtSim.runForm.controller.virtualDriverTooltip')}
          className={`${btnBase} ${controllerType === 'virtual_driver' ? btnActive : btnInactive}`}
        >
          {t('gtSim.runForm.controller.virtualDriver')}
        </button>
      </div>

      {controllerType === 'manual' && (
        <div className="text-xs text-[var(--color-text-tertiary)]">
          {t('gtSim.runForm.controller.manualHint')}
        </div>
      )}

      {routeDriveMode && (
        <div
          className="flex flex-col gap-2 mt-1"
          title={t('gtSim.runForm.controller.laneChangeTooltip')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {t('gtSim.runForm.controller.laneChangeTiming')}
            </span>
            <div className="inline-flex items-center gap-0.5 rounded-none border border-[var(--color-glass-edge)] p-0.5">
              {timings.map((tOpt) => (
                <button
                  key={tOpt}
                  type="button"
                  onClick={() => setLaneChangeTiming(tOpt)}
                  className={`${modeBtnBase} ${laneChangeTiming === tOpt ? modeBtnActive : modeBtnInactive}`}
                >
                  {t(`gtSim.runForm.controller.timing.${tOpt}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {t('gtSim.runForm.controller.laneChangeGap')}
            </span>
            <div className="inline-flex items-center gap-0.5 rounded-none border border-[var(--color-glass-edge)] p-0.5">
              {gaps.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setLaneChangeGap(g)}
                  className={`${modeBtnBase} ${laneChangeGap === g ? modeBtnActive : modeBtnInactive}`}
                >
                  {t(`gtSim.runForm.controller.gap.${g}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

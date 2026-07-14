/**
 * Row of icon toggles for the most-used execution flags.
 *
 * Ported from the GT_Sim fork's `components/simulation/QuickOptionsBar.tsx`,
 * unchanged behavior/icons — labels moved to `gtSim.runForm.quickOptions.*`.
 */
import { useTranslation } from '@osce/i18n';
import { IconToggle } from '../../ui';

export interface QuickOptionsBarProps {
  headless: boolean;
  setHeadless: (v: boolean) => void;
  record: boolean;
  setRecord: (v: boolean) => void;
  noRealtime: boolean;
  setNoRealtime: (v: boolean) => void;
  autolight: boolean;
  setAutolight: (v: boolean) => void;
  autolightHeadlights: boolean;
  setAutolightHeadlights: (v: boolean) => void;
  vehiclePhysics: boolean;
  setVehiclePhysics: (v: boolean) => void;
  kinematicMode: boolean;
  setKinematicMode: (v: boolean) => void;
  routeDriveMode: boolean;
  setRouteDriveMode: (v: boolean) => void;
}

function IconWindow({ headless }: { headless: boolean }) {
  return headless ? (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
      <path d="M2 3h12v8H2V3zm1 1v6h10V4H3zm2 8h6v1H5v-1z" />
      <path d="M1.5 1.5l13 13" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
      <path d="M2 3h12v8H2V3zm1 1v6h10V4H3zm2 8h6v1H5v-1z" />
    </svg>
  );
}

const IconRecord = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <circle cx="8" cy="8" r="5" />
  </svg>
);

const IconFastForward = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M2 3l6 5-6 5V3zm6 0l6 5-6 5V3z" />
  </svg>
);

const IconAutoLight = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M8 1C5.5 1 4 3 4 5.5c0 1.5.7 2.8 1.5 3.5.5.5.5 1 .5 1.5V12h4v-1.5c0-.5 0-1 .5-1.5.8-.7 1.5-2 1.5-3.5C12 3 10.5 1 8 1zm-1 12h2v1H7v-1z" />
  </svg>
);

// Headlight beam — distinct from the AutoLight "bulb" glyph so the two
// toggles read as related-but-different (bulb = master AutoLight, beam = F6
// env headlights).
const IconHeadlight = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M2 5.5C2 4.7 2.7 4 3.5 4H7c1.9 0 3.5 1.6 3.5 4S8.9 12 7 12H3.5C2.7 12 2 11.3 2 10.5v-5z" />
    <path
      d="M12 6.2l2.3-1M12 8h2.5M12 9.8l2.3 1"
      stroke="currentColor"
      strokeWidth="1.1"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const IconVehiclePhysics = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M3 9.5C3 8.1 4.1 7 5.5 7h5C11.9 7 13 8.1 13 9.5V11h-1v1h-2v-1H6v1H4v-1H3V9.5zM5 10a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
    <path d="M4.5 6L5 4.5C5.2 3.6 6 3 7 3h2c1 0 1.8.6 2 1.5L11.5 6h-7z" opacity="0.6" />
  </svg>
);

const IconKinematicMode = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M8 2a6 6 0 110 12A6 6 0 018 2zm0 1.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
    <path
      d="M8 5v3l2.5 1.5"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const IconRouteDrive = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M3 14l4-12h2l4 12h-2l-.8-2.5H5.8L5 14H3zm3.3-4h3.4L8 4.6 6.3 10z" />
    <path
      d="M13 5.5l1.5-1.5M13 8h2"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

export function QuickOptionsBar({
  headless,
  setHeadless,
  record,
  setRecord,
  noRealtime,
  setNoRealtime,
  autolight,
  setAutolight,
  autolightHeadlights,
  setAutolightHeadlights,
  vehiclePhysics,
  setVehiclePhysics,
  kinematicMode,
  setKinematicMode,
  routeDriveMode,
  setRouteDriveMode,
}: QuickOptionsBarProps) {
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <IconToggle
        icon={<IconWindow headless={headless} />}
        label={t('gtSim.runForm.quickOptions.window')}
        active={!headless}
        onChange={(v) => setHeadless(!v)}
      />
      <IconToggle
        icon={<IconRecord />}
        label={t('gtSim.runForm.quickOptions.record')}
        active={record}
        onChange={setRecord}
      />
      <IconToggle
        icon={<IconFastForward />}
        label={t('gtSim.runForm.quickOptions.noRealtime')}
        active={noRealtime}
        onChange={setNoRealtime}
      />
      <IconToggle
        icon={<IconAutoLight />}
        label={t('gtSim.runForm.quickOptions.autolight')}
        active={autolight}
        onChange={setAutolight}
      />
      {/* F6 env-driven headlights — sub-option of AutoLight, only shown when
          AutoLight is on. Adds --autolight-headlights (night/tunnel low beam
          + auto high beam). */}
      {autolight && (
        <IconToggle
          icon={<IconHeadlight />}
          label={t('gtSim.runForm.quickOptions.envHeadlights')}
          active={autolightHeadlights}
          onChange={setAutolightHeadlights}
        />
      )}
      <IconToggle
        icon={<IconVehiclePhysics />}
        label={t('gtSim.runForm.quickOptions.physics')}
        active={vehiclePhysics}
        onChange={setVehiclePhysics}
      />
      <IconToggle
        icon={<IconKinematicMode />}
        label={t('gtSim.runForm.quickOptions.kinematic')}
        active={kinematicMode}
        onChange={setKinematicMode}
      />
      <IconToggle
        icon={<IconRouteDrive />}
        label={t('gtSim.runForm.quickOptions.routeDrive')}
        active={routeDriveMode}
        onChange={setRouteDriveMode}
      />
    </div>
  );
}

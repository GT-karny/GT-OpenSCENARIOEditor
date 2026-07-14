/**
 * Core run form: controller selection, quick options, advanced execution
 * settings, and the Run/Stop actions.
 *
 * Ported from the GT_Sim fork's `components/SimulationRunForm.tsx`, narrowed
 * to how this lane actually uses it: the run-form panel always has a
 * `ParameterPanel` (richer preset tabs + param grid) stacked above this
 * component, so the fork's `hideParams`/inline `ParameterOverrides` branch is
 * dropped — `paramOverrides` always comes from the parent
 * (`RunFormPanel` → `ParameterPanel`). The fork's `compact` toggle is also
 * dropped: this component only ever renders inside the fixed-width `side`
 * panel slot, so compact spacing is unconditional.
 *
 * Two fork behaviors are intentionally NOT ported here (see final report):
 *  - `rerunFrom` (restore options from a previous job) — there is no job
 *    detail page (cluster D) yet to source it from.
 *  - The `window.open('/live/vd/current?...')` "Live Telemetry ↗" button —
 *    deferred to the WP5 cluster E/F integration per the migration
 *    instructions (TODO below).
 */
import { useEffect, useReducer } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import type { ControllerConfig, GtSimSimulationRequest, GtSimSimulationStatus } from '@osce/esmini';
import { useGtSimApi } from '../../lib';
import { Button, Card } from '../../ui';
import { buildRunRequest } from '../lib/build-run-request';
import { DEFAULT_MANUAL_DRIVE_CONFIG, mergeManualDriveConfig } from '../lib/manual-drive-defaults';
import type { ControllerType, DriveMode, LaneChangeGap, LaneChangeTiming, RunFormValues } from '../types';
import { ControllerSection } from './ControllerSection';
import { ManualDriveSettingsPlaceholder } from './ManualDriveSettingsPlaceholder';
import { QuickOptionsBar } from './QuickOptionsBar';
import { AdvancedSettings } from './AdvancedSettings';

const INITIAL_VALUES: RunFormValues = {
  controllerType: 'default',
  manualDriveConfig: DEFAULT_MANUAL_DRIVE_CONFIG,
  driveMode: 'comfort',
  laneChangeTiming: 'normal',
  laneChangeGap: 'normal',
  hz: 100,
  // Unified-UI contract default: headless=true (native OSG window only on
  // explicit opt-in). Diverges from the fork's `false` initial value on
  // purpose — see packages/esmini gt-sim-adapters.ts DEFAULT_GT_SIM_EXECUTION.
  headless: true,
  record: false,
  noRealtime: false,
  timeout: 120,
  osiEnabled: true,
  osiIp: '127.0.0.1',
  autolight: false,
  autolightHeadlights: false,
  vehiclePhysics: false,
  kinematicMode: false,
  routeDriveMode: false,
  threads: false,
  winX: 60,
  winY: 60,
  winW: 1280,
  winH: 720,
};

type ValuesAction = { type: 'patch'; patch: Partial<RunFormValues> };

function valuesReducer(state: RunFormValues, action: ValuesAction): RunFormValues {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    default:
      return state;
  }
}

interface UiState {
  showManualPanel: boolean;
  showAdvanced: boolean;
}

type UiAction = { type: 'patch'; patch: Partial<UiState> };

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    default:
      return state;
  }
}

export interface SimulationRunFormProps {
  projectId: string;
  scenarioFile: string;
  /** Current parameter overrides, owned by the sibling `ParameterPanel`. */
  paramOverrides: Record<string, string>;
  onSubmitted?: (job: GtSimSimulationStatus) => void;
  /** Whether a simulation is currently running (drives Run/Stop enablement). */
  isRunning?: boolean;
  /** Called when Stop is clicked. */
  onStop?: () => void;
  /** Exposes the current request builder to the parent (used by CopyApiRequest). */
  onRequestBuilder?: (builder: (() => GtSimSimulationRequest) | null) => void;
}

export function SimulationRunForm({
  projectId,
  scenarioFile,
  paramOverrides,
  onSubmitted,
  isRunning = false,
  onStop,
  onRequestBuilder,
}: SimulationRunFormProps) {
  const { t } = useTranslation('common');
  const api = useGtSimApi();

  const [values, dispatchValues] = useReducer(valuesReducer, INITIAL_VALUES);
  const {
    controllerType,
    manualDriveConfig,
    driveMode,
    laneChangeTiming,
    laneChangeGap,
    hz,
    headless,
    record,
    noRealtime,
    timeout,
    osiEnabled,
    osiIp,
    autolight,
    autolightHeadlights,
    vehiclePhysics,
    kinematicMode,
    routeDriveMode,
    threads,
    winX,
    winY,
    winW,
    winH,
  } = values;
  const patchValues = (patch: Partial<RunFormValues>) => dispatchValues({ type: 'patch', patch });

  const [ui, dispatchUi] = useReducer(uiReducer, { showManualPanel: false, showAdvanced: false });
  const { showManualPanel, showAdvanced } = ui;
  const patchUi = (patch: Partial<UiState>) => dispatchUi({ type: 'patch', patch });

  // Load saved manual drive config from server.
  const { data: savedManualDriveConfig } = useQuery({
    queryKey: ['config', 'manual-drive'],
    queryFn: () => api!.getManualDriveConfig(),
    enabled: api !== null,
  });
  useEffect(() => {
    if (savedManualDriveConfig) {
      patchValues({ manualDriveConfig: mergeManualDriveConfig(savedManualDriveConfig) });
    }
  }, [savedManualDriveConfig]);

  const { data: execDefaults } = useQuery({
    queryKey: ['config', 'execution-defaults'],
    queryFn: () => api!.getExecutionDefaults(),
    enabled: api !== null,
  });
  useEffect(() => {
    if (!execDefaults) return;
    const patch: Partial<RunFormValues> = {
      hz: execDefaults.hz,
      headless: execDefaults.headless,
      record: execDefaults.record,
      noRealtime: execDefaults.no_realtime,
      timeout: execDefaults.timeout,
      osiEnabled: execDefaults.osi.enabled,
      osiIp: execDefaults.osi.ip,
      autolight: execDefaults.autolight,
    };
    if (execDefaults.vehicle_physics !== undefined) patch.vehiclePhysics = execDefaults.vehicle_physics;
    if (execDefaults.kinematic_mode !== undefined) patch.kinematicMode = execDefaults.kinematic_mode;
    if (execDefaults.route_drive_mode !== undefined) patch.routeDriveMode = execDefaults.route_drive_mode;
    if (execDefaults.route_drive_timing) patch.laneChangeTiming = execDefaults.route_drive_timing;
    if (execDefaults.route_drive_gap) patch.laneChangeGap = execDefaults.route_drive_gap;
    if (execDefaults.threads !== undefined) patch.threads = execDefaults.threads;
    if (execDefaults.window) {
      patch.winX = execDefaults.window.x;
      patch.winY = execDefaults.window.y;
      patch.winW = execDefaults.window.w;
      patch.winH = execDefaults.window.h;
    }
    patchValues(patch);
  }, [execDefaults]);

  // Validation
  const validate = (): { errors: Record<string, string>; ok: boolean } => {
    const errors: Record<string, string> = {};
    if (!scenarioFile) errors.scenario = t('gtSim.runForm.advanced.errors.scenario');
    if (hz <= 0) errors.hz = t('gtSim.runForm.advanced.errors.hz');
    if (timeout <= 0) errors.timeout = t('gtSim.runForm.advanced.errors.timeout');
    if (osiEnabled && !/^\d{1,3}(\.\d{1,3}){3}$/.test(osiIp)) {
      errors.osiIp = t('gtSim.runForm.advanced.errors.osiIp');
    }
    return { errors, ok: Object.keys(errors).length === 0 };
  };
  const { errors: validationErrors } = validate();

  const controller: ControllerConfig = {
    controller_type: controllerType,
    ...(controllerType === 'manual' ? { manual_drive: manualDriveConfig } : {}),
  };

  const buildRequest = (): GtSimSimulationRequest =>
    buildRunRequest({
      scenarioId: scenarioFile,
      projectId,
      controller,
      values,
      paramOverrides: Object.keys(paramOverrides).length > 0 ? paramOverrides : undefined,
    });

  // Expose request builder to parent (CopyApiRequest). Deliberately has no
  // dependency array — buildRequest closes over every form value, so this
  // must re-run on every render to stay current (matches the fork's
  // SimulationRunForm.tsx behavior).
  useEffect(() => {
    onRequestBuilder?.(scenarioFile ? buildRequest : null);
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (!api) throw new Error('GT_Sim backend not connected');
      return api.createSimulation(buildRequest());
    },
    onSuccess: (job) => {
      toast.success(t('gtSim.runForm.submit.toastQueued', { jobId: job.job_id }));
      onSubmitted?.(job);
      // TODO(WP5 / cluster E+F): once the live-view panels land, navigate to
      // the VD live telemetry view here (fork: window.open('/live/vd/{jobId}')
      // at SimulationRunForm.tsx:546). For now, the job id is only surfaced
      // via this toast + InlineSimulationStatus.
    },
    onError: (error: Error) => {
      toast.error(t('gtSim.runForm.submit.toastError', { message: error.message }));
    },
  });

  const handleSubmit = () => {
    const { ok } = validate();
    if (ok) mutation.mutate();
  };

  return (
    <Card className="p-3">
      <ControllerSection
        controllerType={controllerType}
        setControllerType={(v: ControllerType) => patchValues({ controllerType: v })}
        onOpenManualSettings={() => patchUi({ showManualPanel: true })}
        driveMode={driveMode}
        setDriveMode={(v: DriveMode) => patchValues({ driveMode: v })}
        routeDriveMode={routeDriveMode}
        laneChangeTiming={laneChangeTiming}
        setLaneChangeTiming={(v: LaneChangeTiming) => patchValues({ laneChangeTiming: v })}
        laneChangeGap={laneChangeGap}
        setLaneChangeGap={(v: LaneChangeGap) => patchValues({ laneChangeGap: v })}
      />

      <ManualDriveSettingsPlaceholder
        open={showManualPanel}
        onClose={() => patchUi({ showManualPanel: false })}
      />

      <div className="border-b border-[var(--color-glass-edge)] my-3" />

      <QuickOptionsBar
        headless={headless}
        setHeadless={(v) => patchValues({ headless: v })}
        record={record}
        setRecord={(v) => patchValues({ record: v })}
        noRealtime={noRealtime}
        setNoRealtime={(v) => patchValues({ noRealtime: v })}
        autolight={autolight}
        setAutolight={(v) => patchValues(v ? { autolight: v } : { autolight: v, autolightHeadlights: false })}
        autolightHeadlights={autolightHeadlights}
        setAutolightHeadlights={(v) => patchValues({ autolightHeadlights: v })}
        vehiclePhysics={vehiclePhysics}
        setVehiclePhysics={(v) => patchValues({ vehiclePhysics: v })}
        kinematicMode={kinematicMode}
        setKinematicMode={(v) => patchValues({ kinematicMode: v })}
        routeDriveMode={routeDriveMode}
        setRouteDriveMode={(v) => patchValues({ routeDriveMode: v })}
      />

      <div className="border-b border-[var(--color-glass-edge)] my-3" />

      <AdvancedSettings
        showAdvanced={showAdvanced}
        setShowAdvanced={(v) => patchUi({ showAdvanced: v })}
        hz={hz}
        setHz={(v) => patchValues({ hz: v })}
        timeout={timeout}
        setTimeout_={(v) => patchValues({ timeout: v })}
        osiEnabled={osiEnabled}
        osiIp={osiIp}
        setOsiIp={(v) => patchValues({ osiIp: v })}
        headless={headless}
        threads={threads}
        setThreads={(v) => patchValues({ threads: v })}
        winX={winX}
        setWinX={(v) => patchValues({ winX: v })}
        winY={winY}
        setWinY={(v) => patchValues({ winY: v })}
        winW={winW}
        setWinW={(v) => patchValues({ winW: v })}
        winH={winH}
        setWinH={(v) => patchValues({ winH: v })}
        validationErrors={validationErrors}
        compact
      />

      <div className="border-b border-[var(--color-glass-edge)] my-3" />

      {/* Submit + Stop */}
      <div className="flex gap-2">
        <Button
          size="md"
          className="flex-1"
          onClick={handleSubmit}
          disabled={!scenarioFile || mutation.isPending || isRunning || api === null}
        >
          {mutation.isPending ? t('gtSim.runForm.submit.starting') : t('gtSim.runForm.submit.run')}
        </Button>
        <Button
          size="md"
          variant="danger"
          className="flex-1"
          onClick={onStop}
          disabled={!isRunning || !onStop}
        >
          {t('gtSim.runForm.submit.stop')}
        </Button>
      </div>

      {mutation.error && (
        <p className="text-[var(--color-destructive)] text-sm mt-2">{mutation.error.message}</p>
      )}
    </Card>
  );
}

/**
 * Execution defaults form (GT_Sim `config/*` execution defaults).
 *
 * Ported from the GT_Sim fork's `SettingsForm` (`components/SettingsPanel.tsx`
 * lines 51-219) — same fields, same reset-to-hardcoded-defaults behavior, same
 * save flow (`PUT /api/config/execution-defaults` + query invalidation).
 * Numeric/window-geometry field labels and the `hz`/`timeout`/`osiIp`
 * validation messages reuse `gtSim.runForm.advanced.*` (cluster B already
 * defines identical fields for the run form's "Advanced" section — same
 * meaning, so no duplicate keys were added for those).
 *
 * Not ported: `route_drive_timing` / `route_drive_gap`. The fork's
 * `ExecutionDefaults` type carries them (optional) but its own
 * `SettingsForm` never reads or writes them either — they are exclusively a
 * per-run override edited in cluster B's run form. This form is faithful to
 * that fork behavior (and therefore does not clobber them on save, since it
 * never touches those two keys).
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import type { ExecutionDefaults } from '@osce/esmini';
import { Button, Checkbox, NumberInput, TextInput, ToggleSwitch, ErrorPanel } from '../../ui';
import { useGtSimApi } from '../../lib';
import {
  validateExecutionDefaultsForm,
  isExecutionDefaultsFormValid,
} from '../lib/validate-execution-defaults';

/** Mirrors the fork's `HARDCODED_DEFAULTS` (`components/SettingsPanel.tsx:13-26`). */
const HARDCODED_DEFAULTS: ExecutionDefaults = {
  hz: 120,
  headless: true,
  record: false,
  no_realtime: false,
  timeout: 60,
  osi: { enabled: true, ip: '127.0.0.1' },
  autolight: true,
  vehicle_physics: true,
  kinematic_mode: false,
  route_drive_mode: false,
  threads: true,
  window: { x: 60, y: 60, w: 1280, h: 720 },
};

function ExecutionDefaultsForm({ defaults }: { defaults: ExecutionDefaults }) {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const queryClient = useQueryClient();

  const [hz, setHz] = useState(defaults.hz);
  const [headless, setHeadless] = useState(defaults.headless);
  const [record, setRecord] = useState(defaults.record);
  const [noRealtime, setNoRealtime] = useState(defaults.no_realtime);
  const [timeoutS, setTimeoutS] = useState(defaults.timeout);
  const [osiEnabled, setOsiEnabled] = useState(defaults.osi.enabled);
  const [osiIp, setOsiIp] = useState(defaults.osi.ip);
  const [autolight, setAutolight] = useState(defaults.autolight);
  const [vehiclePhysics, setVehiclePhysics] = useState(defaults.vehicle_physics);
  const [kinematicMode, setKinematicMode] = useState(defaults.kinematic_mode);
  const [routeDriveMode, setRouteDriveMode] = useState(defaults.route_drive_mode);
  const [threads, setThreads] = useState(defaults.threads);
  const [winX, setWinX] = useState(defaults.window.x);
  const [winY, setWinY] = useState(defaults.window.y);
  const [winW, setWinW] = useState(defaults.window.w);
  const [winH, setWinH] = useState(defaults.window.h);

  const [showErrors, setShowErrors] = useState(false);
  const validation = validateExecutionDefaultsForm({ hz, timeout: timeoutS, osiEnabled, osiIp });

  const saveMutation = useMutation({
    mutationFn: (params: ExecutionDefaults) => {
      if (!api) throw new Error('GT_Sim API not connected');
      return api.updateExecutionDefaults(params);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['config', 'execution-defaults'] });
      setShowErrors(false);
    },
  });

  const handleSave = () => {
    if (!isExecutionDefaultsFormValid(validation)) {
      setShowErrors(true);
      return;
    }
    saveMutation.mutate({
      hz,
      headless,
      record,
      no_realtime: noRealtime,
      timeout: timeoutS,
      osi: { enabled: osiEnabled, ip: osiIp },
      autolight,
      vehicle_physics: vehiclePhysics,
      kinematic_mode: kinematicMode,
      route_drive_mode: routeDriveMode,
      threads,
      window: { x: winX, y: winY, w: winW, h: winH },
    });
  };

  const handleReset = () => {
    const d = HARDCODED_DEFAULTS;
    setHz(d.hz);
    setHeadless(d.headless);
    setRecord(d.record);
    setNoRealtime(d.no_realtime);
    setTimeoutS(d.timeout);
    setOsiEnabled(d.osi.enabled);
    setOsiIp(d.osi.ip);
    setAutolight(d.autolight);
    setVehiclePhysics(d.vehicle_physics);
    setKinematicMode(d.kinematic_mode);
    setRouteDriveMode(d.route_drive_mode);
    setThreads(d.threads);
    setWinX(d.window.x);
    setWinY(d.window.y);
    setWinW(d.window.w);
    setWinH(d.window.h);
    setShowErrors(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Checkbox
          label={t('gtSim.settings.execution.fields.headless')}
          checked={headless}
          onChange={(e) => setHeadless(e.target.checked)}
        />
        <Checkbox
          label={t('gtSim.settings.execution.fields.record')}
          checked={record}
          onChange={(e) => setRecord(e.target.checked)}
        />
        <Checkbox
          label={t('gtSim.settings.execution.fields.noRealtime')}
          checked={noRealtime}
          onChange={(e) => setNoRealtime(e.target.checked)}
        />
        <Checkbox
          label={t('gtSim.settings.execution.fields.autolight')}
          checked={autolight}
          onChange={(e) => setAutolight(e.target.checked)}
        />
        <Checkbox
          label={t('gtSim.settings.execution.fields.vehiclePhysics')}
          checked={vehiclePhysics}
          onChange={(e) => setVehiclePhysics(e.target.checked)}
        />
        <Checkbox
          label={t('gtSim.settings.execution.fields.kinematicMode')}
          checked={kinematicMode}
          onChange={(e) => setKinematicMode(e.target.checked)}
        />
        <Checkbox
          label={t('gtSim.settings.execution.fields.routeDriveMode')}
          checked={routeDriveMode}
          onChange={(e) => setRouteDriveMode(e.target.checked)}
        />
        <Checkbox
          label={t('gtSim.settings.execution.fields.osiEnabled')}
          checked={osiEnabled}
          onChange={(e) => setOsiEnabled(e.target.checked)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <NumberInput
            label={t('gtSim.runForm.advanced.frequency')}
            value={hz}
            onChange={(e) => setHz(Number(e.target.value))}
          />
          {showErrors && !validation.hzValid && (
            <p className="mt-1 text-xs text-[var(--color-destructive)]">
              {t('gtSim.runForm.advanced.errors.hz')}
            </p>
          )}
        </div>
        <div>
          <NumberInput
            label={t('gtSim.runForm.advanced.timeout')}
            value={timeoutS}
            onChange={(e) => setTimeoutS(Number(e.target.value))}
          />
          {showErrors && !validation.timeoutValid && (
            <p className="mt-1 text-xs text-[var(--color-destructive)]">
              {t('gtSim.runForm.advanced.errors.timeout')}
            </p>
          )}
        </div>
      </div>

      {osiEnabled && (
        <div>
          <TextInput
            label={t('gtSim.runForm.advanced.osiIp')}
            value={osiIp}
            onChange={(e) => setOsiIp(e.target.value)}
            className="w-48"
          />
          {showErrors && !validation.osiIpValid && (
            <p className="mt-1 text-xs text-[var(--color-destructive)]">
              {t('gtSim.runForm.advanced.errors.osiIp')}
            </p>
          )}
        </div>
      )}

      {!headless && (
        <div className="space-y-3">
          <ToggleSwitch
            label={t('gtSim.runForm.advanced.threadedViewer')}
            description={t('gtSim.runForm.advanced.threadedViewerDesc')}
            checked={threads}
            onChange={setThreads}
          />
          <div>
            <h4 className="mb-2 text-xs text-[var(--color-text-secondary)]">
              {t('gtSim.runForm.advanced.windowGeometry')}
            </h4>
            <div className="grid grid-cols-4 gap-2">
              <NumberInput
                label={t('gtSim.runForm.advanced.x')}
                value={winX}
                onChange={(e) => setWinX(Number(e.target.value))}
              />
              <NumberInput
                label={t('gtSim.runForm.advanced.y')}
                value={winY}
                onChange={(e) => setWinY(Number(e.target.value))}
              />
              <NumberInput
                label={t('gtSim.runForm.advanced.width')}
                value={winW}
                onChange={(e) => setWinW(Number(e.target.value))}
              />
              <NumberInput
                label={t('gtSim.runForm.advanced.height')}
                value={winH}
                onChange={(e) => setWinH(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 border-t border-[var(--color-glass-edge)] pt-4">
        <Button variant="ghost" size="sm" onClick={handleReset}>
          {t('gtSim.settings.execution.reset')}
        </Button>
        <Button size="sm" className="flex-1" onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending
            ? t('gtSim.settings.execution.saving')
            : t('gtSim.settings.execution.save')}
        </Button>
      </div>

      {saveMutation.error && (
        <p className="text-sm text-[var(--color-destructive)]">
          {t('gtSim.settings.execution.saveError', {
            message:
              saveMutation.error instanceof Error
                ? saveMutation.error.message
                : String(saveMutation.error),
          })}
        </p>
      )}
    </div>
  );
}

export function ExecutionDefaultsSection() {
  const { t } = useTranslation('common');
  const api = useGtSimApi();

  const defaultsQuery = useQuery({
    queryKey: ['config', 'execution-defaults'],
    queryFn: () => api!.getExecutionDefaults(),
    enabled: api !== null,
  });

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">
        {t('gtSim.settings.execution.title')}
      </h3>
      {api === null ? (
        <p className="text-sm text-[var(--color-text-tertiary)]">
          {t('gtSim.settings.execution.disconnected')}
        </p>
      ) : defaultsQuery.data ? (
        <ExecutionDefaultsForm defaults={defaultsQuery.data} />
      ) : defaultsQuery.error ? (
        <ErrorPanel error={defaultsQuery.error} onRetry={() => defaultsQuery.refetch()} />
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t('gtSim.settings.execution.loading')}
        </p>
      )}
    </div>
  );
}

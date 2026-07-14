/**
 * Auto Headlights (F6) config form.
 *
 * Ported from the GT_Sim fork's `AutoLightSection`/`AutoLightForm`
 * (`components/SettingsPanel.tsx` lines 221-386) — same fields, same
 * `pickAutoLight` editable-keys extraction (the GET payload also carries
 * `"// ..."` comment keys that must not enter form state), same
 * reset-to-server-defaults + save flow (`PUT /api/auto-light/config`).
 */
import { useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import type { AutoLightConfig } from '@osce/esmini';
import { Button, NumberInput, ToggleSwitch, ErrorPanel } from '../../ui';
import { useGtSimApi } from '../../lib';

// Extract only the editable keys (the GET payload also carries "// ..."
// comment keys, which are preserved server-side and must not enter the form
// state). Mirrors the fork's `pickAutoLight`.
function pickAutoLight(src: AutoLightConfig): AutoLightConfig {
  return {
    headlight_enabled: src.headlight_enabled,
    headlight_illuminance_lux_threshold: src.headlight_illuminance_lux_threshold,
    headlight_sun_elevation_deg: src.headlight_sun_elevation_deg,
    headlight_use_time_of_day: src.headlight_use_time_of_day,
    headlight_dusk_hour: src.headlight_dusk_hour,
    headlight_dawn_hour: src.headlight_dawn_hour,
    headlight_tunnel_enabled: src.headlight_tunnel_enabled,
    highbeam_enabled: src.highbeam_enabled,
    highbeam_range_m: src.highbeam_range_m,
    highbeam_range_hysteresis_m: src.highbeam_range_hysteresis_m,
    highbeam_corridor_half_width_m: src.highbeam_corridor_half_width_m,
    highbeam_on_delay_s: src.highbeam_on_delay_s,
    highbeam_off_delay_s: src.highbeam_off_delay_s,
  };
}

function AutoLightForm({
  initial,
  defaults,
}: {
  initial: AutoLightConfig;
  defaults: AutoLightConfig;
}) {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const queryClient = useQueryClient();
  const [cfg, setCfg] = useState<AutoLightConfig>(() => pickAutoLight(initial));
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof AutoLightConfig>(key: K, val: AutoLightConfig[K]) => {
    setCfg((c) => ({ ...c, [key]: val }));
    setSaved(false);
  };
  const setNum = (key: keyof AutoLightConfig) => (e: ChangeEvent<HTMLInputElement>) =>
    set(key, Number(e.target.value) as AutoLightConfig[typeof key]);

  const saveMutation = useMutation({
    mutationFn: (c: AutoLightConfig) => {
      if (!api) throw new Error('GT_Sim API not connected');
      return api.updateAutoLightConfig(c);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['config', 'auto-light'] });
      setSaved(true);
    },
  });

  const handleReset = () => {
    setCfg(pickAutoLight(defaults));
    setSaved(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <ToggleSwitch
          label={t('gtSim.settings.autoLight.masterSwitch')}
          checked={cfg.headlight_enabled}
          onChange={(v) => set('headlight_enabled', v)}
        />
        <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">
          {t('gtSim.settings.autoLight.masterSwitchNote')}
        </p>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {t('gtSim.settings.autoLight.nightDetection.title')}
        </h4>
        <p className="mb-2 text-[10px] text-[var(--color-text-tertiary)]">
          {t('gtSim.settings.autoLight.nightDetection.priorityNote')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label={t('gtSim.settings.autoLight.nightDetection.illuminanceThreshold')}
            value={cfg.headlight_illuminance_lux_threshold}
            onChange={setNum('headlight_illuminance_lux_threshold')}
          />
          <NumberInput
            label={t('gtSim.settings.autoLight.nightDetection.sunElevation')}
            step={0.1}
            value={cfg.headlight_sun_elevation_deg}
            onChange={setNum('headlight_sun_elevation_deg')}
          />
        </div>
        <div className="mt-3">
          <ToggleSwitch
            label={t('gtSim.settings.autoLight.nightDetection.useTimeOfDay')}
            checked={cfg.headlight_use_time_of_day}
            onChange={(v) => set('headlight_use_time_of_day', v)}
          />
        </div>
        {cfg.headlight_use_time_of_day && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberInput
              label={t('gtSim.settings.autoLight.nightDetection.duskHour')}
              step={0.5}
              value={cfg.headlight_dusk_hour}
              onChange={setNum('headlight_dusk_hour')}
            />
            <NumberInput
              label={t('gtSim.settings.autoLight.nightDetection.dawnHour')}
              step={0.5}
              value={cfg.headlight_dawn_hour}
              onChange={setNum('headlight_dawn_hour')}
            />
          </div>
        )}
      </div>

      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {t('gtSim.settings.autoLight.tunnel.title')}
        </h4>
        <ToggleSwitch
          label={t('gtSim.settings.autoLight.tunnel.lowBeam')}
          checked={cfg.headlight_tunnel_enabled}
          onChange={(v) => set('headlight_tunnel_enabled', v)}
        />
      </div>

      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {t('gtSim.settings.autoLight.highBeam.title')}
        </h4>
        <ToggleSwitch
          label={t('gtSim.settings.autoLight.highBeam.autoHighBeam')}
          description={t('gtSim.settings.autoLight.highBeam.autoHighBeamDesc')}
          checked={cfg.highbeam_enabled}
          onChange={(v) => set('highbeam_enabled', v)}
        />
        {cfg.highbeam_enabled && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberInput
              label={t('gtSim.settings.autoLight.highBeam.detectionRange')}
              step={0.5}
              value={cfg.highbeam_range_m}
              onChange={setNum('highbeam_range_m')}
            />
            <NumberInput
              label={t('gtSim.settings.autoLight.highBeam.rangeHysteresis')}
              step={0.5}
              value={cfg.highbeam_range_hysteresis_m}
              onChange={setNum('highbeam_range_hysteresis_m')}
            />
            <NumberInput
              label={t('gtSim.settings.autoLight.highBeam.corridorHalfWidth')}
              step={0.5}
              value={cfg.highbeam_corridor_half_width_m}
              onChange={setNum('highbeam_corridor_half_width_m')}
            />
            <NumberInput
              label={t('gtSim.settings.autoLight.highBeam.onDelay')}
              step={0.1}
              value={cfg.highbeam_on_delay_s}
              onChange={setNum('highbeam_on_delay_s')}
            />
            <NumberInput
              label={t('gtSim.settings.autoLight.highBeam.offDelay')}
              step={0.1}
              value={cfg.highbeam_off_delay_s}
              onChange={setNum('highbeam_off_delay_s')}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="sm" onClick={handleReset}>
          {t('gtSim.settings.autoLight.reset')}
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => saveMutation.mutate(cfg)}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending
            ? t('gtSim.settings.autoLight.saving')
            : t('gtSim.settings.autoLight.save')}
        </Button>
      </div>

      {saved && !saveMutation.isPending && (
        <p className="text-xs text-[var(--color-accent)]">{t('gtSim.settings.autoLight.saved')}</p>
      )}
      {saveMutation.error && (
        <p className="text-sm text-[var(--color-destructive)]">
          {t('gtSim.settings.autoLight.saveError', {
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

export function AutoLightSection() {
  const { t } = useTranslation('common');
  const api = useGtSimApi();

  const configQuery = useQuery({
    queryKey: ['config', 'auto-light'],
    queryFn: () => api!.getAutoLightConfig(),
    enabled: api !== null,
  });
  const defaultsQuery = useQuery({
    queryKey: ['config', 'auto-light-defaults'],
    queryFn: () => api!.getAutoLightDefaults(),
    enabled: api !== null,
  });

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-[var(--color-text-secondary)]">
        {t('gtSim.settings.autoLight.title')}
      </h3>
      <p className="mb-4 text-xs text-[var(--color-text-tertiary)]">
        {t('gtSim.settings.autoLight.description')}
      </p>
      {api === null ? (
        <p className="text-sm text-[var(--color-text-tertiary)]">
          {t('gtSim.settings.execution.disconnected')}
        </p>
      ) : configQuery.data && defaultsQuery.data ? (
        <AutoLightForm initial={configQuery.data} defaults={defaultsQuery.data} />
      ) : configQuery.error ? (
        <ErrorPanel error={configQuery.error} onRetry={() => configQuery.refetch()} />
      ) : defaultsQuery.error ? (
        <ErrorPanel error={defaultsQuery.error} onRetry={() => defaultsQuery.refetch()} />
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t('gtSim.settings.autoLight.loading')}
        </p>
      )}
    </div>
  );
}

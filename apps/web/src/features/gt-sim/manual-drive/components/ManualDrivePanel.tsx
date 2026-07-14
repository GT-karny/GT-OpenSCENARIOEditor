/**
 * Manual Drive settings panel — domain assignment, input source (wheel /
 * keyboard / network / stub), physics backend, and per-binding button /
 * keyboard mapping with live capture.
 *
 * Ported from the GT_Sim fork's `components/simulation/ManualDrivePanel.tsx`
 * (406 lines). Behavior is unchanged; the fork's bare Tailwind color classes
 * are replaced with APEX `var(--color-*)` tokens + `rounded-none`, and all
 * copy moves to `gtSim.manualDrive.*` i18n keys. The fork's inlined
 * `DEFAULT_CONFIG` constant is dropped in favor of the run-form cluster's
 * shared `DEFAULT_MANUAL_DRIVE_CONFIG` (`../../run-form/lib/manual-drive-defaults`,
 * read-only cross-cluster import) so the two lanes cannot drift on the
 * default shape.
 *
 * Props are fork-compatible (`open`/`onClose`/`config`/`onChange`) so the
 * run-form cluster's `ManualDriveSettingsPlaceholder` swap is a one-line JSX
 * change — see this feature's `index.ts` header / the lane's final report
 * for the exact diff.
 *
 * Gated on `useGtSimApi() !== null`: with no backend connected there is
 * nothing to load presets from or save to, so the panel renders an empty
 * state instead of a non-functional form.
 */
import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import type { ManualDriveConfig, ManualDrivePreset } from '@osce/esmini';
import { useGtSimApi } from '../../lib';
import { SlidePanel, SelectInput, NumberInput, Button, EmptyState } from '../../ui';
import { DEFAULT_MANUAL_DRIVE_CONFIG } from '../../run-form/lib/manual-drive-defaults';
import { useGamepadButtonCapture } from '../hooks/useGamepadButtonCapture';

export interface ManualDrivePanelProps {
  open: boolean;
  onClose: () => void;
  config: ManualDriveConfig;
  onChange: (config: ManualDriveConfig) => void;
}

type ButtonMappingKey = keyof ManualDriveConfig['sdl2']['button_mapping'];
// Keyboard bindings are the string-valued keys of `keyboard`; the four
// numeric response-rate fields are edited separately (NumberInput below).
type KeyboardBindingKey = Exclude<
  keyof ManualDriveConfig['keyboard'],
  'steer_rate' | 'centering_rate' | 'pedal_press_rate' | 'pedal_release_rate'
>;
type FieldKey = ButtonMappingKey | KeyboardBindingKey;

const BUTTON_MAPPING_FIELDS: ButtonMappingKey[] = [
  'upshift',
  'downshift',
  'override',
  'indicator_left',
  'indicator_right',
  'headlight',
  'high_beam',
  'fog_light',
  'hazard',
];

const KEYBOARD_BINDING_FIELDS: KeyboardBindingKey[] = [
  'steer_left',
  'steer_right',
  'throttle',
  'brake',
  'clutch',
  'upshift',
  'downshift',
  'override_key',
  'indicator_left',
  'indicator_right',
  'headlight',
  'high_beam',
  'fog_light',
  'hazard',
];

// Convert KeyboardEvent.code → SDL scancode-name shorthand the C++ side
// accepts. Returns null for unsupported keys. Verbatim port from the fork.
function keyEventToSdlName(e: KeyboardEvent): string | null {
  const code = e.code;
  // Letter keys: "KeyA" → "A"
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  // Digit row: "Digit1" → "1"
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  // Numpad digits
  if (/^Numpad[0-9]$/.test(code)) return 'Keypad ' + code.slice(6);
  // Arrows
  if (code === 'ArrowLeft') return 'Left';
  if (code === 'ArrowRight') return 'Right';
  if (code === 'ArrowUp') return 'Up';
  if (code === 'ArrowDown') return 'Down';
  // Modifiers
  if (code === 'ShiftLeft') return 'LShift';
  if (code === 'ShiftRight') return 'RShift';
  if (code === 'ControlLeft') return 'LCtrl';
  if (code === 'ControlRight') return 'RCtrl';
  if (code === 'AltLeft') return 'LAlt';
  if (code === 'AltRight') return 'RAlt';
  // Common
  if (code === 'Space') return 'Space';
  if (code === 'Enter') return 'Return';
  if (code === 'Tab') return 'Tab';
  if (code === 'Escape') return 'Escape';
  if (code === 'Backspace') return 'Backspace';
  if (code === 'Comma') return ',';
  if (code === 'Period') return '.';
  if (code === 'Slash') return '/';
  if (code === 'Semicolon') return ';';
  return null;
}

const sectionHeading =
  'text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2';
const chipButton =
  'px-2.5 py-1 text-xs rounded-none bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)] hover:text-[var(--color-foreground)] transition-colors cursor-pointer';
const captureValue =
  'text-xs font-mono bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] rounded-none px-2 py-0.5 text-center';
const assignBtnBase = 'text-[10px] px-2 py-0.5 rounded-none cursor-pointer transition-colors';
const assignBtnActive =
  'bg-[var(--color-accent-vivid)]/80 text-[var(--color-bg-void)] animate-pulse';
const assignBtnIdle =
  'bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-glass-hover)]';

export function ManualDrivePanel({ open, onClose, config, onChange }: ManualDrivePanelProps) {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const queryClient = useQueryClient();
  const [assigningKey, setAssigningKey] = useState<ButtonMappingKey | null>(null);
  const [assigningKbKey, setAssigningKbKey] = useState<KeyboardBindingKey | null>(null);

  // Literal t() calls only (no dynamic template keys — see the lane's task
  // instructions on typed i18n). Resolved once per render into a lookup
  // shared by the button-mapping and keyboard-mapping lists below, since most
  // field labels (e.g. "Headlight") are identical between the two.
  const fieldLabels: Record<FieldKey, string> = {
    steer_left: t('gtSim.manualDrive.fields.steerLeft'),
    steer_right: t('gtSim.manualDrive.fields.steerRight'),
    throttle: t('gtSim.manualDrive.fields.throttle'),
    brake: t('gtSim.manualDrive.fields.brake'),
    clutch: t('gtSim.manualDrive.fields.clutch'),
    upshift: t('gtSim.manualDrive.fields.upshift'),
    downshift: t('gtSim.manualDrive.fields.downshift'),
    override: t('gtSim.manualDrive.fields.override'),
    override_key: t('gtSim.manualDrive.fields.override'),
    indicator_left: t('gtSim.manualDrive.fields.indicatorLeft'),
    indicator_right: t('gtSim.manualDrive.fields.indicatorRight'),
    headlight: t('gtSim.manualDrive.fields.headlight'),
    high_beam: t('gtSim.manualDrive.fields.highBeam'),
    fog_light: t('gtSim.manualDrive.fields.fogLight'),
    hazard: t('gtSim.manualDrive.fields.hazard'),
  };

  // Load presets — only while the panel is open and a backend is connected.
  const { data: presets } = useQuery({
    queryKey: ['presets', 'manual-drive'],
    queryFn: () => api!.getManualDrivePresets(),
    enabled: open && api !== null,
  });

  // Save config to the backend. Shares the run-form cluster's queryKey
  // (`['config', 'manual-drive']`) so its GET cache is invalidated too — see
  // run-form/components/SimulationRunForm.tsx's `savedManualDriveConfig`
  // query, which this mutation must stay in sync with.
  const saveMutation = useMutation({
    mutationFn: (cfg: ManualDriveConfig) => api!.updateManualDriveConfig(cfg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'manual-drive'] });
    },
  });

  // Gamepad button capture.
  const onButtonCapture = useCallback(
    (buttonIndex: number) => {
      if (!assigningKey) return;
      const newMapping = { ...config.sdl2.button_mapping, [assigningKey]: buttonIndex };
      onChange({ ...config, sdl2: { ...config.sdl2, button_mapping: newMapping } });
      setAssigningKey(null);
    },
    [assigningKey, config, onChange],
  );

  const { capturing, startCapture, cancel: cancelCapture } = useGamepadButtonCapture(onButtonCapture);

  const startAssign = (key: ButtonMappingKey) => {
    setAssigningKey(key);
    startCapture();
  };

  // Update helpers — typed per nested object so no `any`/cast is needed.
  const set = <K extends keyof ManualDriveConfig>(key: K, val: ManualDriveConfig[K]) =>
    onChange({ ...config, [key]: val });

  const setDomain = (field: keyof ManualDriveConfig['domain'], val: string) =>
    onChange({ ...config, domain: { ...config.domain, [field]: val } });

  const setInputNetwork = <K extends keyof ManualDriveConfig['input_network']>(
    field: K,
    val: ManualDriveConfig['input_network'][K],
  ) => onChange({ ...config, input_network: { ...config.input_network, [field]: val } });

  const setPhysicsNetwork = <K extends keyof ManualDriveConfig['physics_network']>(
    field: K,
    val: ManualDriveConfig['physics_network'][K],
  ) => onChange({ ...config, physics_network: { ...config.physics_network, [field]: val } });

  const setKeyboard = <K extends keyof ManualDriveConfig['keyboard']>(
    field: K,
    val: ManualDriveConfig['keyboard'][K],
  ) => onChange({ ...config, keyboard: { ...config.keyboard, [field]: val } });

  const applyPreset = (preset: ManualDrivePreset) => {
    onChange({ ...DEFAULT_MANUAL_DRIVE_CONFIG, ...preset.config });
  };

  // Keyboard capture: when assigningKbKey is set, the next keypress is recorded.
  useEffect(() => {
    if (!assigningKbKey) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setAssigningKbKey(null);
        return;
      }
      const sdlName = keyEventToSdlName(e);
      if (!sdlName) return;
      setKeyboard(assigningKbKey, sdlName);
      setAssigningKbKey(null);
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- matches fork dep list (config/onChange close over setKeyboard)
  }, [assigningKbKey, config, onChange]);

  if (api === null) {
    return (
      <SlidePanel open={open} onClose={onClose} title={t('gtSim.manualDrive.title')}>
        <EmptyState message={t('gtSim.manualDrive.disconnected')} />
      </SlidePanel>
    );
  }

  return (
    <SlidePanel open={open} onClose={onClose} title={t('gtSim.manualDrive.title')}>
      <div className="space-y-6">
        {/* Presets */}
        <section>
          <h3 className={sectionHeading}>{t('gtSim.manualDrive.presets.heading')}</h3>
          <div className="flex flex-wrap gap-1.5">
            {presets?.map((p) => (
              <button key={p.name} type="button" onClick={() => applyPreset(p)} className={chipButton}>
                {p.name}
              </button>
            ))}
          </div>
        </section>

        {/* Domain Assignment */}
        <section>
          <h3 className={sectionHeading}>{t('gtSim.manualDrive.domain.heading')}</h3>
          <div className="space-y-2">
            <SelectInput
              label={t('gtSim.manualDrive.domain.lateralLabel')}
              value={config.domain.lateral}
              onChange={(e) => setDomain('lateral', e.target.value)}
            >
              <option value="manual">{t('gtSim.manualDrive.domain.options.manual')}</option>
              <option value="scenario">{t('gtSim.manualDrive.domain.options.scenario')}</option>
            </SelectInput>
            <SelectInput
              label={t('gtSim.manualDrive.domain.longitudinalLabel')}
              value={config.domain.longitudinal}
              onChange={(e) => setDomain('longitudinal', e.target.value)}
            >
              <option value="manual">{t('gtSim.manualDrive.domain.options.manual')}</option>
              <option value="scenario">{t('gtSim.manualDrive.domain.options.scenario')}</option>
            </SelectInput>
          </div>
        </section>

        {/* Input Source */}
        <section>
          <h3 className={sectionHeading}>{t('gtSim.manualDrive.inputSource.heading')}</h3>
          <SelectInput
            label={t('gtSim.manualDrive.inputSource.typeLabel')}
            value={config.input_type}
            onChange={(e) => set('input_type', e.target.value)}
          >
            <option value="sdl2_wheel">{t('gtSim.manualDrive.inputSource.types.sdl2Wheel')}</option>
            <option value="sdl2_keyboard">{t('gtSim.manualDrive.inputSource.types.sdl2Keyboard')}</option>
            <option value="network">{t('gtSim.manualDrive.inputSource.types.network')}</option>
            <option value="stub">{t('gtSim.manualDrive.inputSource.types.stub')}</option>
          </SelectInput>

          {config.input_type === 'network' && (
            <div className="space-y-2 mt-2">
              <SelectInput
                label={t('gtSim.manualDrive.network.transportLabel')}
                value={config.input_network.transport_type}
                onChange={(e) => setInputNetwork('transport_type', e.target.value)}
              >
                <option value="udp">{t('gtSim.manualDrive.network.transport.udp')}</option>
                <option value="tcp">{t('gtSim.manualDrive.network.transport.tcp')}</option>
              </SelectInput>
              <NumberInput
                label={t('gtSim.manualDrive.inputSource.portLabel')}
                value={config.input_network.port}
                onChange={(e) => setInputNetwork('port', Number(e.target.value))}
                min={1}
                max={65535}
              />
              <SelectInput
                label={t('gtSim.manualDrive.inputSource.levelLabel')}
                value={config.input_network.level}
                onChange={(e) => setInputNetwork('level', e.target.value)}
              >
                <option value="pedal_steer">{t('gtSim.manualDrive.inputSource.levels.pedalSteer')}</option>
                <option value="motion_request">
                  {t('gtSim.manualDrive.inputSource.levels.motionRequest')}
                </option>
              </SelectInput>
            </div>
          )}
        </section>

        {/* Physics Backend */}
        <section>
          <h3 className={sectionHeading}>{t('gtSim.manualDrive.physics.heading')}</h3>
          <SelectInput
            label={t('gtSim.manualDrive.physics.typeLabel')}
            value={config.physics_type}
            onChange={(e) => set('physics_type', e.target.value)}
          >
            <option value="real_vehicle">{t('gtSim.manualDrive.physics.types.realVehicle')}</option>
            <option value="network">{t('gtSim.manualDrive.physics.types.network')}</option>
          </SelectInput>

          {config.physics_type === 'network' && (
            <div className="space-y-2 mt-2">
              <SelectInput
                label={t('gtSim.manualDrive.network.transportLabel')}
                value={config.physics_network.transport_type}
                onChange={(e) => setPhysicsNetwork('transport_type', e.target.value)}
              >
                <option value="udp">{t('gtSim.manualDrive.network.transport.udp')}</option>
                <option value="tcp">{t('gtSim.manualDrive.network.transport.tcp')}</option>
              </SelectInput>
              <NumberInput
                label={t('gtSim.manualDrive.physics.cmdPortLabel')}
                value={config.physics_network.cmd_port}
                onChange={(e) => setPhysicsNetwork('cmd_port', Number(e.target.value))}
              />
              <NumberInput
                label={t('gtSim.manualDrive.physics.statePortLabel')}
                value={config.physics_network.state_port}
                onChange={(e) => setPhysicsNetwork('state_port', Number(e.target.value))}
              />
            </div>
          )}
        </section>

        {/* Button Mapping (SDL2 only) */}
        {config.input_type === 'sdl2_wheel' && (
          <section>
            <h3 className={sectionHeading}>{t('gtSim.manualDrive.buttonMapping.heading')}</h3>
            <div className="space-y-1.5">
              {BUTTON_MAPPING_FIELDS.map((key) => {
                const btnIdx = config.sdl2.button_mapping[key];
                const isAssigning = capturing && assigningKey === key;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-secondary)] w-20 shrink-0">
                      {fieldLabels[key]}
                    </span>
                    <span className={`${captureValue} w-12`}>{btnIdx >= 0 ? btnIdx : '—'}</span>
                    <button
                      type="button"
                      onClick={() => (isAssigning ? cancelCapture() : startAssign(key))}
                      className={`${assignBtnBase} ${isAssigning ? assignBtnActive : assignBtnIdle}`}
                    >
                      {isAssigning
                        ? t('gtSim.manualDrive.buttonMapping.pressButton')
                        : t('gtSim.manualDrive.buttonMapping.assign')}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Keyboard Mapping (Keyboard input only) */}
        {config.input_type === 'sdl2_keyboard' && (
          <section>
            <h3 className={sectionHeading}>{t('gtSim.manualDrive.keyboardMapping.heading')}</h3>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mb-2">
              {t('gtSim.manualDrive.keyboardMapping.hint')}
            </p>
            <div className="space-y-1.5">
              {KEYBOARD_BINDING_FIELDS.map((key) => {
                const bound = config.keyboard[key];
                const isAssigning = assigningKbKey === key;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-secondary)] w-20 shrink-0">
                      {fieldLabels[key]}
                    </span>
                    <span className={`${captureValue} min-w-[3rem]`}>{bound || '—'}</span>
                    <button
                      type="button"
                      onClick={() => setAssigningKbKey(isAssigning ? null : key)}
                      className={`${assignBtnBase} ${isAssigning ? assignBtnActive : assignBtnIdle}`}
                    >
                      {isAssigning
                        ? t('gtSim.manualDrive.keyboardMapping.pressKey')
                        : t('gtSim.manualDrive.buttonMapping.assign')}
                    </button>
                  </div>
                );
              })}
            </div>

            <h4 className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mt-4 mb-1.5">
              {t('gtSim.manualDrive.keyboardMapping.response.heading')}
            </h4>
            <div className="space-y-2">
              <NumberInput
                label={t('gtSim.manualDrive.keyboardMapping.response.steerRate')}
                value={config.keyboard.steer_rate}
                step={0.1}
                onChange={(e) => setKeyboard('steer_rate', Number(e.target.value))}
              />
              <NumberInput
                label={t('gtSim.manualDrive.keyboardMapping.response.centeringRate')}
                value={config.keyboard.centering_rate}
                step={0.1}
                onChange={(e) => setKeyboard('centering_rate', Number(e.target.value))}
              />
              <NumberInput
                label={t('gtSim.manualDrive.keyboardMapping.response.pedalPressRate')}
                value={config.keyboard.pedal_press_rate}
                step={0.1}
                onChange={(e) => setKeyboard('pedal_press_rate', Number(e.target.value))}
              />
              <NumberInput
                label={t('gtSim.manualDrive.keyboardMapping.response.pedalReleaseRate')}
                value={config.keyboard.pedal_release_rate}
                step={0.1}
                onChange={(e) => setKeyboard('pedal_release_rate', Number(e.target.value))}
              />
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-[var(--color-glass-edge)]">
          <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_MANUAL_DRIVE_CONFIG)}>
            {t('gtSim.manualDrive.actions.reset')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => saveMutation.mutate(config)}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending
              ? t('gtSim.manualDrive.actions.saving')
              : t('gtSim.manualDrive.actions.save')}
          </Button>
        </div>
        {saveMutation.error && (
          <p className="text-[var(--color-destructive)] text-xs mt-1">
            {saveMutation.error.message}
          </p>
        )}
      </div>
    </SlidePanel>
  );
}

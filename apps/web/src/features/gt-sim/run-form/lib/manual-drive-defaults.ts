/**
 * Manual-drive default network ports + config skeleton.
 *
 * Ported from the GT_Sim fork's `lib/manualDrive.ts` (ports) and the
 * `DEFAULT_MANUAL_CONFIG` constant inlined in the fork's
 * `components/SimulationRunForm.tsx`. The full Manual Drive *settings UI*
 * (`ManualDrivePanel.tsx`, gamepad capture) is cluster C and is not ported
 * here — but the run form still needs a valid default `ManualDriveConfig` to
 * seed local state and to submit when the user picks the "Manual Drive"
 * controller without having touched cluster C's (not-yet-landed) settings
 * panel.
 */
import type { ManualDriveConfig } from '@osce/esmini';

/**
 * The desktop "manual drive" mode pipes a physical input device
 * (wheel/keyboard) into the simulator over UDP, and — for the RealVehicle
 * physics path — exchanges command/state with an external physics process.
 * These defaults are shared by every place that seeds a `ManualDriveConfig`.
 */
export const MANUAL_DRIVE_DEFAULT_PORTS = {
  /** UDP port the input network listens on (pedal/steer commands). */
  input: 9100,
  /** UDP port the physics bridge receives commands on. */
  physicsCmd: 9200,
  /** UDP port the physics bridge publishes vehicle state on. */
  physicsState: 9201,
} as const;

export const DEFAULT_MANUAL_DRIVE_CONFIG: ManualDriveConfig = {
  input_type: 'sdl2_wheel',
  physics_type: 'real_vehicle',
  ffb_enabled: true,
  domain: { lateral: 'manual', longitudinal: 'manual' },
  sdl2: {
    device_index: 0,
    deadzone: 0.05,
    button_mapping: {
      upshift: 4,
      downshift: 5,
      override: 0,
      indicator_left: 7,
      indicator_right: 6,
      headlight: -1,
      high_beam: -1,
      fog_light: -1,
      hazard: -1,
    },
  },
  keyboard: {
    steer_left: 'A',
    steer_right: 'D',
    throttle: 'W',
    brake: 'S',
    clutch: 'LShift',
    upshift: 'E',
    downshift: 'Q',
    override_key: 'O',
    indicator_left: 'Z',
    indicator_right: 'X',
    headlight: 'L',
    high_beam: 'K',
    fog_light: 'F',
    hazard: 'H',
    steer_rate: 2.0,
    centering_rate: 3.0,
    pedal_press_rate: 4.0,
    pedal_release_rate: 6.0,
  },
  input_network: {
    transport_type: 'udp',
    port: MANUAL_DRIVE_DEFAULT_PORTS.input,
    level: 'pedal_steer',
  },
  physics_network: {
    transport_type: 'udp',
    host: '127.0.0.1',
    cmd_port: MANUAL_DRIVE_DEFAULT_PORTS.physicsCmd,
    state_port: MANUAL_DRIVE_DEFAULT_PORTS.physicsState,
  },
  ffb: { spring_coefficient: 0.5, damper_coefficient: 0.3, constant_gain: 1.0, max_force: 1.0 },
};

/**
 * Deep-merge a partial `ManualDriveConfig` (e.g. fetched from the backend or
 * restored from a re-run) over the defaults, so missing nested fields never
 * crash the UI.
 */
export function mergeManualDriveConfig(
  partial: Partial<ManualDriveConfig> | undefined,
): ManualDriveConfig {
  if (!partial) return DEFAULT_MANUAL_DRIVE_CONFIG;
  return {
    ...DEFAULT_MANUAL_DRIVE_CONFIG,
    ...partial,
    domain: { ...DEFAULT_MANUAL_DRIVE_CONFIG.domain, ...partial.domain },
    sdl2: {
      ...DEFAULT_MANUAL_DRIVE_CONFIG.sdl2,
      ...partial.sdl2,
      button_mapping: {
        ...DEFAULT_MANUAL_DRIVE_CONFIG.sdl2.button_mapping,
        ...partial.sdl2?.button_mapping,
      },
    },
    keyboard: { ...DEFAULT_MANUAL_DRIVE_CONFIG.keyboard, ...partial.keyboard },
    input_network: { ...DEFAULT_MANUAL_DRIVE_CONFIG.input_network, ...partial.input_network },
    physics_network: {
      ...DEFAULT_MANUAL_DRIVE_CONFIG.physics_network,
      ...partial.physics_network,
    },
    ffb: { ...DEFAULT_MANUAL_DRIVE_CONFIG.ffb, ...partial.ffb },
  };
}

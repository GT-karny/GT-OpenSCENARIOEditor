import { describe, it, expect } from 'vitest';
import {
  DEFAULT_MANUAL_DRIVE_CONFIG,
  MANUAL_DRIVE_DEFAULT_PORTS,
  mergeManualDriveConfig,
} from '../../../features/gt-sim/run-form/lib/manual-drive-defaults';

describe('manual-drive-defaults', () => {
  it('seeds the input/physics network ports from MANUAL_DRIVE_DEFAULT_PORTS', () => {
    expect(DEFAULT_MANUAL_DRIVE_CONFIG.input_network.port).toBe(MANUAL_DRIVE_DEFAULT_PORTS.input);
    expect(DEFAULT_MANUAL_DRIVE_CONFIG.physics_network.cmd_port).toBe(
      MANUAL_DRIVE_DEFAULT_PORTS.physicsCmd,
    );
    expect(DEFAULT_MANUAL_DRIVE_CONFIG.physics_network.state_port).toBe(
      MANUAL_DRIVE_DEFAULT_PORTS.physicsState,
    );
  });

  it('returns the defaults unchanged when merging undefined', () => {
    expect(mergeManualDriveConfig(undefined)).toEqual(DEFAULT_MANUAL_DRIVE_CONFIG);
  });

  it('deep-merges a partial server config over the defaults without dropping nested fields', () => {
    const merged = mergeManualDriveConfig({
      input_type: 'keyboard',
      sdl2: { device_index: 2, deadzone: 0.1, button_mapping: { upshift: 9 } as never },
    });
    // Overridden nested field wins.
    expect(merged.input_type).toBe('keyboard');
    expect(merged.sdl2.device_index).toBe(2);
    // Missing nested fields fall back to defaults instead of becoming undefined.
    expect(merged.keyboard).toEqual(DEFAULT_MANUAL_DRIVE_CONFIG.keyboard);
    expect(merged.ffb).toEqual(DEFAULT_MANUAL_DRIVE_CONFIG.ffb);
    expect(merged.input_network).toEqual(DEFAULT_MANUAL_DRIVE_CONFIG.input_network);
  });

  it('deep-merges a partial button_mapping without dropping sibling buttons', () => {
    const merged = mergeManualDriveConfig({
      sdl2: {
        device_index: 0,
        deadzone: 0.05,
        button_mapping: { upshift: 99 } as never,
      },
    });
    expect(merged.sdl2.button_mapping.upshift).toBe(99);
    expect(merged.sdl2.button_mapping.downshift).toBe(
      DEFAULT_MANUAL_DRIVE_CONFIG.sdl2.button_mapping.downshift,
    );
  });
});

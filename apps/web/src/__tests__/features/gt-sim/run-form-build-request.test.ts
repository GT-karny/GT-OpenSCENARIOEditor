import { describe, it, expect } from 'vitest';
import { buildRunRequest } from '../../../features/gt-sim/run-form/lib/build-run-request';
import { DEFAULT_MANUAL_DRIVE_CONFIG } from '../../../features/gt-sim/run-form/lib/manual-drive-defaults';
import type { RunFormValues } from '../../../features/gt-sim/run-form/types';

const BASE_VALUES: RunFormValues = {
  controllerType: 'default',
  manualDriveConfig: DEFAULT_MANUAL_DRIVE_CONFIG,
  driveMode: 'comfort',
  laneChangeTiming: 'normal',
  laneChangeGap: 'normal',
  hz: 100,
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

describe('buildRunRequest', () => {
  it('always sends execution.headless explicitly (unified-UI contract)', () => {
    const req = buildRunRequest({
      scenarioId: 'scenario.xosc',
      controller: { controller_type: 'default' },
      values: BASE_VALUES,
    });
    expect(req.execution.headless).toBe(true);
  });

  it('carries projectId and controller through unchanged', () => {
    const req = buildRunRequest({
      scenarioId: 'scenario.xosc',
      projectId: 'proj-1',
      controller: { controller_type: 'virtual_driver' },
      values: BASE_VALUES,
    });
    expect(req.project_id).toBe('proj-1');
    expect(req.controller).toEqual({ controller_type: 'virtual_driver' });
    expect(req.scenario_id).toBe('scenario.xosc');
  });

  it('omits project_id when not provided', () => {
    const req = buildRunRequest({
      scenarioId: 'scenario.xosc',
      controller: { controller_type: 'default' },
      values: BASE_VALUES,
    });
    expect(req.project_id).toBeUndefined();
  });

  it('maps every run-form value into the execution block', () => {
    const req = buildRunRequest({
      scenarioId: 'scenario.xosc',
      controller: { controller_type: 'default' },
      values: {
        ...BASE_VALUES,
        hz: 60,
        headless: false,
        record: true,
        noRealtime: true,
        timeout: 30,
        osiEnabled: false,
        osiIp: '10.0.0.5',
        autolight: true,
        autolightHeadlights: true,
        vehiclePhysics: true,
        kinematicMode: true,
        routeDriveMode: true,
        laneChangeTiming: 'early',
        laneChangeGap: 'tight',
        threads: true,
        winX: 1,
        winY: 2,
        winW: 3,
        winH: 4,
        driveMode: 'sport',
      },
    });
    expect(req.execution).toMatchObject({
      hz: 60,
      headless: false,
      record: true,
      no_realtime: true,
      timeout: 30,
      osi: { enabled: false, ip: '10.0.0.5' },
      autolight: true,
      autolight_headlights: true,
      vehicle_physics: true,
      kinematic_mode: true,
      route_drive_mode: true,
      route_drive_timing: 'early',
      route_drive_gap: 'tight',
      threads: true,
      window: { x: 1, y: 2, w: 3, h: 4 },
      drive_mode: 'sport',
    });
  });

  it('forces autolight_headlights off when autolight itself is off (F6 sub-toggle)', () => {
    const req = buildRunRequest({
      scenarioId: 'scenario.xosc',
      controller: { controller_type: 'default' },
      values: { ...BASE_VALUES, autolight: false, autolightHeadlights: true },
    });
    expect(req.execution.autolight_headlights).toBe(false);
  });

  it('passes through param overrides only when provided', () => {
    const withOverrides = buildRunRequest({
      scenarioId: 'scenario.xosc',
      controller: { controller_type: 'default' },
      values: BASE_VALUES,
      paramOverrides: { speed: '20' },
    });
    expect(withOverrides.param_overrides).toEqual({ speed: '20' });

    const withoutOverrides = buildRunRequest({
      scenarioId: 'scenario.xosc',
      controller: { controller_type: 'default' },
      values: BASE_VALUES,
    });
    expect(withoutOverrides.param_overrides).toBeUndefined();
  });
});

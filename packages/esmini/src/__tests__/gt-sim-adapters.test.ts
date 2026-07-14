import { describe, it, expect } from 'vitest';
import {
  narrowGtSimStatus,
  adaptJobStatus,
  buildGtSimExecutionParams,
  buildGtSimSimulationRequest,
  DEFAULT_GT_SIM_EXECUTION,
} from '../client/gt-sim-adapters.js';
import {
  mapGtSimStatus,
  mapGtSimProgress,
  isGtSimWaiting,
  isGtSimTerminal,
} from '../client/gt-sim-status.js';
import type { GtSimSimulationStatus } from '../client/gt-sim-api-types.js';

function makeJob(overrides: Partial<GtSimSimulationStatus> = {}): GtSimSimulationStatus {
  return {
    job_id: 'job_1',
    scenario_id: 'scn_1',
    project_id: 'prj_1',
    status: 'running',
    controller_type: 'virtual_driver',
    progress_pct: 50,
    pid: 1234,
    exit_code: null,
    output_dir: null,
    started_at: '2026-07-13T00:00:00Z',
    completed_at: null,
    error_message: null,
    options: {},
    ...overrides,
  };
}

describe('status mapping (frozen contract)', () => {
  it('maps every raw status to the frozen editor status', () => {
    expect(mapGtSimStatus('queued')).toBe('running');
    expect(mapGtSimStatus('running')).toBe('running');
    expect(mapGtSimStatus('completed')).toBe('completed');
    expect(mapGtSimStatus('failed')).toBe('error');
    expect(mapGtSimStatus('cancelled')).toBe('error');
    expect(mapGtSimStatus('timeout')).toBe('error');
  });

  it('flags queued as waiting, terminal set as terminal', () => {
    expect(isGtSimWaiting('queued')).toBe(true);
    expect(isGtSimWaiting('running')).toBe(false);
    expect(isGtSimTerminal('completed')).toBe(true);
    expect(isGtSimTerminal('failed')).toBe(true);
    expect(isGtSimTerminal('cancelled')).toBe(true);
    expect(isGtSimTerminal('timeout')).toBe(true);
    expect(isGtSimTerminal('running')).toBe(false);
    expect(isGtSimTerminal('queued')).toBe(false);
  });
});

describe('mapGtSimProgress', () => {
  it('converts 0-100 to 0-1', () => {
    expect(mapGtSimProgress(0)).toBe(0);
    expect(mapGtSimProgress(50)).toBe(0.5);
    expect(mapGtSimProgress(100)).toBe(1);
  });

  it('clamps out-of-range values', () => {
    expect(mapGtSimProgress(-10)).toBe(0);
    expect(mapGtSimProgress(150)).toBe(1);
  });
});

describe('narrowGtSimStatus', () => {
  it('passes known statuses through', () => {
    for (const s of ['queued', 'running', 'completed', 'failed', 'cancelled', 'timeout']) {
      expect(narrowGtSimStatus(s)).toBe(s);
    }
  });

  it('falls back to failed for unknown statuses', () => {
    expect(narrowGtSimStatus('exploded')).toBe('failed');
    expect(narrowGtSimStatus('')).toBe('failed');
  });
});

describe('adaptJobStatus', () => {
  it('adapts a running job', () => {
    const adapted = adaptJobStatus(makeJob({ status: 'running', progress_pct: 42 }));
    expect(adapted.jobId).toBe('job_1');
    expect(adapted.rawStatus).toBe('running');
    expect(adapted.editorStatus).toBe('running');
    expect(adapted.progress).toBeCloseTo(0.42, 10);
    expect(adapted.isWaiting).toBe(false);
    expect(adapted.isTerminal).toBe(false);
  });

  it('adapts a queued job as running + waiting', () => {
    const adapted = adaptJobStatus(makeJob({ status: 'queued', progress_pct: 0 }));
    expect(adapted.editorStatus).toBe('running');
    expect(adapted.isWaiting).toBe(true);
  });

  it('adapts terminal failures with error message preserved', () => {
    const adapted = adaptJobStatus(
      makeJob({ status: 'timeout', progress_pct: 100, error_message: 'timed out' }),
    );
    expect(adapted.editorStatus).toBe('error');
    expect(adapted.isTerminal).toBe(true);
    expect(adapted.errorMessage).toBe('timed out');
  });

  it('keeps the raw wire record accessible', () => {
    const raw = makeJob();
    expect(adaptJobStatus(raw).raw).toBe(raw);
  });
});

describe('buildGtSimExecutionParams', () => {
  it('sends headless:true explicitly by default', () => {
    const exec = buildGtSimExecutionParams();
    expect(exec.headless).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(exec, 'headless')).toBe(true);
  });

  it('allows explicit native-window opt-in (headless:false)', () => {
    expect(buildGtSimExecutionParams({ headless: false }).headless).toBe(false);
  });

  it('enables OSI by default (unified-UI frame supply)', () => {
    expect(buildGtSimExecutionParams().osi).toEqual({ enabled: true, ip: '127.0.0.1' });
  });

  it('deep-merges osi and window overrides', () => {
    const exec = buildGtSimExecutionParams({
      osi: { ip: '10.0.0.1' },
      window: { w: 640 },
    });
    expect(exec.osi).toEqual({ enabled: true, ip: '10.0.0.1' });
    expect(exec.window).toEqual({ ...DEFAULT_GT_SIM_EXECUTION.window, w: 640 });
  });

  it('copies extra_args (no shared reference)', () => {
    const args = ['--foo'];
    const exec = buildGtSimExecutionParams({ extra_args: args });
    expect(exec.extra_args).toEqual(['--foo']);
    expect(exec.extra_args).not.toBe(args);
  });

  it('does not mutate the default template', () => {
    buildGtSimExecutionParams({ osi: { enabled: false }, window: { x: 1 } });
    expect(DEFAULT_GT_SIM_EXECUTION.osi.enabled).toBe(true);
    expect(DEFAULT_GT_SIM_EXECUTION.window.x).toBe(60);
  });
});

describe('buildGtSimSimulationRequest', () => {
  it('builds a request with explicit headless and default controller', () => {
    const req = buildGtSimSimulationRequest({ scenarioId: 'scn_1', projectId: 'prj_1' });
    expect(req.scenario_id).toBe('scn_1');
    expect(req.project_id).toBe('prj_1');
    expect(req.controller).toEqual({ controller_type: 'virtual_driver' });
    expect(req.execution.headless).toBe(true);
    expect(req.param_overrides).toBeUndefined();
  });

  it('omits project_id when not given', () => {
    const req = buildGtSimSimulationRequest({ scenarioId: 'scn_1' });
    expect('project_id' in req).toBe(false);
  });

  it('honours controller / controllerType / paramOverrides', () => {
    const req = buildGtSimSimulationRequest({
      scenarioId: 'scn_1',
      controllerType: 'manual_drive',
      paramOverrides: { speed: '30' },
    });
    expect(req.controller.controller_type).toBe('manual_drive');
    expect(req.param_overrides).toEqual({ speed: '30' });

    const custom = buildGtSimSimulationRequest({
      scenarioId: 'scn_1',
      controller: { controller_type: 'python' },
    });
    expect(custom.controller.controller_type).toBe('python');
  });
});

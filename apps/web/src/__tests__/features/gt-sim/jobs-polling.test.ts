import { describe, it, expect } from 'vitest';
import type { GtSimSimulationStatus } from '@osce/esmini';
import {
  isTerminalJobStatus,
  jobListRefetchInterval,
  jobDetailRefetchInterval,
  JOB_LIST_ACTIVE_INTERVAL_MS,
  JOB_LIST_IDLE_INTERVAL_MS,
  JOB_DETAIL_ACTIVE_INTERVAL_MS,
} from '../../../features/gt-sim/jobs/lib/polling';

function job(status: string): GtSimSimulationStatus {
  return {
    job_id: 'j1',
    scenario_id: 's1',
    project_id: null,
    status,
    controller_type: 'virtual_driver',
    progress_pct: 0,
    pid: null,
    exit_code: null,
    output_dir: null,
    started_at: null,
    completed_at: null,
    error_message: null,
    options: {},
  };
}

describe('jobs polling helpers', () => {
  describe('isTerminalJobStatus', () => {
    it('treats completed/failed/cancelled/timeout as terminal', () => {
      expect(isTerminalJobStatus('completed')).toBe(true);
      expect(isTerminalJobStatus('failed')).toBe(true);
      expect(isTerminalJobStatus('cancelled')).toBe(true);
      expect(isTerminalJobStatus('timeout')).toBe(true);
    });

    it('treats queued/running as non-terminal', () => {
      expect(isTerminalJobStatus('queued')).toBe(false);
      expect(isTerminalJobStatus('running')).toBe(false);
    });

    it('treats an unrecognized status as terminal (narrows to failed)', () => {
      expect(isTerminalJobStatus('some-unknown-status')).toBe(true);
    });
  });

  describe('jobListRefetchInterval', () => {
    it('polls fast when any job on the page is live', () => {
      expect(jobListRefetchInterval([job('running'), job('completed')])).toBe(
        JOB_LIST_ACTIVE_INTERVAL_MS,
      );
      expect(jobListRefetchInterval([job('queued')])).toBe(JOB_LIST_ACTIVE_INTERVAL_MS);
    });

    it('polls slow when every job on the page is terminal', () => {
      expect(jobListRefetchInterval([job('completed'), job('failed')])).toBe(
        JOB_LIST_IDLE_INTERVAL_MS,
      );
    });

    it('polls slow for an empty page', () => {
      expect(jobListRefetchInterval([])).toBe(JOB_LIST_IDLE_INTERVAL_MS);
    });
  });

  describe('jobDetailRefetchInterval', () => {
    it('stops polling once data is undefined (no query result yet)', () => {
      expect(jobDetailRefetchInterval(undefined)).toBe(false);
    });

    it('polls fast while running/queued', () => {
      expect(jobDetailRefetchInterval('running')).toBe(JOB_DETAIL_ACTIVE_INTERVAL_MS);
      expect(jobDetailRefetchInterval('queued')).toBe(JOB_DETAIL_ACTIVE_INTERVAL_MS);
    });

    it('stops polling once terminal', () => {
      expect(jobDetailRefetchInterval('completed')).toBe(false);
      expect(jobDetailRefetchInterval('failed')).toBe(false);
      expect(jobDetailRefetchInterval('cancelled')).toBe(false);
      expect(jobDetailRefetchInterval('timeout')).toBe(false);
    });
  });
});

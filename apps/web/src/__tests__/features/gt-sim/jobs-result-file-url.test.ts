import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGtSimConnectionStore } from '../../../features/gt-sim/stores/gt-sim-connection-store';
import {
  buildResultFileUrl,
  useResultFileUrl,
} from '../../../features/gt-sim/jobs/lib/result-file-url';

describe('result-file-url', () => {
  beforeEach(() => {
    useGtSimConnectionStore.getState().reset();
  });

  describe('buildResultFileUrl', () => {
    it('builds the absolute results-file URL and trims a trailing slash on the base', () => {
      expect(buildResultFileUrl('http://127.0.0.1:8000/', 'job-1', 'metrics.json')).toBe(
        'http://127.0.0.1:8000/api/results/job-1/files/metrics.json',
      );
    });

    it('encodes both the job id and the file name', () => {
      expect(buildResultFileUrl('http://127.0.0.1:8000', 'job 1', 'a file.csv')).toBe(
        'http://127.0.0.1:8000/api/results/job%201/files/a%20file.csv',
      );
    });
  });

  describe('useResultFileUrl', () => {
    it('returns null while disconnected', () => {
      const { result } = renderHook(() => useResultFileUrl('job-1', 'out.jsonl'));
      expect(result.current).toBeNull();
    });

    it('returns the absolute URL once connected', () => {
      useGtSimConnectionStore.getState().applyStatus({
        state: 'ready',
        endpoints: {
          restBaseUrl: 'http://127.0.0.1:8000',
          wsBaseUrl: 'ws://127.0.0.1:8000',
          grpcPort: 50051,
        },
      });
      const { result } = renderHook(() => useResultFileUrl('job-1', 'out.jsonl'));
      expect(result.current).toBe('http://127.0.0.1:8000/api/results/job-1/files/out.jsonl');
    });
  });
});

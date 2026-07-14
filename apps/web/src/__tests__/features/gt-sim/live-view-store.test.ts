import { describe, it, expect, beforeEach } from 'vitest';
import { useLiveViewStore } from '../../../features/gt-sim/live/stores/live-view-store';

describe('live-view-store', () => {
  beforeEach(() => {
    useLiveViewStore.getState().setWatchedJobId(null);
  });

  it('starts with no watched job', () => {
    expect(useLiveViewStore.getState().watchedJobId).toBeNull();
  });

  it('setWatchedJobId updates the watched job', () => {
    useLiveViewStore.getState().setWatchedJobId('job-123');
    expect(useLiveViewStore.getState().watchedJobId).toBe('job-123');
  });

  it('setWatchedJobId(null) clears the watched job', () => {
    useLiveViewStore.getState().setWatchedJobId('job-123');
    useLiveViewStore.getState().setWatchedJobId(null);
    expect(useLiveViewStore.getState().watchedJobId).toBeNull();
  });
});

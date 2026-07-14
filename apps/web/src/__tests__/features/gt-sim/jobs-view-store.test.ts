import { describe, it, expect, beforeEach } from 'vitest';
import { useJobsViewStore } from '../../../features/gt-sim/jobs/stores/jobs-view-store';

describe('jobs-view-store', () => {
  beforeEach(() => {
    useJobsViewStore.setState({ selectedJobId: null, statusFilter: '', page: 0 });
  });

  it('starts with no selection, no filter, first page', () => {
    const s = useJobsViewStore.getState();
    expect(s.selectedJobId).toBeNull();
    expect(s.statusFilter).toBe('');
    expect(s.page).toBe(0);
  });

  it('selectJob sets and clearSelection resets the selected job id', () => {
    useJobsViewStore.getState().selectJob('job-42');
    expect(useJobsViewStore.getState().selectedJobId).toBe('job-42');
    useJobsViewStore.getState().clearSelection();
    expect(useJobsViewStore.getState().selectedJobId).toBeNull();
  });

  it('setStatusFilter resets pagination to page 0 (mirrors the fork behavior)', () => {
    useJobsViewStore.getState().setPage(3);
    expect(useJobsViewStore.getState().page).toBe(3);

    useJobsViewStore.getState().setStatusFilter('running');
    const s = useJobsViewStore.getState();
    expect(s.statusFilter).toBe('running');
    expect(s.page).toBe(0);
  });

  it('setPage updates the page independently of the filter', () => {
    useJobsViewStore.getState().setStatusFilter('failed');
    useJobsViewStore.getState().setPage(2);
    const s = useJobsViewStore.getState();
    expect(s.statusFilter).toBe('failed');
    expect(s.page).toBe(2);
  });
});

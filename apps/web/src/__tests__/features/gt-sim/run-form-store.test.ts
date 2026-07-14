import { describe, it, expect, beforeEach } from 'vitest';
import { useRunFormStore } from '../../../features/gt-sim/run-form/store';

describe('run-form view-state store', () => {
  beforeEach(() => {
    useRunFormStore.getState().reset();
  });

  it('starts with no selection and no active/latest job', () => {
    const s = useRunFormStore.getState();
    expect(s.selectedProjectId).toBeNull();
    expect(s.selectedScenarioFile).toBeNull();
    expect(s.latestJobId).toBeNull();
    expect(s.activeJobId).toBeNull();
  });

  it('clears the scenario selection when the project changes', () => {
    const { setSelectedProject, setSelectedScenario } = useRunFormStore.getState();
    setSelectedProject('proj-1');
    setSelectedScenario('a.xosc');
    expect(useRunFormStore.getState().selectedScenarioFile).toBe('a.xosc');

    setSelectedProject('proj-2');
    expect(useRunFormStore.getState().selectedProjectId).toBe('proj-2');
    expect(useRunFormStore.getState().selectedScenarioFile).toBeNull();
  });

  it('tracks latest and active job ids independently', () => {
    const { setLatestJobId, setActiveJobId } = useRunFormStore.getState();
    setLatestJobId('job-1');
    setActiveJobId('job-1');
    expect(useRunFormStore.getState().latestJobId).toBe('job-1');
    expect(useRunFormStore.getState().activeJobId).toBe('job-1');

    // Job finishes: activeJobId clears, latestJobId is kept for display.
    setActiveJobId(null);
    expect(useRunFormStore.getState().activeJobId).toBeNull();
    expect(useRunFormStore.getState().latestJobId).toBe('job-1');
  });

  it('reset() restores the initial state', () => {
    const { setSelectedProject, setSelectedScenario, setLatestJobId, setActiveJobId, reset } =
      useRunFormStore.getState();
    setSelectedProject('proj-1');
    setSelectedScenario('a.xosc');
    setLatestJobId('job-1');
    setActiveJobId('job-1');

    reset();

    const s = useRunFormStore.getState();
    expect(s.selectedProjectId).toBeNull();
    expect(s.selectedScenarioFile).toBeNull();
    expect(s.latestJobId).toBeNull();
    expect(s.activeJobId).toBeNull();
  });
});

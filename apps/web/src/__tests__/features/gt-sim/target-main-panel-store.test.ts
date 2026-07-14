import { describe, it, expect, beforeEach } from 'vitest';
import {
  useMainPanelStore,
  LIVE_MONITOR_PANEL_ID,
} from '../../../features/gt-sim/stores/main-panel-store';

describe('main-panel-store (WP5, ExecutionLayout main-slot tabs)', () => {
  beforeEach(() => {
    useMainPanelStore.setState({ activePanelId: null });
  });

  it('starts with no active panel selected (ExecutionLayout defaults to the first panel)', () => {
    expect(useMainPanelStore.getState().activePanelId).toBeNull();
  });

  it('setActivePanelId updates the active panel', () => {
    useMainPanelStore.getState().setActivePanelId(LIVE_MONITOR_PANEL_ID);
    expect(useMainPanelStore.getState().activePanelId).toBe(LIVE_MONITOR_PANEL_ID);
  });

  it('exposes the live-monitor panel id used by cross-cluster "view live" wiring', () => {
    expect(LIVE_MONITOR_PANEL_ID).toBe('gt-sim-live-monitor');
  });
});

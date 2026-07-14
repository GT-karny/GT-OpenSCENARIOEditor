import { describe, it, expect } from 'vitest';
import { getExecutionPanels } from '../../../features/gt-sim/panel-registry';
import '../../../features/gt-sim/verification/register';

describe('verification/register', () => {
  it('registers the VD verification panel in the main slot at order 20', () => {
    const panels = getExecutionPanels('main');
    const mine = panels.find((p) => p.id === 'gt-sim-vd-verification');
    expect(mine).toBeDefined();
    expect(mine?.order).toBe(20);
    expect(mine?.placement).toBe('main');
    expect(typeof mine?.component).toBe('function');
  });
});

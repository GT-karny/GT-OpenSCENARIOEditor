import { describe, it, expect } from 'vitest';
import { getAllExecutionPanels } from '../../../features/gt-sim/panel-registry';
import '../../../features/gt-sim/run-form/register';

describe('run-form panel registration', () => {
  it('registers the run form into the side slot at order 10', () => {
    const panel = getAllExecutionPanels().find((p) => p.id === 'gt-sim-run-form');
    expect(panel).toBeDefined();
    expect(panel?.placement).toBe('side');
    expect(panel?.order).toBe(10);
    expect(typeof panel?.component).toBe('function');
  });
});

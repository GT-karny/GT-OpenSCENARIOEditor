import { describe, it, expect } from 'vitest';
import { getExecutionPanels } from '../../../features/gt-sim/panel-registry';
import '../../../features/gt-sim/odr/register';

describe('odr/register (cluster G)', () => {
  it('registers the ODR metadata panel into the side slot at order 60', () => {
    const panels = getExecutionPanels('side');
    const mine = panels.find((p) => p.id === 'gt-sim-odr-metadata');
    expect(mine).toBeDefined();
    expect(mine?.placement).toBe('side');
    expect(mine?.order).toBe(60);
    expect(typeof mine?.component).toBe('function');
  });
});

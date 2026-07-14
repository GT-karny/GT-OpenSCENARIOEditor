/**
 * Cluster H' panel registration.
 *
 * Registers the settings panel into the `side` slot at module load, order 90
 * (last — per the migration plan WP4 table, this is "cluster H' (foundation)":
 * settings + projects_root sync, the least frequently used surface, placed
 * below run-form (order 10) and jobs-detail (order 50)).
 *
 * TRUNK TODO: this lane may not edit `../panels.ts` itself (see that file's
 * header comment) — the trunk lane must add `import './settings/register';`
 * there for this panel to actually render.
 */
import { registerExecutionPanel } from '../panel-registry';
import { SettingsPanel } from './SettingsPanel';

registerExecutionPanel('gt-sim-settings', {
  title: 'Settings',
  component: SettingsPanel,
  placement: 'side',
  order: 90,
});

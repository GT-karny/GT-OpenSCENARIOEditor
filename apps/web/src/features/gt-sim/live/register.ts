/**
 * Cluster E (live view) panel registration — module-load side effect.
 *
 * Per the trunk brief: `LiveMonitorPanel` (2D scene + layer toggles) occupies
 * the `main` slot; `OsiLivePanel` / `HvdGaugePanel` / `SvLivePanel` occupy the
 * `side` slot at order 20/21/22. `ExecutionLayout`/`panels.ts` are trunk-owned
 * and never import this directory directly — the trunk lane adds
 * `import './live/register';` to `panels.ts` when this cluster lands (see this
 * lane's final report).
 *
 * `title` is not currently rendered anywhere in `ExecutionLayout` (WP3 ships
 * plain panel stacking, no tab bar) — plain English literals here, matching
 * the pattern used by other registered panels' tests. Revisit with i18n once a
 * panel-chrome UI consumes `title`.
 */
import { registerExecutionPanel } from '../panel-registry';
import { LiveMonitorPanel } from './components/LiveMonitorPanel';
import { OsiLivePanel } from './components/OsiLivePanel';
import { HvdGaugePanel } from './components/HvdGaugePanel';
import { SvLivePanel } from './components/SvLivePanel';

registerExecutionPanel('gt-sim-live-monitor', {
  title: 'Live Monitor',
  component: LiveMonitorPanel,
  placement: 'main',
  order: 10,
});

registerExecutionPanel('gt-sim-live-osi', {
  title: 'OSI Data',
  component: OsiLivePanel,
  placement: 'side',
  order: 20,
});

registerExecutionPanel('gt-sim-live-hvd', {
  title: 'Vehicle Telemetry',
  component: HvdGaugePanel,
  placement: 'side',
  order: 21,
});

registerExecutionPanel('gt-sim-live-sv', {
  title: 'Scenario Variables',
  component: SvLivePanel,
  placement: 'side',
  order: 22,
});

/**
 * Cluster B panel registration.
 *
 * Registers the run-form panel into the `side` slot at module load. The
 * trunk lane wires this in by adding one import line to `../panels.ts`
 * (cluster lanes do not edit that file themselves — see its header comment).
 */
import { registerExecutionPanel } from '../panel-registry';
import { RunFormPanel } from './RunFormPanel';

registerExecutionPanel('gt-sim-run-form', {
  title: 'Run',
  component: RunFormPanel,
  placement: 'side',
  order: 10,
});

/**
 * Registers cluster D's execution panels at module load: the job list
 * (bottom dock, order 10) and the job detail view (right inspector column,
 * order 50). Per `panel-registry.ts`'s contract, the trunk lane imports this
 * module once from `features/gt-sim/panels.ts` when this cluster lands —
 * this lane must not edit `panels.ts` or `ExecutionLayout.tsx` itself.
 */
import { registerExecutionPanel } from '../panel-registry';
import { JobListPanel } from './components/JobListPanel';
import { JobDetailPanel } from './components/JobDetailPanel';

registerExecutionPanel('gt-sim-jobs-list', {
  title: 'Jobs',
  component: JobListPanel,
  placement: 'bottom',
  order: 10,
});

registerExecutionPanel('gt-sim-jobs-detail', {
  title: 'Job Detail',
  component: JobDetailPanel,
  placement: 'side',
  order: 50,
});

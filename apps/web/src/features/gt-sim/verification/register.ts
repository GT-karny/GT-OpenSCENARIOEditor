/**
 * Registers cluster F's execution panel (side effect, per
 * `panel-registry.ts`'s contract). Imported once from the trunk-owned
 * `../panels.ts` — this directory must not edit that file or
 * `ExecutionLayout.tsx` itself.
 */
import { registerExecutionPanel } from '../panel-registry';
import { VdVerificationPanel } from './VdVerificationPanel';

registerExecutionPanel('gt-sim-vd-verification', {
  title: 'VirtualDriver Verification',
  component: VdVerificationPanel,
  placement: 'main',
  order: 20,
});

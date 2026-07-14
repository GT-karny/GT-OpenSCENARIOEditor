/**
 * Cluster G (ODR metadata panel) registration — module-load side effect.
 *
 * Registers `OdrMetadataSidePanel` (project/scenario picker + the embedded
 * `OdrMetadataPanel`) into the `side` slot. Per the trunk brief: the trunk
 * lane adds `import './odr/register';` to `../panels.ts` when this cluster
 * lands — cluster lanes do not edit that file themselves.
 *
 * `title` is not currently rendered anywhere in `ExecutionLayout` (WP3 ships
 * plain panel stacking, no tab bar) — plain English literal here, matching
 * the pattern used by other registered panels (see `live/register.ts`).
 */
import { registerExecutionPanel } from '../panel-registry';
import { OdrMetadataSidePanel } from './components/OdrMetadataSidePanel';

registerExecutionPanel('gt-sim-odr-metadata', {
  title: 'ODR Metadata',
  component: OdrMetadataSidePanel,
  placement: 'side',
  order: 60,
});

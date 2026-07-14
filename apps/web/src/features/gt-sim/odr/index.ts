/**
 * `features/gt-sim/odr` barrel.
 *
 * Cross-cluster contract: `OdrMetadataPanel` is fork-prop-compatible
 * (`projectId` / `scenarioFile` / `defaultOpen`) so other clusters can embed
 * it directly — e.g. cluster F's `AnnotateView`, which already resolves
 * `project_id` / `scenario_file` for the selected verification run and
 * intentionally left the fork's sidebar slot for this cluster to fill (see
 * that file's module doc). Import from `@/features/gt-sim/odr`.
 */
export { OdrMetadataPanel, type OdrMetadataPanelProps } from './components/OdrMetadataPanel';
export { OdrMetadataSidePanel } from './components/OdrMetadataSidePanel';

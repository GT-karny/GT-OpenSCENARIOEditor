/**
 * `features/gt-sim/target` barrel — WP5 execution-target switch (WASM /
 * GT_Sim). Consumed by `features/simulation/components/toolbar/SimulationButtons.tsx`.
 */
export { useExecutionTargetStore, type ExecutionTarget } from './store';
export { useGtSimSimulation, type GtSimSimulationTarget } from './use-gtsim-simulation';
export { TargetSwitcher } from './TargetSwitcher';

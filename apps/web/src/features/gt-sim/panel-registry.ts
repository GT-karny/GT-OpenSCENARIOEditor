/**
 * Execution-mode panel registry.
 *
 * The GT_Sim execution mode (`features/gt-sim/`) is assembled from panels that
 * each cluster (B/C/D/E/F/G) contributes from its OWN directory. Clusters call
 * `registerExecutionPanel` at module load; `ExecutionLayout` (WP3) renders the
 * registered panels per slot via `getExecutionPanels`. This keeps
 * `ExecutionLayout` free of per-cluster imports, so cluster lanes never edit a
 * shared layout file (structural conflict avoidance).
 *
 * This is the contract only — a module-level Map plus accessors. The layout
 * that consumes it is built in WP3 (Phase 1).
 */

import type { ComponentType } from 'react';

/**
 * Layout slots of `ExecutionLayout`, matching the fork's execution screen:
 *  - `main`:   primary viewport (3d-viewer live scene / 2D LiveSceneView / replay).
 *  - `side`:   right inspector column (run form, telemetry, settings, presets).
 *  - `bottom`: dock strip (job list, transport/scrubber, status timeline).
 */
export type ExecutionPanelPlacement = 'main' | 'side' | 'bottom';

/**
 * A registered panel component. Panels are self-contained (they read their own
 * data from stores / react-query), so no props are required. The prop type is
 * widened in WP3 if `ExecutionLayout` needs to inject shared context.
 */
export type ExecutionPanelComponent = ComponentType;

export interface ExecutionPanelConfig {
  /** Human-readable panel title (tab / header label). */
  title: string;
  /** The panel component. */
  component: ExecutionPanelComponent;
  /** Which layout slot the panel renders in. */
  placement: ExecutionPanelPlacement;
  /** Sort order within the slot (ascending; default 0, ties broken by id). */
  order?: number;
}

/** A registered panel: its config plus the id it was registered under. */
export interface ExecutionPanelDefinition extends ExecutionPanelConfig {
  id: string;
}

const registry = new Map<string, ExecutionPanelDefinition>();

/**
 * Register an execution-mode panel. Called at module load from a cluster's own
 * directory. Re-registering the same `id` overwrites the previous definition
 * (last write wins; tolerates HMR re-execution).
 */
export function registerExecutionPanel(id: string, config: ExecutionPanelConfig): void {
  registry.set(id, { id, ...config });
}

/** Remove a registered panel by id. Returns true if one was removed. */
export function unregisterExecutionPanel(id: string): boolean {
  return registry.delete(id);
}

/** All panels registered for a slot, sorted by `order` then `id`. */
export function getExecutionPanels(placement: ExecutionPanelPlacement): ExecutionPanelDefinition[] {
  return [...registry.values()]
    .filter((panel) => panel.placement === placement)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id));
}

/** All registered panels, sorted by `order` then `id`. */
export function getAllExecutionPanels(): ExecutionPanelDefinition[] {
  return [...registry.values()].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id),
  );
}

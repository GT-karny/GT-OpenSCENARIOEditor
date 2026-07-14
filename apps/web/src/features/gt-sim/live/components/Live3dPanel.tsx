/**
 * `Live3dPanel` — SCAFFOLD ONLY, not registered. WP5 investigation output for
 * D2 ("3d-viewer接続もここ").
 *
 * ## Investigation summary
 *
 * The trunk brief asked this lane to attempt a self-contained 3D live view
 * (OSI WS frame -> `@osce/3d-viewer`) without editing shared files
 * (`simulation-store`, `@osce/3d-viewer`, etc). Findings:
 *
 * 1. `@osce/3d-viewer`'s `ScenarioViewer` (the only exported live-3D surface)
 *    requires `scenarioStore: ReturnType<typeof useScenarioStoreApi>` and
 *    `openDriveDocument: OpenDriveDocument | null` as *required* props
 *    (`apps/web/src/features/simulation/components/layout/SimulationViewerBridge.tsx:14-43`).
 *    These are the OpenSCENARIO/OpenDRIVE *editor* document stores — they hold
 *    the authored entity catalog (3D model refs, colors) and road network that
 *    `ScenarioViewer` uses to resolve what to draw for each entity.
 * 2. `currentFrame`/`simulationStatus` ARE plain props (see
 *    `SimulationViewerBridge`, which computes them from `simulation-store` and
 *    passes them down) — so feeding OSI-derived `SimulationFrame`s in is not
 *    itself the blocker.
 * 3. The blocker is `scenarioStore`/`openDriveDocument`: GT_Sim execution mode
 *    has no open editor document (a job is `scenario_id` + `project_id`
 *    against the GT_Sim backend, not an in-editor authored scenario). OSI
 *    GroundTruth objects are backend-tracked entities with arbitrary numeric
 *    ids that appear/disappear per frame — they do not correspond to an
 *    authored entity list the way `ScenarioViewer` expects (catalog-bound,
 *    known ahead of time). Constructing a *fake* `scenarioStore` instance
 *    inside this lane's own directory (permitted — it would not edit any
 *    shared file) would still require either:
 *      a. re-parsing the job's `.xosc` from the GT_Sim project via REST into a
 *         throwaway `useScenarioStoreApi()` instance + parsing its road file
 *         into an `OpenDriveDocument`, entirely independent of the live OSI
 *         object ids (fragile: authored entity names vs. OSI object ids are
 *         not guaranteed to line up 1:1, especially for traffic spawned by
 *         controllers), or
 *      b. `@osce/3d-viewer` gaining a raw-OSI-objects rendering path that
 *         does not need a scenario/OpenDRIVE document at all.
 *    Both are `@osce/3d-viewer` / cross-package scope, not something one
 *    cluster-E directory can complete self-contained.
 *
 * ## Decision (per trunk brief: "2D優先、3Dはベストエフォート")
 *
 * 2D `LiveSceneView` (this directory) is the complete, functional live/replay
 * view. This file is left as an unregistered scaffold documenting the above
 * for WP5, instead of forcing a mismatched integration or registering a
 * non-functional panel. **Not wired into `register.ts`.**
 *
 * ## WP5 options for a real 3D live view
 *
 * - **(a) `@osce/3d-viewer` a raw-object rendering mode**: a new prop path on
 *   `ScenarioViewer` (or a new lighter component) that accepts
 *   `GtSimOsiObject[]` + `GtSimOsiTrafficLight[]` directly (no scenarioStore/
 *   openDriveDocument), falling back to primitive shapes keyed by
 *   `obj_type`/`vehicle_class` (mirrors this lane's 2D `sceneLayers.tsx`
 *   classification) instead of catalog-resolved 3D models. This is the
 *   cleanest match to OSI GroundTruth's actual shape.
 * - **(b) Ephemeral scenario-store bridge**: on watch, fetch the job's
 *   scenario file + road file from the GT_Sim project (read-only REST, no new
 *   endpoints needed) and construct a throwaway `useScenarioStoreApi()` +
 *   `OpenDriveDocument` purely for 3D-model resolution, then map OSI object
 *   `name` (not `id`) to authored entity name where they match, static
 *   environment (road) only otherwise. More work, better visual fidelity for
 *   scenarios with fixed named traffic; degrades for controller-spawned actors.
 */
export function Live3dPanelScaffold(): null {
  // Intentionally renders nothing — see module doc. Not registered as an
  // execution panel; kept only so the investigation above has a concrete
  // anchor point for WP5 to pick up.
  return null;
}

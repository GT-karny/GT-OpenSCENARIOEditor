# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1] - 2026-07-31

### Added

- **GT_Sim runtime execution integration** — run scenarios against a GT_Sim
  (esmini fork) backend alongside the in-browser WASM path:
  - New execution editor mode bundling run form, job list/detail/results, live
    view, VD verification, manual-drive settings, ODR metadata, and settings
    panels in the unified UI.
  - Runtime backend connection managed by the Electron desktop app with
    persisted configuration; REST/WS communication layer and a frozen API
    client contract in `@osce/esmini`.
  - WASM/GT_Sim execution-target switch with cross-panel wiring.
- **Controller handoff authoring** — scenarios can now express a
  VirtualDriver ↔ manual-drive handoff:
  - `ActivateControllerAction` gains the v1.3 `objectControllerRef` attribute,
    emitted version-aware (`objectControllerRef` for `revMinor >= 3`,
    `controllerRef` for `<= 2`) with lossless parser/serializer round-trip.
  - Per-domain flags (`lateral` / `longitudinal` / `animation` / `lighting`)
    are authored as an explicit tri-state (unspecified / on / off), so an
    intended `false` is written distinctly from an omitted attribute.
  - Entities can hold multiple `ObjectController` definitions (matching the
    unbounded XSD cardinality), enabling split-domain setups such as
    lateral = ManualDrive / longitudinal = VirtualDriver.

### Changed

- Add a `GlassPanel` component to `@osce/theme-apex`.
- Batch GT_Sim frame ingestion per animation frame.

### Fixed

- 3D viewer auto-recovers from WebGL context loss, with GPU fallbacks.
- Break an infinite render loop when a run-form scenario is selected.
- Keep seconds in the Environment `TimeOfDay` dateTime value.
- Inject CORS headers for GT_Sim backend API responses and keep inlined
  workspace packages out of runtime dependencies.

## [0.5.0] - 2026-07-08

### Added

- **OpenDRIVE 1.9 support** across load, edit, visualize, and save:
  - Lossless round-trip for unknown/unmodeled content via consumption-tracking
    passthrough; unedited road networks feed the simulator byte-identically.
  - Explicit modeling of the 1.9 surface: dual `<lanes>` layers (permanent +
    temporary), junction type variants (default/virtual/direct/crossing) with
    typed `crossPath`/`roadSection`/`linkedRoad`, lane attributes
    (`direction`, `advisory`, dynamic flags, `roadWorks`), access
    `<restriction>` children, lane-link multiplicity with layers, road-type
    speed literals (`no limit`/`undefined`), `crossSectionSurface`, validity
    layers, and signal `<semantics>` (all 15 entry kinds).
  - Visualization: superelevation banking applied to road surfaces, junction
    surfaces, road marks, and all entity/signal/overlay resolvers;
    authored-value display for `crossSectionSurface` roads; temporary
    lane-layer overlay with viewer toggle; minimal 3D rendering of road
    objects with a document/simulator provenance boundary; new lane-type and
    road-mark colors (`shared`, `walking`, `slipLane`, `black`).
  - Editing: junction structural editing (road sections, cross paths, linked
    roads, virtual attributes), lane flags and access restrictions, signal
    semantics editor, poly3/paramPoly3 coefficients, elevation-profile graph
    editing with single-step undo, root controller management, geometry
    segment add/remove with automatic plan-view re-chaining, road-type entry
    management, and deprecation hints for superseded lane types.
  - Version-aware saving: documents using 1.9 constructs are automatically
    stamped `revMinor="9"` with a notification; pre-1.9 documents stay on
    their declared version.
- **Objects sidebar tab** listing document-authored road objects, tunnels, and
  bridges with a read-only property inspector.
- **Controllers sidebar tab** with full controller CRUD.
- Playwright end-to-end suite runs in CI (GitHub Actions) alongside unit
  tests, with seeded sample projects and browser caching.

### Changed

- Documents (scenario, road network, catalogs, parameter distributions) share
  a unified registry with revision-derived dirty state and per-document undo;
  catalog and distribution edits are undoable.
- The web app follows a feature-first layout (`scenario` / `road` /
  `simulation`), with pure file moves preserving git history.
- Parser exhaustiveness is enforced by canonical type lists welded to the
  OpenSCENARIO union types; round-trip defaults are validated against the XSD.
- The re-serialization warning shown when simulating an edited road network
  was removed: every known loss it guarded against is now modeled.

### Fixed

- Editing a road network no longer risks silently simulating a stale version
  of it; validity is derived from undo-history revisions.
- Junction type switches can no longer emit schema-invalid XML (virtual
  attributes and variant children are cleared and emission is gated by type).
- Geometry segment operations keep the plan view contiguous and `road.length`
  consistent.
- Viewer toolbar buttons no longer render beneath the fly-speed slider.
- OpenSCENARIO parsing gaps: unknown positions now fail loudly instead of
  falling back to (0,0); empty-element actions round-trip; `<PrivateAction>`
  routing follows the canonical action list.

[0.5.0]: https://github.com/GT-karny/GT-OpenSCENARIOEditor/releases/tag/v0.5.0

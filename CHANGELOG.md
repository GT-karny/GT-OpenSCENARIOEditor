# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

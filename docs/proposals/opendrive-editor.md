# Proposal: OpenDRIVE Editor

Add OpenDRIVE (`.xodr`) editing capability inside the OpenSCENARIO Editor as a dedicated in-app tab ("Scenario" / "Road Network").

## Motivation

Enable scenario creators to build and edit road networks directly inside the editor, eliminating the need for external tools like CarMaker or RoadRunner. The key differentiator is **seamless Scenario ↔ Road reactive data sharing** — edits to a road network reflect immediately in the Scenario tab.

## Scope

| Concern | Package |
|---|---|
| Parsing & geometry | [packages/opendrive/](../../packages/opendrive/) — `.xodr` parser, road shape computation, mesh generation |
| Editing engine | [packages/opendrive-engine/](../../packages/opendrive-engine/) — Zustand store, Command pattern, builders, road/lane operations |
| Serializer | `packages/opendrive/src/serializer/` |
| UI | `apps/web/src/components/opendrive/` |
| 3D gizmos | `packages/3d-viewer/src/interaction/road-editing/` |

## Key Decisions

| Decision | Choice |
|---|---|
| Target user | Scenario creators (simplicity first) |
| Geometry support | Display all 5, edit 3 (line / arc / spiral) |
| Lane UI | Cross-section view with `s` slider |
| 3D gizmo style | Bezier-style handles |
| Data sharing | Reactive — edits reflect immediately in Scenario tab |
| Phase order | Phase 1 (serializer + property) → Phase 2 (store + CRUD) → Phase 4 (3D gizmos) |
| Parallelization | Agent Team with 9 worktree streams |

## Status

This is a long-running initiative being implemented in phases. See git history under `packages/opendrive*` and `apps/web/src/components/opendrive/` for current progress, and check open issues / PRs for the active phase.

# Proposal: LHT (Left-Hand Traffic) Support

> **Status: implemented (2026-07).** The remaining-work list below is done; this document is
> kept as the reference for how traffic-rule handling works and what conventions apply.

Add left-hand-traffic support across the editor.

## Motivation

OpenDRIVE supports RHT (right-hand traffic) and LHT (left-hand traffic) via the **per-`<road>`
`rule` attribute** (OpenDRIVE 1.7+; when missing, RHT is assumed). An RHT-only editor limits
usefulness for creating scenarios in **UK, Japan, Australia**, and other LHT regions.

> **Spec correction (2026-07):** an earlier revision of this proposal claimed the rule lived on
> the `<header>` element. That is wrong — the XSD defines `rule` only on `<road>`
> (`e_trafficRule`, see `OpenDRIVE_Road.xsd`); there is no document-level traffic rule.
> Consequently the "UI toggle" item was delivered as (a) the per-road Rule selector in the road
> property editor and (b) an editor-level *default* for newly created roads plus a bulk
> "Apply to all roads" action — not a header field.

## How It Works Today

- **Model / round-trip**: `OdrRoad.rule` (`'RHT' | 'LHT'`, `packages/shared/src/types/odr-road.ts`)
  is parsed and serialized; the attribute is omitted when unset (XSD default = RHT).
- **Canonical direction relation**: a lane travels against +s iff `isLeftLane === isRHT` —
  single-sourced in `computeDrivingHeading()` (`packages/opendrive/src/geometry/driving-direction.ts`).
  See `docs/development/opendrive-lht-rht.md` for the derivation.
- **Junction pipeline**: `computeRoadEndpoint` / `getReceivingLanes` / `buildOuterEdgePairs`
  branch on `trafficRule`; `planJunctionCreation`, junction regeneration, the auto-junction
  detection hook and the manual creation path all pass each road's own `rule`.
  `buildRoutingOverrides`'s "dedicated" preset mirrors its innermost/outermost turn assignment
  under LHT.
- **Lane tools**: taper direction resolves through `resolveTaperSDirection(side, direction, rule)`.
- **Signals**: `resolveSignalOrientation()` applies the same XOR to lane-relative orientation.
- **3D viewer**: the driving-direction arrow overlay (`DrivingDirectionArrows`, "Dir" toolbar
  toggle, preference `showDrivingDirection`) renders per-lane travel chevrons via
  `computeDrivingHeading` and flips live when a road's rule changes. Road meshes and lane
  markings are intentionally rule-independent (lane-ID sign geometry per OpenDRIVE §9), as are
  route/BFS graph traversal and endpoint link-status colors.
- **Editor UX**: per-road Rule selector (`OdrRoadPropertyEditor`); session default traffic rule
  for new roads + "Apply to all roads" (road-creation tool panel).
- **Tests**: LHT variants cover `connecting-road-builder`, `planJunctionCreation`,
  `regenerateJunctionConnections`, `buildRoutingOverrides`, `resolveTaperSDirection`,
  `resolveSignalOrientation` and the arrow-placement helper; E2E covers the default-rule flow
  and the arrow overlay (RHT/LHT screenshots).

## How to Apply (for any contributor touching traffic-direction logic)

When working on any code that depends on driving direction (lane selection, junction
connections, gizmo direction), branch on the road's `rule` via the existing helpers — never
hardcode RHT and never re-derive the XOR. Mesh generation and graph traversal are
rule-independent by design; do not add rule branching there. Mixed-rule junctions currently
resolve per incoming road, with junction-wide decisions (outer-edge pairs, routing presets)
following the first endpoint's rule.

# Proposal: LHT (Left-Hand Traffic) Support

Add left-hand-traffic support across the editor. Planned as the next major feature after the junction creation tool.

## Motivation

The OpenSCENARIO and OpenDRIVE specs both support RHT (right-hand traffic) and LHT (left-hand traffic) via the `<header>` `rule` attribute. The editor is currently RHT-only, which limits its usefulness for creating scenarios in **UK, Japan, Australia**, and other LHT regions.

## Foundations Already in Place

Some groundwork has already landed in `connecting-road-builder.ts`:

- `RoadEndpoint.trafficRule` field added.
- `computeRoadEndpoint()` accepts a `trafficRule` parameter and flips incoming-lane selection accordingly.
- `getReceivingLanes()` already branches on RHT / LHT.

> Verify line numbers against current source — this proposal predates several refactors.

## Remaining Work

1. **UI toggle** for traffic rule in the header editor.
2. **Road mesh rendering** — lane order and lane-marking direction.
3. **Auto-junction detection** — `checkForIntersections` lane pairing must respect traffic rule.
4. **Lane editing tools** — taper direction must flip for LHT.
5. **3D viewer** — driving-direction arrows and endpoint colors must reflect rule.
6. **Test coverage** — LHT variants in `connecting-road-builder` and `junction-operations`.

## How to Apply (for any contributor touching traffic-direction logic)

When working on any code that depends on driving direction (lane selection, junction connections, mesh rendering, gizmo direction), ensure RHT / LHT branching is in place. Don't hardcode RHT assumptions.

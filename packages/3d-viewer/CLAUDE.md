# packages/3d-viewer — Three.js visualization rules

## Before Editing 3D Properties

Always confirm the target before modifying:
- Which mesh/object? (housing, bulb, pole, signal head, etc.)
- Which property? (width, height, depth, radius, color, position)
- Which axis? (X, Y, Z — clarify if ambiguous)

**Ask the user if any of the above are unclear.** Wrong-axis edits are the #1 source of rework in this package.

## Coordinate System

- Three.js: Y-up, right-handed
- OpenDRIVE: Z-up — conversion happens at the boundary
- Signal/sign positions are in road (s,t) coordinates, resolved to world XYZ

## Testing

Run `pnpm --filter @osce/3d-viewer test` after changes.
Visually verify with Playwright screenshot for geometry/material changes.

# Lane Edit Tool — Operation Manual

## Overview

The Lane Edit Tool provides interactive lane editing in the 3D viewport.
Activate it by clicking **Lane** in the top toolbar.

When active, three **sub-modes** appear:

| Icon | Sub-mode | Purpose |
|------|----------|---------|
| +/- | **Add/Remove** | Click to add lanes, right-click to add/remove |
| Scissors | **Split** | Click to split a lane section at any point |
| Triangle | **Taper** | Two-click to create a smooth taper transition |

Press **ESC** at any time to return to Add/Remove sub-mode or cancel an in-progress operation.

---

## 1. Add/Remove Mode (Default)

### Hover
- Move cursor over a road in the 3D view
- The toolbar shows: `s: 45.2m  Section: 1  Lane: -1`
- The road and section are auto-selected

### Left-click: Add Lane
- Click on a lane to add a new outer lane on the clicked side
- A taper section is automatically generated before the target section (if room allows)

### Right-click: Context Menu
- **On a lane**: Shows options to add lane left/right, or delete the lane
- **On road surface**: Shows option to split section at that position

### Section Boundary Drag
- When a road has multiple sections, orange dashed lines appear at section boundaries
- **Drag the orange sphere** along the road to move a section boundary
- The boundary snaps with a minimum section length of 1m
- If the adjacent section contains a taper, the polynomial coefficients are automatically recalculated
- A white dashed guideline shows the new position during drag

---

## 2. Split Mode

Splits a lane section at an arbitrary s-position.

### Operation
1. Click **Split** in the sub-mode toolbar
2. Hover over a road — a **red dashed line** appears perpendicular to the road at the cursor position
3. **Click** to split the section at that position
4. The section is divided into two, each inheriting the lane properties of the original

### Notes
- The red preview line follows the road geometry accurately (works on curves, arcs, spirals)
- Minimum distance from existing boundaries: 1m
- Splitting near a junction connection is blocked
- Splitting a taper section preserves the taper shape exactly (Hermite interpolation)

### Keyboard
- **ESC**: Return to Add/Remove mode

---

## 3. Taper Mode

Creates a smooth lane width transition (taper) between two points on the road.

### Toolbar Options

| Option | Description |
|--------|-------------|
| **+Lane** | Lane is added (width 0 → 3.5m from driver's perspective) |
| **-Lane** | Lane is removed (width 3.5m → 0 from driver's perspective) |
| **Outer** | New lane is placed on the road edge (outermost) |
| **Inner** | New lane is placed next to center line (e.g., turn lane) |

Click each option to toggle.

### Direction and Side Logic
- For **right lanes** (travel with increasing s): +Lane = width grows along s-direction
- For **left lanes** (travel against s-direction): +Lane = width grows against s-direction (automatically flipped)
- This means "+Lane" always means "lane appears ahead" from the driver's perspective

### Operation

```
Step 1: Click start point
  Toolbar: "Click road to set taper start"
  → Click on road surface (the clicked side determines left/right)

Step 2: Click end point
  Toolbar: "Start: s=30.0m · Click to set end · ESC cancel"
  → Click further along the road

Step 3: Taper is created automatically
```

### Visual Feedback
- **Green solid line**: marks the start point (on target side only)
- **Yellow dashed line**: follows the cursor showing the end point
- **Purple semi-transparent band**: highlights the taper range on the target side

### Inner Taper (Turn Lanes)
When **Inner** is selected:
- The new lane is inserted next to the center line
- Existing lanes are renumbered outward by 1
- Example (RHT, right side): lanes -1, -2 → new -1 (turn lane), old -1 becomes -2, old -2 becomes -3

### Notes
- Taper can span across existing section boundaries (polynomial is distributed correctly)
- Minimum taper length: 1m
- The S-curve polynomial ensures smooth transitions (zero derivative at both endpoints)
- Undo with **Ctrl+Z** (single undo step for the entire taper creation)

### Keyboard
- **ESC**: Cancel the current taper operation (returns to waiting for start point)
- **ESC** again: Return to Add/Remove mode

---

## 4. Cross-Section Width Drag

In the **Cross Section** panel (bottom of the editor), you can drag lane edges to change width.

### Operation
1. Select a road (hover or click in 3D view with Lane tool active)
2. In the Cross Section panel, hover over a lane's outer edge — cursor changes to ↔
3. **Drag** left/right to resize the lane
4. Width snaps to 0.25m increments
5. A live preview shows the new width in meters during drag
6. Minimum width: 0.5m

### Notes
- Only changes the constant width coefficient (`a`); polynomial shape (`b`, `c`, `d`) is preserved
- Undo supported via **Ctrl+Z**

---

## Keyboard Shortcuts Summary

| Key | Context | Action |
|-----|---------|--------|
| **ESC** | Taper (start picked) | Cancel start point selection |
| **ESC** | Split / Taper mode | Return to Add/Remove sub-mode |
| **Ctrl+Z** | Any | Undo last operation |
| **Ctrl+Shift+Z** | Any | Redo |

---

## Toolbar Layout Reference

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [Select] [Road] [Lane] │ [+Add/Remove] [✂Split] [△Taper]  +Lane  Outer │      │
│  ← Main tools →        │  ← Sub-modes →                   ← Taper opts → │ s:… │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Technical Details

### Taper Polynomial
Width transitions use a cubic Hermite S-curve:
```
w(ds) = a + b·ds + c·ds² + d·ds³
```
Where `a = startWidth`, `b = 0`, `c = 3·Δw/L²`, `d = -2·Δw/L³`.
This gives zero derivatives at both endpoints for smooth visual blending.

### Section Split with Taper Preservation
When splitting a taper section, value AND derivative are preserved at the split point using general Hermite interpolation:
```
hermiteCubic(p0, m0, p1, m1, L):
  a = p0,  b = m0
  c = 3(p1-p0)/L² - 2m0/L - m1/L
  d = -2(p1-p0)/L³ + (m0+m1)/L²
```
A cubic has exactly 4 DOF matching 4 constraints → shape is preserved exactly.

### Cross-Segment Taper
When a taper range spans multiple pre-existing sections, the global polynomial is evaluated at each section's offset to produce exact sub-range coefficients. No shape discontinuity at boundaries.

### Inner Taper Lane Renumbering
When inserting an inner lane, existing lanes on the same side are renumbered outward by 1:
- Left side: all IDs increase by 1 (e.g., 1→2, 2→3)
- Right side: all IDs decrease by 1 (e.g., -1→-2, -2→-3)
The new lane takes the innermost ID (1 for left, -1 for right).

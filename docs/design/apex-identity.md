# APEX Design Identity

The OpenSCENARIO Editor uses the **APEX** visual identity. This document is the source of truth for brand, color, typography, and the cursor light system. The implementation lives in [packages/theme-apex/](../../packages/theme-apex/) and the final mockup is [docs/mockups/design-apex-v4.html](../mockups/design-apex-v4.html).

For day-to-day APEX usage rules (Tailwind tokens, `rounded-none`, etc.), see [STYLE_GUIDE.md](../STYLE_GUIDE.md).

## Brand

- **Name**: APEX (racing-term resonance)
- **Positioning**: Game / Tech aesthetic with a next-gen automotive influence

## Theme

- **Mode**: Dark only
- **Density**: Low density, spacious
- **Corners**: Sharp (0px border-radius — `rounded-none`)

## Colors

- **Background base**: Deep dark purple `#0D0A1A`
- **Accent**: Desaturated dawn lavender
- **Accent vivid**: `--accent-vivid: rgba(167, 139, 250, 0.9)`
- **Secondary accent**: `--accent-2: rgba(129, 140, 248, 0.85)`

## Typography

- **Display / Headings**: Orbitron (geometric, angular)
- **Body**: Exo 2 (geometric, readable)
- **Japanese**: M PLUS 1p
- All loaded via Google Fonts CDN

## Glass / Panels

- Glassmorphism: `backdrop-filter: blur(28px) saturate(1.3)` + semi-transparent purple background
- Sharp edges (0px radius)
- Dividers: VOLT-style neon glow lines (purple gradient)

## Cursor Light System (Dual)

The APEX UI features a two-layer cursor light system that gives panels a sense of physical surface and edge.

### Wide light (surface + edge)

- **Range**: 400px
- **JS detection range**: 340px (`wideMax`)
- **Color**: `rgba(184, 171, 235)` with multi-stop falloff
  - 0.018 → 0.008 @ 30% → 0.002 @ 60%
- **Renders as**: ambient overlay (`.cursor-light` div) + `::before` surface reflection on panels

### Hot light (edge-only specular)

- **Range**: 150px (CSS gradient radius)
- **JS detection range**: 225px (`hotMax`)
- **Hue**: Rose Lavender (dawn pink, hue ~310–320°)
- **Gradient** (luminosity-dependent saturation):
  - 0%: `rgba(255, 235, 245, 0.95)` — near white (high luminosity, low saturation)
  - 25%: `rgba(255, 190, 225, 0.50)` — warm lavender
  - 55%: `rgba(255, 140, 210, 0.22)` — rose purple (low luminosity, high saturation)
  - 100%: transparent
- **Edge-only via CSS mask trick**: `padding: 2px; -webkit-mask-composite: xor; mask-composite: exclude`
- **Renders as**: `::after` pseudo-element on `.glass`, `.node`, `.tpl-card`
- NOT visible on the surface (removed from `.cursor-light` overlay)

## Animations

- Entrance / transition only — no constant animations
- Panel fade-in, hover glow

## Implementation Notes

- `::before` = wide light surface reflection
- `::after` = hot light edge-only specular
- CSS custom properties updated by JS on `mousemove` via `requestAnimationFrame`:
  `--local-x`, `--local-y`, `--light-intensity`, `--hot-intensity`
- Node editor background: line grid (28px spacing, subtle purple)

## Mockup Evolution

The APEX identity went through several iterations before being finalized:

| # | File | Notes |
|---|---|---|
| 1 | `design-a-apex.html` | Original APEX proposal |
| 2 | `design-b-grid.html` | GRID proposal (rejected) |
| 3 | `design-c-volt.html` | VOLT proposal (atmosphere adopted) |
| 4 | `design-apex-v2.html` | APEX base + VOLT atmosphere merge |
| 5 | `design-apex-v3.html` | Dual light system, edge specular, grid |
| 6 | **`design-apex-v4.html`** | **Final** — tuned falloff, rose lavender specular, hot light edge-only |

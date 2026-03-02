# @osce/theme-apex

APEX design identity theme — dark glass-morphism UI with cursor-reactive light effects.

Built for **React 19 + Tailwind CSS v4 + Vite**.

## Quick Start

### 1. Install

```bash
pnpm add @osce/theme-apex
```

### 2. Import CSS

In your entry CSS file (**before** `@import "tailwindcss"`):

```css
@import "@osce/theme-apex/styles";
@import "tailwindcss";
```

> Order matters. The `@theme` block must be loaded before Tailwind processes utility classes.

### 3. Add Cursor Light

Place `<CursorLight />` once at your app root:

```tsx
import { CursorLight } from '@osce/theme-apex';

function App() {
  return (
    <>
      <CursorLight />
      {/* your app */}
    </>
  );
}
```

This renders:
- A 400px radial ambient glow that follows the cursor
- Two static atmospheric gradient orbs (top-right, bottom-left)
- Per-element surface reflections on all `.glass` and `.glass-item` elements

## React Components

### `<GlassPanel>`

Frosted glass container with cursor-reactive edge reflections.

```tsx
import { GlassPanel } from '@osce/theme-apex';

<GlassPanel>Default panel</GlassPanel>
<GlassPanel variant="elevated">Elevated panel</GlassPanel>
<GlassPanel variant="active">Active/selected panel</GlassPanel>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'elevated' \| 'active'` | `'default'` | Glass intensity level |
| `className` | `string` | — | Additional CSS classes |
| `ref` | `Ref<HTMLDivElement>` | — | Forwarded ref |

### `<CursorLight>`

Global cursor light system. Renders ambient overlays and activates mouse tracking.

```tsx
import { CursorLight } from '@osce/theme-apex';
```

No props. Place once at app root.

### `useCursorLight()`

Low-level hook if you need cursor tracking without the overlay divs.

```tsx
import { useCursorLight } from '@osce/theme-apex';
```

Sets these CSS custom properties:
- `:root` — `--mx`, `--my` (cursor position in px)
- `.glass`, `.glass-item` elements — `--local-x`, `--local-y`, `--light-intensity`, `--hot-intensity`

## CSS Classes

### Glass System

| Class | Description |
|-------|-------------|
| `.glass` | Base frosted glass panel (28px blur, cursor-reactive `::before`/`::after`) |
| `.glass-elevated` | Higher contrast glass with mid-brightness edge |
| `.glass-active` | Selected state with full glow |
| `.glass-item` | Lightweight glass for list items (no backdrop-filter) |
| `.glass-item.selected` | Selected item with gradient + inset glow |

### Dividers & Decorators

| Class | Description |
|-------|-------------|
| `.header-glow` | Bottom-edge neon line divider |
| `.statusbar-glow` | Top-edge neon line divider |
| `.node-editor-grid` | 28px grid background with radial fade |
| `.apex-tab` | Orbitron uppercase tab (use with `data-state="active"`) |

### Ambient Overlays

| Class | Description |
|-------|-------------|
| `.cursor-light` | Full-screen cursor-following glow (rendered by `<CursorLight>`) |
| `.ambient-1` | Static gradient orb, top-right |
| `.ambient-2` | Static gradient orb, bottom-left |

## Tailwind Utilities

### Fonts

| Utility | Font |
|---------|------|
| `font-display` | Orbitron (geometric, technical headings) |
| `font-mono` | JetBrains Mono (code, data) |

Body text uses Exo 2 / M PLUS 1p by default (set on `body`).

### Glow Effects

| Utility | Description |
|---------|-------------|
| `glow-sm` | Subtle purple glow |
| `glow-md` | Medium glow |
| `glow-lg` | Prominent glow |
| `glow-edge` | Minimal 1px edge glow |

### Dividers

| Utility | Description |
|---------|-------------|
| `divider-glow` | Horizontal 1px gradient line with glow |
| `divider-glow-v` | Vertical 1px gradient line with glow |

### Entrance Animations

| Utility | Description |
|---------|-------------|
| `enter` | Fade in + slide up (0.45s) |
| `enter-l` | Fade in + slide from left (0.4s) |
| `enter-r` | Fade in + slide from right (0.4s) |
| `d1`–`d6` | Animation delay increments (60ms steps) |

```html
<div class="enter d1">First</div>
<div class="enter d2">Second</div>
<div class="enter d3">Third</div>
```

### Scrollbar

| Class | Description |
|-------|-------------|
| `panel-scroll` | Thin 3px scrollbar styled with glass-edge color |

## Design Tokens

All tokens are available as Tailwind utilities (`bg-glass-1`, `text-text-primary`, etc.) and CSS variables (`var(--color-glass-1)`).

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#0C081D` | App background |
| `foreground` | `rgba(255,255,255,0.93)` | Primary text |
| `primary` | `#B8ABEB` | Interactive elements |
| `destructive` | `#E88A8A` | Error/delete |
| `success` | `#5DD8A8` | Success state |
| `warning` | `#E8C942` | Warning state |
| `info` | `#88B8E8` | Info state |
| `accent-vivid` | `#9B84E8` | Bright accent |
| `accent-2` | `#7B88E8` | Secondary accent |
| `accent-bright` | `#D0C6F2` | High-contrast accent |

### Glass Layers

| Token | Opacity | Usage |
|-------|---------|-------|
| `glass-1` | 0.48 | Base panel |
| `glass-2` | 0.40 | Elevated panel |
| `glass-3` | 0.32 | Lightest glass |
| `glass-node` | 0.85 | Dense node cards |
| `glass-hover` | 0.48 | Hover state |
| `glass-active` | 0.52 | Active state |

### Glass Edges

| Token | Opacity | Usage |
|-------|---------|-------|
| `glass-edge` | 0.07 | Default border |
| `glass-edge-mid` | 0.14 | Hover border |
| `glass-edge-bright` | 0.22 | Selected border |
| `glass-edge-active` | 0.32 | Focus border |

### Text Hierarchy

| Token | Opacity | Usage |
|-------|---------|-------|
| `text-primary` | 0.93 | Body text |
| `text-secondary` | 0.48 | Labels, captions |
| `text-tertiary` | 0.20 | Hints, placeholders |

### Fonts

| Token | Stack |
|-------|-------|
| `font-display` | Orbitron |
| `font-body` | Exo 2, M PLUS 1p |
| `font-mono` | JetBrains Mono, Fira Code |

## Design Rules

- **Radius**: `0px` everywhere (sharp corners are part of the APEX identity)
- **Blur**: 28px backdrop-filter on glass panels
- **Fonts**: All SIL Open Font License (OFL 1.1)
- **Dark only**: APEX is a dark theme; no light mode variant

## Base Layer Effects

The theme automatically applies:
- `body` — background color, text color, Exo 2 font, antialiasing
- `body::before` — subtle fractal noise grain overlay (0.016 opacity)
- `*` — default border color (`border-border`)

## Requirements

| Dependency | Version |
|------------|---------|
| React | ^19.0.0 |
| Tailwind CSS | ^4.0.0 |
| Vite | ^6.0.0 (with `@tailwindcss/vite`) |

## License

Fonts are licensed under SIL Open Font License (OFL 1.1).

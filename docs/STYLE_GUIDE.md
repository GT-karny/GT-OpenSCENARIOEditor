# APEX Style Guide

> Styling rules for the OpenSCENARIO Editor UI.
> All components must follow these rules for visual consistency.
> For the brand and visual concept behind APEX (colors, typography, cursor light system), see [design/apex-identity.md](design/apex-identity.md).

## 1. Corner Radius

**Rule: All corners are sharp (`rounded-none` / 0px).**

The APEX theme sets `--radius: 0px`. No component should use `rounded-sm`, `rounded-md`, or `rounded-lg`.

| Allowed | Forbidden |
|---------|-----------|
| `rounded-none` (or omit — 0px is default) | `rounded-sm`, `rounded-md`, `rounded-lg` |
| `rounded-full` (badges/pills only) | Any other border-radius |

## 2. Color References

**Rule: Always use CSS variable tokens. Never use raw hex or Tailwind semantic tokens.**

```tsx
// ✅ Correct
className="bg-[var(--color-glass-1)]"
className="text-[var(--color-text-primary)]"
className="border-[var(--color-glass-edge-mid)]"

// ❌ Wrong — raw hex
className="bg-[#9B84E8]"
className="text-red-400"

// ❌ Wrong — shadcn semantic tokens (outside of ui/ components)
className="bg-muted"
className="hover:bg-accent/50"
className="text-muted-foreground"
```

**Exception**: shadcn/ui primitive components (`apps/web/src/components/ui/`) may use shadcn tokens (`bg-primary`, `bg-muted`, etc.) since they are the bridge layer.

### Color Token Quick Reference

| Purpose | Token |
|---------|-------|
| Panel background | `--color-glass-1` (main), `--color-glass-2` (elevated), `--color-glass-3` (subtle) |
| Hover | `--color-glass-hover` |
| Active / Selected | `--color-glass-active` |
| Border (default) | `--color-glass-edge` |
| Border (hover) | `--color-glass-edge-mid` |
| Border (bright) | `--color-glass-edge-bright` |
| Border (active) | `--color-glass-edge-active` |
| Text | `--color-text-primary` (93%), `--color-text-secondary` (48%), `--color-text-tertiary` (20%) |
| Accent | `--color-accent-vivid` (#9B84E8), `--color-accent-2` (#7B88E8), `--color-accent-bright` (#D0C6F2) |
| Accent dim (bg) | `--color-accent-dim` |
| Deep background | `--color-bg-void`, `--color-bg-deep` |
| Node cards | `--color-glass-node`, `--color-glass-node-hover`, `--color-glass-node-active` |
| Semantic | `--color-success`, `--color-warning`, `--color-destructive`, `--color-info` |

## 3. Panels & Containers

| Element | Class | Blur |
|---------|-------|------|
| Main panel | `.glass` | `backdrop-blur-[28px]` (built-in) |
| Header / Statusbar | `.glass` + `backdrop-blur-[40px]` | 40px (override) |
| Elevated panel | `.glass-elevated` | inherits from `.glass` |
| Active/selected panel | `.glass-active` | inherits from `.glass` |
| Popover / Context menu | `bg-[var(--color-popover)] backdrop-blur-[28px]` | 28px |

## 4. Interactive Elements

### List Items
```tsx
// Use .glass-item for all interactive list items
className="glass-item px-3 py-2"

// Selected state — add "selected" class
className={`glass-item px-3 py-2 ${selected ? 'selected' : ''}`}
```

### Buttons
- Use shadcn `<Button>` with `variant="ghost"` as the default
- Icon-only buttons: `size="icon"` or `size="sm"`
- Destructive actions: `variant="destructive"`

### Hover States
```tsx
// ✅ Correct
className="hover:bg-[var(--color-glass-hover)]"

// ❌ Wrong
className="hover:bg-muted"
className="hover:bg-accent/50"
```

### Focus States
```tsx
// Standard focus ring
className="focus-visible:ring-1 focus-visible:ring-ring"
```

## 5. Shadows & Glow

**Rule: Use APEX glow utilities instead of manual `box-shadow`.**

| Utility | Effect |
|---------|--------|
| `glow-sm` | Subtle ambient glow (selected items) |
| `glow-md` | Medium glow (hover emphasis) |
| `glow-lg` | Strong glow (active/focused) |
| `glow-edge` | 1px edge highlight |

```tsx
// ✅ Correct
className="glow-sm"

// ❌ Wrong — manual box-shadow
style={{ boxShadow: '0 0 5px rgba(155, 132, 232, 0.12)' }}
```

## 6. Typography

| Element | Font | Class |
|---------|------|-------|
| Headings / Labels (display) | Orbitron | `font-display` |
| Body text | Exo 2 / M PLUS 1p | (default — no class needed) |
| Code / Mono | JetBrains Mono | `font-mono` |

### Text Sizing
- Property editor labels: `text-xs` (12px)
- Input values: `text-sm` (14px)
- Compact badges/indicators: `text-[10px]`
- Tab labels: `text-[10px] font-display uppercase tracking-wider`

## 7. Spacing

| Context | Pattern |
|---------|---------|
| Between form sections | `space-y-3` or `space-y-4` |
| Between fields in a section | `space-y-2` |
| Panel inner padding | `p-3` or `px-3 py-2` |
| Gap between inline elements | `gap-1`, `gap-1.5`, `gap-2` |

## 8. Animations

**Rule: Use APEX entrance animations for appearing elements.**

| Animation | Use for | Class |
|-----------|---------|-------|
| Fade up | Panels, dialogs | `enter` |
| Slide from left | Left sidebar content | `enter-l` |
| Slide from right | Right sidebar content | `enter-r` |

Stagger delays for lists: `d1` through `d6` (60ms increments).

```tsx
// Panel appearing with staggered children
<div className="enter">
  <div className="enter d1">First</div>
  <div className="enter d2">Second</div>
</div>
```

## 9. Segmented Controls

```tsx
// Container
className="flex gap-0.5 p-0.5 bg-[var(--color-glass-2)] rounded-none"

// Item (inactive)
className="flex-1 px-2 py-1 text-[10px] font-medium rounded-none transition-all"

// Item (active)
className="... bg-[var(--color-glass-active)] text-[var(--color-text-primary)] glow-edge"
```

## 10. Tabs

**Rule: All tab bars must use the `apex-tab` class via Radix UI Tabs components. Never build custom tab buttons with inline styles.**

```tsx
// ✅ Correct — Radix Tabs with apex-tab class
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="bg-[var(--color-glass-1)] backdrop-blur-[28px] rounded-none p-0">
    <TabsTrigger value="tab1" className="apex-tab flex-1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2" className="apex-tab flex-1">Tab 2</TabsTrigger>
  </TabsList>
</Tabs>

// ❌ Wrong — custom button with inline tab styles
<button className="relative px-4 py-1.5 text-xs font-medium">
  Tab
  <span className="absolute bottom-0 left-0 right-0 h-px bg-[var(--color-accent-1)]" />
</button>
```

## 11. Dividers

**Rule: Never use plain `border-b` or `border-t` without a color. Never use white/bright divider lines (`border-white`, `border-[#fff]`, `bg-white`). Always specify an APEX token or use a glow divider.**

| Context | Pattern |
|---------|---------|
| Panel header (below) | `<div className="divider-glow" />` |
| Resize handle (vertical) | `<div className="divider-glow-v h-5" />` |
| Section separator | `border-t border-[var(--color-glass-edge)]` or `border-b border-[var(--color-glass-edge)]` |
| List item separator | `border-b border-[var(--color-glass-edge)]` or use `space-y-0.5` gap instead |
| Sub-section heading underline | `border-b border-[var(--color-glass-edge)] pb-1` |

```tsx
// ✅ Panel header — glow divider
<div className="px-3 py-2">
  <h3>Panel Title</h3>
</div>
<div className="divider-glow" />

// ✅ Section separator — glass edge
<div className="pt-2 border-t border-[var(--color-glass-edge)]">

// ✅ List items — glass edge
<div className="border-b border-[var(--color-glass-edge)] last:border-b-0">

// ❌ Wrong — plain border (no color specified)
<div className="pb-2 border-b">
<div className="pt-1 border-t">
```

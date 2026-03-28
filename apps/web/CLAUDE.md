# apps/web — Frontend-specific rules

## APEX Styling Rules (see `docs/STYLE_GUIDE.md` for full guide)

- **Corner radius**: Always `rounded-none` (0px). Never use `rounded-sm`, `rounded-md`, `rounded-lg`. Exception: `rounded-full` for badges/pills only.
- **Colors**: Always use CSS variable tokens (`bg-[var(--color-glass-1)]`, `text-[var(--color-text-primary)]`). Never use raw hex or shadcn tokens (`bg-muted`, `hover:bg-accent`) outside of `components/ui/`.
- **Hover**: Use `hover:bg-[var(--color-glass-hover)]`. Never use `hover:bg-muted` or `hover:bg-accent/50`.
- **Shadows**: Use `glow-sm` / `glow-md` / `glow-lg` utilities. Never use manual `box-shadow` with inline styles.
- **Panels**: Use `.glass` class (28px blur built-in). Header/statusbar use `backdrop-blur-[40px]`.
- **List items**: Use `.glass-item` class with `selected` modifier for selection state.
- **Animations**: Use `enter` / `enter-l` / `enter-r` with delay classes `d1`–`d6` for appearing elements.
- **Tabs**: All tab bars must use Radix UI `<Tabs>` + `<TabsTrigger className="apex-tab">`. Never build custom tab buttons with inline styles.
- **Dividers**: Never use plain `border-b` or `border-t` without a color. Never use white/bright divider lines (`border-white`, `bg-white`). Panel headers use `<div className="divider-glow" />`. Section separators use `border-[var(--color-glass-edge)]`. List items use `border-[var(--color-glass-edge)]` or spacing (`space-y-0.5`).

## Component Organization

- Components: `src/components/`
- Hooks: `src/hooks/`
- Stores: `src/stores/`
- WASM simulation: `src/lib/wasm/`
- shadcn/ui wrappers in `src/components/ui/` — these may use shadcn tokens internally

## UX Principle

Every UI element must be instantly understandable at first glance. Labels, icons, and layout should make purpose obvious without tooltips or documentation.

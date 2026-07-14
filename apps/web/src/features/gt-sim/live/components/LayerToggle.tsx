/**
 * `LayerToggle` — small label chip toggling a `LiveSceneView` overlay layer.
 *
 * Ported from the fork's `components/liveScene/LayerToggle.tsx`. Same
 * `{ label, active, onClick }` API; restyled with APEX `var(--color-*)` tokens
 * and `rounded-none` instead of the fork's bare Tailwind color names / rounded
 * corners (`docs/STYLE_GUIDE.md`).
 */
export function LayerToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-0.5 rounded-none text-[10px] font-medium transition-colors backdrop-blur-sm border ${
        active
          ? 'bg-[var(--color-accent-vivid)]/80 text-[var(--color-bg-void)] border-[var(--color-glass-edge-active)]'
          : 'bg-[var(--color-glass-2)]/70 text-[var(--color-text-tertiary)] border-[var(--color-glass-edge)] hover:bg-[var(--color-glass-hover)]'
      }`}
    >
      {label}
    </button>
  );
}

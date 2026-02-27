import { useCursorLight } from '@/hooks/use-cursor-light';

/**
 * APEX cursor light system — renders ambient overlays and
 * initializes the global mouse-tracking hook.
 *
 * Place this component once at the app root level (before EditorLayout).
 */
export function CursorLight() {
  useCursorLight();

  return (
    <>
      {/* 400px radial ambient glow following cursor */}
      <div className="cursor-light" />
      {/* Static ambient gradient — top right */}
      <div className="ambient-1" />
      {/* Static ambient gradient — bottom left */}
      <div className="ambient-2" />
    </>
  );
}

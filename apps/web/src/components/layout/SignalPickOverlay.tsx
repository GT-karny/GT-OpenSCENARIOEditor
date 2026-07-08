import { useEditorStore } from '../../stores/editor-store';

/**
 * Overlay shown over the 3D viewer while Signal Pick mode is active.
 * Renders the cyan border highlight and the bottom action bar; both Done and
 * Cancel exit pick mode via the editor store.
 */
export function SignalPickOverlay() {
  return (
    <>
      {/* Bright cyan border overlay — clearly distinct from default accent */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 0 3px #00e5ff, inset 0 0 20px 0 rgba(0,229,255,0.2)',
        }}
      />
      {/* Bottom bar (RouteEditOverlay style) */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2"
        style={{
          backgroundColor: 'rgba(10, 25, 35, 0.94)',
          border: '1px solid rgba(0, 229, 255, 0.5)',
          backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap',
          pointerEvents: 'auto',
        }}
      >
        <span
          className="inline-block size-2 rounded-full animate-pulse"
          style={{ backgroundColor: '#00e5ff' }}
        />
        <span
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: '#00e5ff' }}
        >
          Signal Pick
        </span>
        <span style={{ color: 'rgba(0,229,255,0.3)' }}>|</span>
        <span className="text-[11px] text-[var(--color-text-secondary)]">
          Click signals to add / remove
        </span>
        <span style={{ color: 'rgba(0,229,255,0.3)' }}>|</span>
        <button
          type="button"
          className="px-3 py-1 text-[11px] font-medium text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#00b8d4' }}
          onClick={() => useEditorStore.getState().exitSignalPickMode()}
        >
          Done
        </button>
        <button
          type="button"
          className="px-3 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-glass-2)] hover:bg-[var(--color-glass-hover)] transition-colors"
          onClick={() => useEditorStore.getState().exitSignalPickMode()}
        >
          Cancel
        </button>
      </div>
    </>
  );
}

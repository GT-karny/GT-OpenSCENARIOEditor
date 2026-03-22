import { useState, useEffect } from 'react';

// Windows-standard SVG icons for titlebar (no external dependency)
function MinimizeIcon() {
  return (
    <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
      <rect width="10" height="1" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0.5" y="0.5" width="9" height="9" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0.5" y="2.5" width="7" height="7" />
      <polyline points="2.5,2.5 2.5,0.5 9.5,0.5 9.5,7.5 7.5,7.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2">
      <line x1="0" y1="0" x2="10" y2="10" />
      <line x1="10" y1="0" x2="0" y2="10" />
    </svg>
  );
}

const btnBase =
  'inline-flex items-center justify-center w-[46px] h-8 text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)] transition-colors';

/**
 * Window control buttons (minimize/maximize/close) for Electron custom titlebar.
 * Always rendered; buttons call electronAPI which is a no-op in browser mode.
 */
export function WindowControls() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    window.electronAPI?.windowIsMaximized().then(setMaximized);
    const unsubscribe = window.electronAPI?.onMaximizedChanged(setMaximized);
    return () => {
      unsubscribe?.();
    };
  }, []);

  return (
    <div className="flex items-center h-full shrink-0 electron-no-drag">
      <button type="button" onClick={() => window.electronAPI?.windowMinimize()} className={btnBase} aria-label="Minimize">
        <MinimizeIcon />
      </button>
      <button type="button" onClick={() => window.electronAPI?.windowMaximize()} className={btnBase} aria-label={maximized ? 'Restore' : 'Maximize'}>
        {maximized ? <RestoreIcon /> : <MaximizeIcon />}
      </button>
      <button
        type="button"
        onClick={() => window.electronAPI?.windowClose()}
        className="inline-flex items-center justify-center w-[46px] h-8 text-[var(--color-text-secondary)] hover:bg-[#e81123] hover:text-white transition-colors"
        aria-label="Close"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

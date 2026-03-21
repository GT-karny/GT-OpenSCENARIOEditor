import { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';

/**
 * Window control buttons (minimize/maximize/close) for Electron custom titlebar.
 * Rendered inside HeaderToolbar when running in Electron.
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
    <div
      className="flex items-center h-full -mr-6"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <button
        type="button"
        onClick={() => window.electronAPI?.windowMinimize()}
        className="inline-flex items-center justify-center w-[46px] h-full text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)] transition-colors"
        aria-label="Minimize"
      >
        <Minus size={16} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => window.electronAPI?.windowMaximize()}
        className="inline-flex items-center justify-center w-[46px] h-full text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)] transition-colors"
        aria-label={maximized ? 'Restore' : 'Maximize'}
      >
        {maximized ? <Copy size={14} strokeWidth={1.5} /> : <Square size={14} strokeWidth={1.5} />}
      </button>
      <button
        type="button"
        onClick={() => window.electronAPI?.windowClose()}
        className="inline-flex items-center justify-center w-[46px] h-full text-[var(--color-text-secondary)] hover:bg-[#e81123] hover:text-white transition-colors"
        aria-label="Close"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

/**
 * Toolbar with zoom, fit, and auto-layout actions.
 */

import { useReactFlow } from '@xyflow/react';
import { useAutoLayout } from '../hooks/use-auto-layout.js';

export interface NodeEditorToolbarProps {
  className?: string;
}

export function NodeEditorToolbar({ className }: NodeEditorToolbarProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const { runLayout } = useAutoLayout();

  return (
    <div className={`flex items-center gap-1 p-1 bg-white/80 backdrop-blur rounded-lg shadow-sm border ${className ?? ''}`}>
      <button
        onClick={() => zoomIn()}
        className="px-2 py-1 text-xs rounded hover:bg-gray-100"
        title="Zoom In"
      >
        +
      </button>
      <button
        onClick={() => zoomOut()}
        className="px-2 py-1 text-xs rounded hover:bg-gray-100"
        title="Zoom Out"
      >
        -
      </button>
      <button
        onClick={() => fitView({ padding: 0.2 })}
        className="px-2 py-1 text-xs rounded hover:bg-gray-100"
        title="Fit View"
      >
        Fit
      </button>
      <div className="w-px h-4 bg-gray-300" />
      <button
        onClick={() => runLayout()}
        className="px-2 py-1 text-xs rounded hover:bg-gray-100"
        title="Auto Layout"
      >
        Layout
      </button>
    </div>
  );
}

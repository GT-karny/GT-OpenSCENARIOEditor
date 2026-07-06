/**
 * Background grid + crosshair for the assembly configurator canvas.
 * Origin (0,0) = pole tip, Y positive downward.
 */

interface AssemblyCanvasGridProps {
  gridSize: number; // metres
  showGrid: boolean;
  /** Visible area in metres (for grid extent). */
  extent: number;
}

export function AssemblyCanvasGrid({ gridSize, showGrid, extent }: AssemblyCanvasGridProps) {
  const lines: React.ReactNode[] = [];
  const gridExtent = Math.ceil(extent / gridSize) * gridSize;

  if (showGrid) {
    // Vertical grid lines
    for (let x = -gridExtent; x <= gridExtent; x += gridSize) {
      lines.push(
        <line
          key={`v${x}`}
          x1={x}
          y1={-gridExtent}
          x2={x}
          y2={gridExtent}
          stroke="var(--color-glass-edge)"
          strokeWidth={0.005}
          opacity={0.4}
        />,
      );
    }
    // Horizontal grid lines
    for (let y = -gridExtent; y <= gridExtent; y += gridSize) {
      lines.push(
        <line
          key={`h${y}`}
          x1={-gridExtent}
          y1={y}
          x2={gridExtent}
          y2={y}
          stroke="var(--color-glass-edge)"
          strokeWidth={0.005}
          opacity={0.4}
        />,
      );
    }
  }

  return (
    <g>
      {lines}
      {/* Origin crosshair */}
      <line
        x1={-gridExtent}
        y1={0}
        x2={gridExtent}
        y2={0}
        stroke="var(--color-accent-vivid)"
        strokeWidth={0.008}
        opacity={0.6}
      />
      <line
        x1={0}
        y1={-gridExtent}
        x2={0}
        y2={gridExtent}
        stroke="var(--color-accent-vivid)"
        strokeWidth={0.008}
        opacity={0.6}
      />
      {/* Origin marker */}
      <circle cx={0} cy={0} r={0.02} fill="var(--color-accent-vivid)" opacity={0.8} />
    </g>
  );
}

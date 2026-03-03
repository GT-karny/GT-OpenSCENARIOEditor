interface GroundLineProps {
  /** Y position in SVG coords (where z=0 maps to) */
  y: number;
  /** Start X in SVG coords */
  x1: number;
  /** End X in SVG coords */
  x2: number;
}

export function GroundLine({ y, x1, x2 }: GroundLineProps) {
  return (
    <line
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke="rgba(255,255,255,0.08)"
      strokeWidth={1}
      strokeDasharray="4,3"
    />
  );
}

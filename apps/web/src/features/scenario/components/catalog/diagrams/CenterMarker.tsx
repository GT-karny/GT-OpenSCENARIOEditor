interface CenterMarkerProps {
  x: number;
  y: number;
  size?: number;
  highlighted?: boolean;
}

export function CenterMarker({ x, y, size = 6, highlighted = false }: CenterMarkerProps) {
  const stroke = highlighted ? '#5DD8A8' : 'rgba(93,216,168,0.50)';

  return (
    <g>
      <line
        x1={x - size}
        y1={y}
        x2={x + size}
        y2={y}
        stroke={stroke}
        strokeWidth={0.8}
      />
      <line
        x1={x}
        y1={y - size}
        x2={x}
        y2={y + size}
        stroke={stroke}
        strokeWidth={0.8}
      />
      <circle
        cx={x}
        cy={y}
        r={2}
        fill="none"
        stroke={stroke}
        strokeWidth={0.8}
      />
    </g>
  );
}

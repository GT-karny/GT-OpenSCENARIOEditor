import type { Position, TrajectoryVertex } from '@osce/shared';
import { Trash2 } from 'lucide-react';
import { Input } from '../../ui/input';

export interface TrajectoryVertexListItemProps {
  index: number;
  vertex: TrajectoryVertex;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTimeChange: (time: number | undefined) => void;
}

function formatPosition(position: Position): string {
  switch (position.type) {
    case 'lanePosition':
      return `Road ${position.roadId}, Lane ${position.laneId}, s=${position.s.toFixed(1)}`;
    case 'worldPosition':
      return `(${position.x.toFixed(1)}, ${position.y.toFixed(1)})`;
    case 'roadPosition':
      return `Road ${position.roadId}, s=${position.s.toFixed(1)}, t=${position.t.toFixed(1)}`;
    case 'relativeLanePosition':
      return `Rel ${position.entityRef} dLane=${position.dLane}`;
    case 'relativeRoadPosition':
      return `Rel ${position.entityRef} ds=${position.ds.toFixed(1)}`;
    case 'relativeObjectPosition':
      return `Rel ${position.entityRef} (${position.dx.toFixed(1)}, ${position.dy.toFixed(1)})`;
    case 'relativeWorldPosition':
      return `Rel ${position.entityRef} (${position.dx.toFixed(1)}, ${position.dy.toFixed(1)})`;
    case 'geoPosition':
      return `Geo (${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)})`;
    default:
      return (position as Position).type;
  }
}

export { formatPosition };

export function TrajectoryVertexListItem({
  index,
  vertex,
  isSelected,
  onSelect,
  onDelete,
  onTimeChange,
}: TrajectoryVertexListItemProps) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-none border px-2 py-1 cursor-pointer transition-colors ${
        isSelected
          ? 'border-[var(--color-glass-edge-active)] bg-[var(--color-accent-dim)]'
          : 'border-[var(--color-glass-edge)] hover:border-[var(--color-glass-edge-mid)] hover:bg-[var(--color-glass-hover)]'
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Index badge */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-none bg-muted text-[10px] font-semibold text-muted-foreground">
        #{index + 1}
      </span>

      {/* Position summary */}
      <span className="flex-1 truncate text-xs text-foreground">
        {formatPosition(vertex.position)}
      </span>

      {/* Time input */}
      <Input
        value={vertex.time ?? ''}
        placeholder="--"
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') {
            onTimeChange(undefined);
          } else {
            const parsed = parseFloat(v);
            if (!isNaN(parsed)) onTimeChange(parsed);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className="h-6 w-[56px] shrink-0 text-[10px] text-center px-1"
        title="Time (s)"
      />

      {/* Delete button */}
      <button
        type="button"
        className="shrink-0 p-0.5 text-muted-foreground hover:text-destructive transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete vertex"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

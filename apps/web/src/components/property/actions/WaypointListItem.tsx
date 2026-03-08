import type { Position, RouteStrategy } from '@osce/shared';
import { Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

interface Waypoint {
  position: Position;
  routeStrategy: string;
}

export interface WaypointListItemProps {
  index: number;
  waypoint: Waypoint;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onStrategyChange: (strategy: RouteStrategy) => void;
}

const ROUTE_STRATEGIES: RouteStrategy[] = ['shortest', 'fastest', 'leastIntersections', 'random'];

function formatPosition(position: Position): string {
  switch (position.type) {
    case 'lanePosition':
      return `Road ${position.roadId}, Lane ${position.laneId}, s=${position.s.toFixed(1)}`;
    case 'worldPosition':
      return `(${position.x.toFixed(1)}, ${position.y.toFixed(1)})`;
    default:
      return position.type;
  }
}

export function WaypointListItem({
  index,
  waypoint,
  isSelected,
  onSelect,
  onDelete,
  onStrategyChange,
}: WaypointListItemProps) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-sm border px-2 py-1 cursor-pointer transition-colors ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
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
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-muted text-[10px] font-semibold text-muted-foreground">
        #{index + 1}
      </span>

      {/* Position summary */}
      <span className="flex-1 truncate text-xs text-foreground">
        {formatPosition(waypoint.position)}
      </span>

      {/* Strategy select */}
      <Select
        value={waypoint.routeStrategy}
        onValueChange={(v) => onStrategyChange(v as RouteStrategy)}
      >
        <SelectTrigger
          className="h-6 w-[100px] shrink-0 text-[10px] border-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROUTE_STRATEGIES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Delete button */}
      <button
        type="button"
        className="shrink-0 p-0.5 text-muted-foreground hover:text-destructive transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete waypoint"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
